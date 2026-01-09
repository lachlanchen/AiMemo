# Quick Start

Copy/paste these commands to run the new AiMemo stack.

## Backend (Tornado + Postgres)

```bash
conda activate ai
cd /home/lachlan/ProjectsLFS/AiMemo/backend
cp .env.example .env
# edit backend/.env (DATABASE_URL, JWT_SECRET)
python -m aimemo.app
```

If you have shell overrides, clear them first:

```bash
unset DATABASE_URL JWT_SECRET
```

## PWA (static)

```bash
cd /home/lachlan/ProjectsLFS/AiMemo/pwa
cp config.example.js config.js
# edit pwa/config.js (API_BASE_URL + OAuth client IDs)
python -m http.server 8090
```

## iOS (macOS, SwiftUI)

```bash
cd /Users/lachlanchen/Local/AiMemo/ios
xcodegen generate
open AiMemo.xcodeproj
```

## Android (Jetpack Compose)

```bash
cd /home/lachlan/ProjectsLFS/AiMemo/android
./gradlew --version
```

Then open the `android/` folder in Android Studio and run on an emulator/device.
