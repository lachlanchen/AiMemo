# Run AISecretary on macOS (iOS Simulator)

This walkthrough captures the full setup—including every issue we hit on the first run—so the next developer can go from clone → simulator without surprises.

---

## 0. Requirements Checklist

* macOS (Apple Silicon or Intel) with **Xcode** already installed and opened once.
* Xcode CLI tools and license accepted:
  ```bash
  xcode-select --install           # skip if already installed
  sudo xcodebuild -license         # agree to license
  ```
* **Homebrew** installed (`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`).
* `.env` from the Ubuntu box (or recreate one manually – see step 2).

---

## 1. Clone the project

```bash
git clone git@github.com:lachlanchen/AISecretary.git
cd AISecretary
```

---

## 2. Copy / create `.env`

Place the environment file *at the repo root* (`AISecretary/.env`). The minimum contents when reusing the ngrok backends are:

```ini
BACKEND_PUBLIC_URL=https://ai-backend.lazying.art
FRONTEND_PUBLIC_URL=https://ai.lazying.art
EXPO_PUBLIC_API_URL=https://ai-backend.lazying.art
```

You can override these to point at a Mac-hosted backend later (e.g. `http://127.0.0.1:8787`). Expo scripts and the backend read from the same `.env`.

---

## 3. Install Node via `nvm` (Node 20 LTS)

The Expo SDK bundled here expects Node 20. Install `nvm` once and pin your default version:

```bash
# Install nvm (Homebrew)
brew install nvm
mkdir -p ~/.nvm

# Add to ~/.zshrc (adjust if you use bash)
cat <<'EOF' >> ~/.zshrc
export NVM_DIR="$HOME/.nvm"
[ -s "$(brew --prefix nvm)/nvm.sh" ] && . "$(brew --prefix nvm)/nvm.sh"
[ -s "$(brew --prefix nvm)/etc/bash_completion.d/nvm" ] && . "$(brew --prefix nvm)/etc/bash_completion.d/nvm"
EOF

source ~/.zshrc

# Install + use Node 20
nvm install 20
nvm use 20
nvm alias default 20

node -v   # should print v20.x
npm -v    # npm 10.x
```

> **Why?** Running on Node 23 triggered multiple Expo warnings and the Metro bundler crashed (`registerWebModule` undefined). Node 20 avoids those issues.

---

## 4. Install project dependencies (`app/`)

```bash
cd ~/Local/AISecretary/app
npm install
```

If, after installing matching versions, you still see warnings about `react-native`, `react-native-safe-area-context`, or `typescript`, run:

```bash
npx expo install react-native@0.74.5 react-native-safe-area-context@4.10.5 typescript@~5.3.3
```

(Expo ensures every package aligns with SDK 51.)

---

## 5. Install watchman (prevents `EMFILE: too many open files`)

Metro will watch many files; on macOS it often runs out of file watchers without watchman.

```bash
brew install watchman
```

If you ran Expo before watchman was in place, clean any root-owned state directories:

```bash
watchman shutdown-server
sudo rm -rf /usr/local/var/run/watchman /var/run/watchman
sudo rm -rf /private/tmp/watchman* /var/folders/*/*/*/watchman*
```

Then restart watchman:

```bash
watchman watch-del-all
watchman shutdown-server
```

Optional but helpful: raise the file descriptor limit in the terminal you’ll use:
```bash
ulimit -n 8192
```

---

## 6. Remove stray type packages

The doctor flagged `@types/react-native`—React Native ships with its own types already.

```bash
npm uninstall @types/react-native
```

---

## 7. Align Expo dependencies

Run Expo doctor so it can rewrite dependency versions if needed:

```bash
cd ~/Local/AISecretary/app
npx expo-doctor@latest . --fix-packages
```

Then reinstall after the fixes:

```bash
rm -rf node_modules package-lock.json
npm install
```

If Expo still warns about missing peer dependencies (e.g. `expo-font`), install them:

```bash
npx expo install expo-font
```

---

## 8. (Optional) Run the backend locally on macOS

If you prefer not to hit the ngrok backend:

```bash
cd ~/Local/AISecretary/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python -m aisecretary.app   # update DATABASE_AI_URL / POSTGRES_* first
```

Adjust the `.env` URLs so Expo points at `http://127.0.0.1:8787`.

---

## 9. Launch the iOS simulator

```bash
cd ~/Local/AISecretary/app
npx expo start --clear --ios
```

Tips:
- If Expo complains about Expo Go being outdated on the simulator, allow it to install the latest version.
- Should the simulator not pop up, start it manually (`open -a Simulator`) and hit `i` in the Expo CLI to retry.
- Press `j` in the CLI to open web-based logs/debugger.

---

## 10. Safari/web falls back to white screen?

If you see `TypeError: registerWebModule is not a function` in Safari:

1. Run the doctor fix (`expo-doctor` as above).
2. Ensure TypeScript is `~5.3.3` (Expo will install it automatically if you ran `expo install typescript@~5.3.3`).
3. Restart Expo with `--clear`.

After these steps the web build and simulator both load normally.

---

## 11. Troubleshooting checklist

| Symptom | Fix |
| ------- | --- |
| **EMFILE: too many open files, watch** | Install watchman, clear its state (`watchman shutdown-server`), bump `ulimit -n 8192`. |
| **Expo CLI says “Unable to find expo in this project”** | Run `npm install` in `app/`. |
| **Metro crashes with `registerWebModule` undefined** | Align dependencies using `npx expo-doctor . --fix-packages`, reinstall, install `expo-font`, use Node 20. |
| **Expo CLI errors about outdated packages** | `npx expo install react-native@<expected> …`, or rely on `expo-doctor`. |
| **Simctl timeout when opening exp:// URL** | Open Simulator manually, then press `i` in Expo CLI; ensure Metro is still running. |
| **White screen in simulator** | Check Chrome/Web inspector for JS errors (`press j`), usually caused by the dependency mismatch fixed above. |
| **258 warnings about deprecated npm packages** | Safe to ignore; they come from Expo’s current dependency graph. |

---

## 12. Verify success

In the simulator, you should see the login screen once you reload after Expo Go updates. Logs in the CLI should show API calls hitting `https://ai-backend.lazying.art/health`. You can also open Safari DevTools (⌥⌘I) when the Expo web app runs and confirm there are no red errors.

---

With the environment set up this way, re-running the project is now a matter of:

```bash
cd ~/Local/AISecretary/app
nvm use 20                  # only if not already default
npx expo start --ios
```

From there you can iterate on code, attach the debugger, or promote builds to EAS/TestFlight.
