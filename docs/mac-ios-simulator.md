# Run AISecretary on macOS (iOS Simulator)

These steps assume:

- You already installed **Xcode** from the Mac App Store and opened it at least once.
- Command line tools are available (`xcode-select --install` and `sudo xcodebuild -license` have been run).
- You have **Node.js ≥ 18** (via nvm, Homebrew, or the Node installer).

## 1. Clone and install dependencies

```bash
git clone git@github.com:lachlanchen/AISecretary.git
cd AISecretary/app
npm install
```

## 2. Copy environment configuration

The project expects a `.env` file at the repository root. Copy it from your Linux machine or create one manually:

```ini
# AISecretary/.env
BACKEND_PUBLIC_URL=https://ai-backend.lazying.art
FRONTEND_PUBLIC_URL=https://ai.lazying.art
EXPO_PUBLIC_API_URL=https://ai-backend.lazying.art
```

If you are running the backend locally on the Mac, set `BACKEND_PUBLIC_URL` / `EXPO_PUBLIC_API_URL` to that host (for example `http://127.0.0.1:8787`).

## 3. Optional: run the backend locally

```bash
cd ~/AISecretary/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
# configure DATABASE_AI_URL or POSTGRES_* in .env
python -m aisecretary.app
```

Skip this step if you are using the existing ngrok backend (`https://ai-backend.lazying.art`).

## 4. Launch Expo in the iOS simulator

From the `app/` folder:

```bash
npx expo start --ios
```

Expo will read `.env`, bundle the project, and open the default iPhone simulator. Use the Metro CLI hints:

- `r` to reload the app
- `j` to open the debugger
- `w` to open the web build

## 5. Troubleshooting

- If the simulator does not open automatically, launch it manually (`open -a Simulator`) and rerun `npx expo start --ios`.
- Ensure `.env` contains the correct public URLs; otherwise the app will point to localhost.
- If you changed `.env`, restart the Expo server to pick up the new values.
- For native builds (TestFlight / App Store), use `eas build --platform ios` or Xcode, providing the same environment variables.

With these steps the AISecretary Expo client will run in Xcode’s iOS Simulator on macOS. Adjust the backend URL as needed to target local or remote services.
