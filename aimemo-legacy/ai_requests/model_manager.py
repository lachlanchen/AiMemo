#!/usr/bin/env python3
"""
Shared Model Manager for Voice Chatbot
Loads models once and shares them across all WebSocket connections
Prevents GPU OOM errors when multiple clients connect
"""

import logging
import os
import threading
import time
from pathlib import Path
import whisper
import torch
import requests
from echomind import config as em_config
import asyncio

# Import your existing classes
from echomind.sovits_request import GPTSoVITSClient
from echomind.enhancements.japanese_enhancement import LanguageEnhancer
from echomind.enhancements.english_enhancement import EnglishLanguageEnhancer
from echomind.database import DatabaseManager
from echomind.ai_client_factory import build_with_fallback
from echomind.ai_config import load_ai_model_config

logger = logging.getLogger(__name__)

class SharedModelManager:
    """
    Singleton model manager that loads models once and shares them across connections
    Thread-safe with proper locking mechanisms
    """
    
    _instance = None
    _lock = threading.Lock()
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(SharedModelManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        with self._lock:
            if self._initialized:
                return
                
            logger.info("🏗️ Initializing Shared Model Manager...")
            
            # Model instances (shared across all connections)
            self.whisper_model = None
            self.openai_client = None
            self.sovits_client = None
            self.japanese_enhancer = None
            self.english_enhancer = None
            
            # Thread locks for model access
            self.whisper_lock = threading.Lock()
            self.openai_lock = threading.Lock()
            self.openai_setup_lock = threading.Lock()
            self.sovits_lock = threading.Lock()
            self.japanese_lock = threading.Lock()
            self.english_lock = threading.Lock()
            self.ai_mode = 'openai'

            # Whisper multi-instance pool (for multi-GPU or replica usage)
            self._whisper_instances = []  # list of dicts: { 'model': .., 'lock': Lock(), 'device': str }
            self._whisper_rr = 0
            self._whisper_pool_lock = threading.Lock()
            
            # Voice model configurations
            self.voice_models = {}
            self.voice_setup_lock = threading.Lock()
            self.user_voice_cache = {}

            # Initialization status
            self.models_loaded = {
                'whisper': False,
                'openai': False,
                'sovits': False,
                'japanese': False,
                'english': False
            }
            
            # Connection tracking
            self.active_connections = 0
            self.connection_lock = threading.Lock()
            
            self._initialized = True
            logger.info("✅ Shared Model Manager initialized")
    
    def load_models(self):
        """Load all models once - called during server startup"""
        logger.info("🚀 Loading shared models...")
        
        # Load Whisper model only if NOT using remote STT
        try:
            from echomind import config as em_config
            if em_config.use_remote_stt():
                self.models_loaded['whisper'] = False
                logger.info("🛑 Skipping local Whisper: remote STT enabled")
            else:
                if torch.cuda.is_available() and os.environ.get('DISABLE_WHISPER','0') != '1':
                    self._load_whisper_model()
                    try:
                        self._init_whisper_pool()
                    except Exception as e:
                        logger.warning(f"Whisper pool init skipped: {e}")
                else:
                    self.models_loaded['whisper'] = False
                    logger.info("🛑 Whisper disabled: no GPU detected or DISABLE_WHISPER=1")
        except Exception as e:
            logger.warning(f"Whisper init skipped: {e}")
        
        # Load OpenAI client
        self._load_openai_client()
        
        # Load SoVITS client only if NOT using remote TTS (we still point client to remote base_url)
        try:
            from echomind import config as em_config
            if em_config.use_remote_tts():
                # Create a client pointing to remote TTS base to keep existing API calls working
                logger.info("🎵 Using remote TTS base; initializing client without local weights")
                self._load_sovits_client()
            else:
                self._load_sovits_client()
        except Exception as e:
            logger.warning(f"SoVITS init note: {e}")
        
        # Load language enhancers
        self._load_language_enhancers()
        
        logger.info("✅ All shared models loaded successfully!")
        self._log_gpu_usage()
    
    def _load_whisper_model(self):
        """Load Whisper model with error handling"""
        try:
            logger.info("🎙️ Loading Whisper large-v3 model...")
            start_time = time.time()

            # Clear any existing model first
            if self.whisper_model is not None:
                del self.whisper_model
                torch.cuda.empty_cache()

            # Load base shared model on default device (GPU if available)
            self.whisper_model = whisper.load_model("large-v3")

            load_time = time.time() - start_time
            self.models_loaded['whisper'] = True
            logger.info(f"✅ Whisper model loaded in {load_time:.2f}s")
            
        except Exception as e:
            logger.error(f"❌ Whisper model loading failed: {e}")
            self.models_loaded['whisper'] = False
            # Try fallback to smaller model
            try:
                logger.info("🔄 Fallback to Whisper base model...")
                self.whisper_model = whisper.load_model("base")
                self.models_loaded['whisper'] = True
                logger.info("✅ Whisper base model loaded as fallback")
            except Exception as fallback_error:
                logger.error(f"❌ Whisper fallback failed: {fallback_error}")
                raise

    def _init_whisper_pool(self):
        """Initialize a small pool of Whisper model instances for parallelism.

        Strategy:
        - Prefer one instance per available GPU from WHISPER_DEVICES (e.g., "0,1").
        - If replicas per GPU > 1 (WHISPER_REPLICAS_PER_GPU), load additional copies per device.
        - Always keep at least one instance available (the base self.whisper_model).
        """
        if not self.models_loaded.get('whisper'):
            return
        enable_pool = (os.environ.get("WHISPER_ENABLE_POOL", "1").strip() != "0")
        if not enable_pool:
            return

        devices_env = os.environ.get("WHISPER_DEVICES")
        replicas_env = os.environ.get("WHISPER_REPLICAS_PER_GPU", "1")
        try:
            replicas_per_gpu = max(1, int(replicas_env))
        except Exception:
            replicas_per_gpu = 1

        devices: list[str] = []
        if devices_env:
            # explicit device list
            for d in devices_env.split(','):
                d = d.strip()
                if d:
                    if d.lower() == 'cpu' or not torch.cuda.is_available():
                        devices.append('cpu')
                    else:
                        devices.append(f'cuda:{d}')
        else:
            # auto-detect GPUs
            if torch.cuda.is_available():
                try:
                    gpu_count = torch.cuda.device_count()
                except Exception:
                    gpu_count = 1
                if gpu_count <= 0:
                    devices = ['cuda:0']
                else:
                    # if the user has two 4090s, this picks both 0 and 1 automatically
                    devices = [f'cuda:{i}' for i in range(gpu_count)]
            else:
                devices = ['cpu']

        # If we already built a pool, skip
        if self._whisper_instances:
            return

        instances = []
        # First, reuse the already-loaded base model as an instance if possible
        if self.whisper_model is not None:
            instances.append({
                'model': self.whisper_model,
                'lock': threading.Lock(),
                'device': 'auto'
            })

        # Then, add additional device-specific instances
        # We avoid duplicating 'auto' instance on cuda:0 if it already exists to save VRAM
        for dev in devices:
            # If device was 'auto' (already loaded), skip creating another for cuda:0
            # We always add for non-default GPUs (e.g., cuda:1)
            try:
                # When dev is 'cpu', safe to load multiple replicas only if asked explicitly
                for _ in range(replicas_per_gpu):
                    if dev == 'auto':
                        continue
                    # Avoid creating a duplicate for cuda:0 if base model likely resides there
                    if dev.startswith('cuda:0') and any(x.get('device') == 'auto' for x in instances):
                        continue
                    logger.info(f"🎙️ Loading Whisper instance on {dev}...")
                    m = whisper.load_model("large-v3", device=dev)
                    instances.append({'model': m, 'lock': threading.Lock(), 'device': dev})
            except Exception as e:
                logger.warning(f"Skipping Whisper instance on {dev}: {e}")

        if not instances:
            # As a hard fallback, keep single shared model if available
            if self.whisper_model is None:
                raise RuntimeError("Failed to initialize any Whisper instance")
            instances = [{ 'model': self.whisper_model, 'lock': threading.Lock(), 'device': 'auto' }]

        self._whisper_instances = instances
        logger.info(f"✅ Whisper pool ready with {len(self._whisper_instances)} instance(s): "
                    + ", ".join(x.get('device', '?') for x in self._whisper_instances))
    
    def _load_openai_client(self, force: bool = False):
        """Load AI client based on configured provider."""
        with self.openai_setup_lock:
            if not force and self.models_loaded.get('openai') and self.openai_client is not None:
                return
            cfg = load_ai_model_config()
            mode = cfg.get('mode')
            priority = cfg.get('priority')
            try:
                client, used_mode = build_with_fallback(
                    mode=mode,
                    priority=priority,
                    use_cache=True,
                    cache_dir="cachexxx/cache",
                    max_retries=3,
                )
                self.openai_client = client
                self.models_loaded['openai'] = True
                self.ai_mode = used_mode
                logger.info("✅ AI client loaded (%s)", used_mode)
            except Exception as exc:
                self.openai_client = None
                self.models_loaded['openai'] = False
                self.ai_mode = 'openai'
                logger.error(f"❌ AI client loading failed: {exc}")
                raise
    
    def _load_sovits_client(self):
        """Load SoVITS client and setup voice models"""
        try:
            logger.info("🎵 Loading SoVITS client...")
            # Point SoVITS client at remote TTS bridge if configured
            base_url = em_config.get_tts_base_url()
            self.sovits_client = GPTSoVITSClient(base_url=base_url, debug=False)
            self.models_loaded['sovits'] = True
            
            # Setup voice models
            self._setup_voice_models()
            
            logger.info("✅ SoVITS client loaded")
        except Exception as e:
            logger.error(f"❌ SoVITS client loading failed: {e}")
            self.models_loaded['sovits'] = False
    
    def _setup_voice_models(self):
        """Setup voice model configurations"""
        with self.voice_setup_lock:
            self.voice_models = {
                'ayano': {
                    'model_name': 'ayano',
                    'display_name': 'Ayano',
                    'icon': '🎀',
                    'ref_audio': '/home/lachlan/ProjectsLFS/GPT-SoVITS/TEMP/gradio/9beba057d75a73dca5beae92cd8880a651125e75134c9023c1265c5ca3f9f03d/video_577285626106741043-MTwVy1M3.mp3_0006542400_0006758400.wav',
                    'ref_text': 'Thank you for today.今日はありがとう。Let\'s have more days like this together.',
                    'ref_lang': 'ja',
                    'usage': 'girlfriend voice - warm and caring'
                },
                'lazyingart': {
                    'model_name': 'lazyingart', 
                    'display_name': 'Lazyingart',
                    'icon': '🎯',
                    'ref_audio': '/home/lachlan/ProjectsLFS/GPT-SoVITS/DATA/reference_last9p5s.wav',
                    'ref_text': '我准备好了，let\'s start，始めましょう。おはようございます，早上好，good morning. umm, okay, see you.',
                    'ref_lang': 'auto',
                    'usage': 'alternative voice - educational'
                }
            }
            
            # Add models to SoVITS client
            if self.sovits_client:
                try:
                    self.sovits_client.add_model(
                        'ayano',
                        'GPT_weights_v2ProPlus/ayano-e15.ckpt',
                        'SoVITS_weights_v2ProPlus/ayano_e8_s40.pth'
                    )
                    logger.info("✅ Voice models added to SoVITS client")
                except Exception as e:
                    logger.error(f"❌ Voice model setup error: {e}")
    
    def _load_language_enhancers(self, force: bool = False):
        """Load language enhancement models"""
        # Load configured enhancement models (OpenAI side)
        try:
            cfg = load_ai_model_config()
            enh_models = (cfg.get('enhancement_models') or {})
            enh_openai_model = str(enh_models.get('openai') or 'gpt-4o-mini')
        except Exception:
            enh_openai_model = 'gpt-4o-mini'

        # Japanese enhancer
        try:
            if force or not self.models_loaded.get('japanese'):
                logger.info("🇯🇵 Loading Japanese language enhancer...")
                self.japanese_enhancer = LanguageEnhancer(
                    openai_model=enh_openai_model,
                    max_retries=3
                )
                self.models_loaded['japanese'] = True
                logger.info("✅ Japanese language enhancer loaded")
        except Exception as e:
            logger.error(f"❌ Japanese enhancer loading failed: {e}")
            self.models_loaded['japanese'] = False
        
        # English enhancer
        try:
            if force or not self.models_loaded.get('english'):
                logger.info("🇬🇧 Loading English language enhancer...")
                self.english_enhancer = EnglishLanguageEnhancer(
                    openai_model=enh_openai_model,
                    max_retries=3
                )
                self.models_loaded['english'] = True
                logger.info("✅ English language enhancer loaded")
        except Exception as e:
            logger.error(f"❌ English enhancer loading failed: {e}")
            self.models_loaded['english'] = False
    
    def _log_gpu_usage(self):
        """Log current GPU memory usage"""
        try:
            if torch.cuda.is_available():
                gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
                gpu_allocated = torch.cuda.memory_allocated(0) / 1024**3
                gpu_reserved = torch.cuda.memory_reserved(0) / 1024**3
                
                logger.info(f"🔥 GPU Memory - Total: {gpu_memory:.2f}GB, "
                          f"Allocated: {gpu_allocated:.2f}GB, "
                          f"Reserved: {gpu_reserved:.2f}GB")
        except Exception as e:
            logger.warning(f"Could not get GPU info: {e}")
    
    def register_connection(self):
        """Register a new WebSocket connection"""
        with self.connection_lock:
            self.active_connections += 1
            logger.info(f"🔗 Connection registered. Active connections: {self.active_connections}")
    
    def unregister_connection(self):
        """Unregister a WebSocket connection"""
        with self.connection_lock:
            self.active_connections = max(0, self.active_connections - 1)
            logger.info(f"🔗 Connection unregistered. Active connections: {self.active_connections}")
    
    # Thread-safe model access methods
    def get_whisper_model(self):
        """Get shared Whisper model with thread safety"""
        if not self.models_loaded['whisper']:
            # Whisper intentionally disabled (e.g., no GPU on server)
            return None, threading.Lock()
        return self.whisper_model, self.whisper_lock

    async def transcribe_async(self, audio_path: str, **kwargs) -> dict:
        """Run Whisper transcribe using a pool instance in a thread executor.

        kwargs are passed through to model.transcribe(). We ensure that a
        single model instance is not used concurrently by multiple threads.
        """
        # Remote STT path (preferred when set or when local whisper disabled)
        if em_config.use_remote_stt() or not self.models_loaded.get('whisper'):
            def _remote_work():
                try:
                    base = em_config.get_stt_base_url().rstrip('/')
                    url = base + "/transcribe"
                    logger.info(f"🔗 Remote STT: POST {url} file={audio_path}")
                    lang = kwargs.get('language')
                    files = { 'audio': open(audio_path, 'rb') }
                    data = {}
                    if lang:
                        data['language'] = lang
                    r = requests.post(url, files=files, data=data, timeout=60)
                    try:
                        files['audio'].close()
                    except Exception:
                        pass
                    r.raise_for_status()
                    j = r.json()
                    text = (j.get('text') or '').strip()
                    lang = j.get('language') or 'auto'
                    logger.info(f"✅ Remote STT OK: lang={lang} text='{text[:80]}'")
                    return { 'text': text, 'language': lang }
                except Exception as e:
                    logger.error(f"❌ Remote STT error: {e}")
                    return { 'text': '', 'language': 'auto' }
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, _remote_work)

        # Local Whisper path
        if not self._whisper_instances:
            # fallback to single model path with lock
            model, lock = self.get_whisper_model()
            if model is None:
                logger.info("🛑 No local Whisper instance available; remote STT not enabled")
                return { 'text': '', 'language': 'auto' }
            loop = asyncio.get_event_loop()
            def _work():
                with lock:
                    return model.transcribe(audio_path, **kwargs)
            return await loop.run_in_executor(None, _work)

        # choose next instance (round-robin)
        with self._whisper_pool_lock:
            idx = self._whisper_rr % len(self._whisper_instances)
            self._whisper_rr += 1
        inst = self._whisper_instances[idx]

        loop = asyncio.get_event_loop()
        def _work():
            with inst['lock']:
                return inst['model'].transcribe(audio_path, **kwargs)
        return await loop.run_in_executor(None, _work)
    
    def get_openai_client(self):
        """Get shared OpenAI client with thread safety"""
        if not self.models_loaded.get('openai') or self.openai_client is None:
            self._load_openai_client(force=True)
        if not self.models_loaded.get('openai') or self.openai_client is None:
            raise RuntimeError("AI client not loaded")
        return self.openai_client, self.openai_lock

    def reload_openai_client(self):
        """Force reload of AI client and refresh dependent enhancers."""
        self._load_openai_client(force=True)
        self._load_language_enhancers(force=True)

    def get_sovits_client(self):
        """Get shared SoVITS client with thread safety"""
        if not self.models_loaded['sovits']:
            raise RuntimeError("SoVITS client not loaded")
        return self.sovits_client, self.sovits_lock
    
    def get_japanese_enhancer(self):
        """Get shared Japanese enhancer with thread safety"""
        if not self.models_loaded['japanese']:
            return None, None
        return self.japanese_enhancer, self.japanese_lock
    
    def get_english_enhancer(self):
        """Get shared English enhancer with thread safety"""
        if not self.models_loaded['english']:
            return None, None
        return self.english_enhancer, self.english_lock
    
    def get_voice_models(self):
        """Get voice model configurations"""
        with self.voice_setup_lock:
            if not self.voice_models:
                self._setup_voice_models()
        return self.voice_models.copy()  # Return copy to prevent modification

    # --- Custom user voice helpers -------------------------------------------

    def _profile_to_config(self, profile):
        try:
            abs_path = profile.get('absolute_audio_path') or profile.get('ref_audio_path') or ''
            if not abs_path:
                return {}
            path = Path(abs_path)
            if not path.is_absolute():
                path = DatabaseManager._repo_root / path
            path = path.resolve()
        except Exception:
            return {}

        prompt_text = (profile.get('prompt_text') or '').strip()
        if not prompt_text:
            prompt_text = 'Hello, this is my personal voice sample.'

        return {
            'model_name': profile.get('model_name') or 'v2proplus',
            'display_name': profile.get('display_name') or profile.get('voice_key'),
            'icon': '🎙️',
            'ref_audio': path.as_posix(),
            'ref_text': prompt_text,
            'ref_lang': profile.get('prompt_language') or 'auto',
            'usage': 'custom user voice',
            'custom': True,
            'user_id': profile.get('user_id'),
            'voice_key': profile.get('voice_key'),
            'duration': profile.get('duration'),
            'sample_rate': profile.get('sample_rate')
        }

    def register_user_voice(self, profile):
        config = self._profile_to_config(profile)
        voice_key = profile.get('voice_key')
        if not voice_key or not config:
            return None
        with self.voice_setup_lock:
            self.user_voice_cache[voice_key] = config
        return config

    def remove_user_voice(self, voice_key: str) -> None:
        if not voice_key:
            return
        with self.voice_setup_lock:
            self.user_voice_cache.pop(voice_key, None)

    def get_voice_config(self, voice_key: str):
        if not voice_key:
            return None
        with self.voice_setup_lock:
            if voice_key in self.voice_models:
                return self.voice_models[voice_key].copy()
            if voice_key in self.user_voice_cache:
                return self.user_voice_cache[voice_key].copy()
        try:
            db = DatabaseManager()
            profile = db.get_user_voice_profile_by_key(voice_key)
        except Exception:
            profile = None
        if not profile:
            return None
        config = self.register_user_voice(profile)
        return config.copy() if config else None

    def get_user_voice_models(self, user_id: int):
        try:
            db = DatabaseManager()
            profiles = db.list_user_voice_profiles(int(user_id))
        except Exception:
            profiles = []
        result = {}
        for profile in profiles:
            config = self.register_user_voice(profile)
            if config:
                result[profile['voice_key']] = config.copy()
        return result

    def cleanup(self):
        """Cleanup models and free GPU memory"""
        logger.info("🧹 Cleaning up shared models...")
        
        try:
            if self.whisper_model is not None:
                del self.whisper_model
                self.whisper_model = None
            
            if hasattr(torch.cuda, 'empty_cache'):
                torch.cuda.empty_cache()
                
            logger.info("✅ Model cleanup completed")
        except Exception as e:
            logger.error(f"❌ Model cleanup error: {e}")
    
    def get_status(self):
        """Get current manager status"""
        return {
            'models_loaded': self.models_loaded.copy(),
            'active_connections': self.active_connections,
            'memory_info': self._get_memory_info(),
            'whisper_pool': {
                'instances': len(self._whisper_instances),
                'devices': [x.get('device') for x in self._whisper_instances],
            }
        }
    
    def _get_memory_info(self):
        """Get memory usage information"""
        try:
            if torch.cuda.is_available():
                return {
                    'gpu_total': torch.cuda.get_device_properties(0).total_memory / 1024**3,
                    'gpu_allocated': torch.cuda.memory_allocated(0) / 1024**3,
                    'gpu_reserved': torch.cuda.memory_reserved(0) / 1024**3
                }
        except:
            pass
        return {'gpu_available': False}

# Global instance
model_manager = SharedModelManager()
