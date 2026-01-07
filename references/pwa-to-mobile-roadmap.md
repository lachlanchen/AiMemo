# Converting LightMind & EchoMind PWAs to Native Mobile (iOS/Android)

This document captures what we already have, how to configure the local simulator environments, and the concrete tasks required to ship native builds (alongside the existing PWAs).

---

## 1. Current Assets

| Project | Location | Frontend | Backend | Notes |
|---------|----------|----------|---------|-------|
| **AISecretary** | `~/ProjectsLFS/EmailAssistant` | React Native / Expo app (new) | Tornado + PostgreSQL (`backend/`) | Already targets web + native via Expo. |
| **LightMind Cognition** | `~/ProjectsLFS/lightmind_cognition/pwa_app` (`static/`, `server.py`) | Vanilla PWA (HTML/CSS/JS) served by Flask-like Python backend | Python (Flask/Tornado style) | Needs mobile wrapper. |
| **EchoMind Voice Chatbot** | `~/ProjectsLFS/voice_chatbot/static` + `templates/` | PWA (HTML/JS) | Tornado HTTPS WebSocket server | Heavy audio pipeline; needs packaging for mobile clients. |

The Expo application (AISecretary) already demonstrates the target stack. The two legacy PWAs need to either:

1. Be reimplemented in React Native/Expo (best UX, deeper integration), or
2. Be wrapped inside an Expo WebView shell (fastest path to “native” distribution).

---

## 2. Simulator Environment (what's already set up)

You now have both simulators working:

* **Android (Ubuntu host)** — as documented in [`docs/mobile-setup.md`](mobile-setup.md). The key steps already done:
  * Installed Android Studio + SDK (via snap) and CLI tools.
  * Set `ANDROID_HOME` / `ANDROID_SDK_ROOT` in `.env`, which `scripts/load-env.sh` exports for tmux sessions.
  * Created and booted the `Pixel_Android_14` AVD.

* **iOS (Mac)** — configured per [`docs/mac-ios-simulator.md`](mac-ios-simulator.md), including:
  * Xcode installed and license accepted.
  * `nvm` pinned to Node 20.
  * watchman installed to avoid `EMFILE` errors.
  * Expo Go updated on Simulator, dependency alignment resolved (`expo-font`, TypeScript ~5.3.3).

For day-to-day work you can:

```bash
# From Ubuntu: push + sync + start iOS Expo
./scripts/push-and-sync-mac.sh
ssh lachlanchen@192.168.1.122 'cd ~/Local/AISecretary && ./scripts/run-mac-simulator.sh'

# On Ubuntu: Android emulator
npx expo start --android   # or ./scripts/dev-session.sh (with env)
```

---

## 3. Converting LightMind Cognition (PWA → Mobile)

### Option A – Rebuild UI in React Native (recommended)

1. **Analyse static assets** under `pwa_app/static` to understand layout/components.
2. **Create an Expo screen** in the AISecretary app (or a new Expo workspace) replicating the UI using RN components (with `react-native-web` to keep PWA).
3. **Factor out shared API calls** (if any) into TypeScript modules so the same logic can be reused on native.
4. **Use Expo Router** or React Navigation to integrate the new screen.
5. **Ensure backend endpoints** from LightMind server are accessible over HTTPS (update `.env` with `LIGHTMIND_API_URL`).
6. **Testing**: run `npx expo start --ios` and `--android`, verifying interactions with backend.
7. **Deployment**: once UI parity is achieved, keep the original PWA served for web browsers. (Expo web build can replace the original HTML if desired.)

### Option B – WebView wrapper (fastest)

1. Add `react-native-webview` to the Expo app (`npx expo install react-native-webview`).
2. Create screens that load `https://<lightmind-host>/` inside WebView.
3. Handle storage/cookies if necessary (ensure backend allows mobile origins).
4. Potential trade-offs: offline support, push notifications, performance limited by web payload.

### Additional tasks

* Update Python backend CORS to allow native origins (`expo://`, `https://lightmind-app/`).
* Document new `.env` variables for mobile builds (`LIGHTMIND_PUBLIC_URL`).
* Consider migrating authentication to token-based flow to support mobile logins.

---

## 4. Converting EchoMind Voice Chatbot

This app has heavier requirements (recording, WebSocket, streaming audio). Priorities:

1. **Abstract API Layer**: define a typed client (TypeScript) for the WebSocket protocol. (Currently only implemented in vanilla JS.)
2. **Choose the RN audio libraries**:
   * Use Expo’s `expo-av` for recording/playback, or `react-native-webrtc` if low latency streaming is needed.
   * Confirm if GPT-SoVITS audio streaming can be handled via base64 chunks or needs file storage.
3. **Authentication Flow**: replicate login/register/logout screens in RN (call existing endpoints).
4. **State management**: use Zustand/React Query similar to AISecretary for conversations/settings.
5. **Language enhancement UI**: port the furigana and highlights logic into RN components (or reuse via WebView if necessary).
6. **Offline/local storage**: ensure SQLite or MMKV mirrors current server-side storage if offline mode is desired.

### Minimal viable path (WebView)

* Like LightMind, you could wrap the current PWA inside WebView to ship a “native shell”.
* However, microphone access and autoplay can be problematic in WebViews; native RN implementation is strongly recommended.

### Backend adjustments

* Ensure Tornado server is reachable from mobile (handle HTTPS certs, potentially use ngrok when testing).
* If GPU servers are remote, consider env variables for mobile App to point there.
* Add CORS/websocket origin checks for mobile scheme (e.g. `exp://`).

---

## 5. Managing Backends & Frontends

### Shared configuration

* The `.env` now includes `BACKEND_PUBLIC_URL`, `FRONTEND_PUBLIC_URL`, plus you can add:
  ```ini
  LIGHTMIND_PUBLIC_URL=https://...
  ECHOMIND_PUBLIC_URL=https://...
  ```
  Scripts (`scripts/load-env.sh`) automatically export them to tmux sessions.

* On macOS, `run-mac-simulator.sh` already reads `.env`; extend it to inject `LIGHTMIND_PUBLIC_URL`/`ECHOMIND_PUBLIC_URL` into Expo via `EXPO_PUBLIC_LIGHTMIND_URL`, etc.

### Monorepo vs. multi-repo

* Consider creating an Expo monorepo (using pnpm workspaces or Expo’s multi-app config) to host AISecretary, LightMind, and EchoMind mobile clients side-by-side.
* Keep backend servers (`lightmind_cognition`, `voice_chatbot`) as separate Python services managed via systemd or Docker. Document start commands and env requirements in their respective READMEs.

### Deployment strategy

1. **PWA**: continue serving existing PWAs for web users.
2. **Native**:
   * Use Expo Application Services (EAS) `build` and `submit`.
   * Maintain `.env.mobile` files for production endpoints; use `EAS Secrets` for API keys.
3. **Testing**: integrate backend staging URLs so native apps can point to QA servers without affecting production.

---

## 6. Task Breakdown (What’s left to do)

| Area | Tasks | Status |
|------|-------|--------|
| **Environment** | Android + iOS simulators configured | ✅ done |
| **LightMind mobile** | Decide RN vs WebView approach, implement UI/logic, expose APIs, update backend CORS | ☐ |
| **EchoMind mobile** | RN audio stack, websocket client, auth UI, language enhancements, backend tweaks | ☐ |
| **Shared code** | Extract API clients, type definitions, consistent `.env` usage across projects | ☐ |
| **Automation** | Expand scripts to run backend servers remotely, add `run-lightmind.sh`, `run-echomind.sh` for mac | ☐ |
| **Deployment** | Set up EAS builds, documentation for testers, CI/CD | ☐ |

---

## 7. Next Steps

1. Create Expo feature branches for LightMind and EchoMind integration.
2. Start with WebView prototypes to demo functionality quickly.
3. Incrementally replace WebView with native components (priority: audio pipeline for EchoMind).
4. Coordinate backend endpoints (HTTPS certificates, CORS, authentication tokens).
5. Once stable, prepare EAS build profiles for dev/test/production.

With the current documentation and scripts, you can iterate on each frontend in Expo while continuing to support the existing PWAs. Use this roadmap as the canonical checklist for the conversion effort. ***
