# Google Login Setup for AiMemo (Step-by-Step)

This guide covers Google Sign‑In for the PWA and native apps, and how it connects to the AiMemo backend.

## 0) Prerequisites

- You already ran `gcloud init` and set the project:

```bash
gcloud projects list
gcloud config set project lazyingart
```

- Your backend is running and reachable (local dev):
  - `http://localhost:8799`

## 1) Create the OAuth consent screen (Console)

1. Open **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**.
2. Choose **External**.
3. Fill required fields:
   - App name: AiMemo
   - User support email
   - Developer contact email
4. **Authorized domains**: add `lazying.art`.
5. **Scopes**: add `openid`, `email`, `profile`.
6. **Test users**: add your Google account(s).
7. Save and publish (or keep in testing if you only need internal testing).

## 2) Create OAuth Client ID (Web)

1. Console → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
2. Application type: **Web application**.
3. Name: `AiMemo Web`.
4. **Authorized JavaScript origins**:
   - `http://localhost:8090`
   - `https://memo.lazying.art`
5. **Authorized redirect URIs** (for Apple web auth, add later; for Google web sign-in usually not required for GIS):
   - optional: `https://memo.lazying.art/auth/google/callback`
6. Click **Create** and copy the **Client ID**.

## 3) Configure backend + PWA

### Backend

Edit `backend/.env`:

```
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID
```

Then restart the backend.

### PWA

Create config:

```bash
cd /home/lachlan/ProjectsLFS/AiMemo/pwa
cp config.example.js config.js
```

Edit `pwa/config.js`:

```
window.__APP_CONFIG__ = {
  API_BASE_URL: "http://localhost:8799",
  GOOGLE_CLIENT_ID: "YOUR_WEB_CLIENT_ID",
  APPLE_CLIENT_ID: "",
  APPLE_REDIRECT_URI: "http://localhost:8090/auth/apple/callback",
};
```

## 4) Run and test (PWA)

```bash
# backend
conda activate ai
cd /home/lachlan/ProjectsLFS/AiMemo/backend
python -m aimemo.app

# pwa
cd /home/lachlan/ProjectsLFS/AiMemo/pwa
python -m http.server 8090
```

Open `http://localhost:8090` and click **Continue with Google**.

## 5) Android client ID (for native Android)

Create a separate OAuth client ID for Android:

1. Console → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
2. Application type: **Android**.
3. Package name: `art.lazying.memo`.
4. SHA‑1 fingerprint (debug build):

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the SHA‑1 into the form and save.

> Note: The backend currently validates a single `GOOGLE_CLIENT_ID` audience. For native apps, use the **web client ID** as the server audience and request an `id_token` with that ID.

## 6) iOS client ID (for native iOS)

Create an OAuth client ID for iOS:

1. Console → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
2. Application type: **iOS**.
3. Bundle ID: `art.lazying.memo`.

> Note: For the backend to verify, request the `id_token` using the **web client ID** as the audience.

## 7) Common issues

- **CORS error**: add the origin to `CORS_ALLOW_ORIGINS` in `backend/.env`.
- **"invalid audience"**: you’re sending an `id_token` for a different client ID. Use the **web client ID** for server verification.
- **Login works in PWA but not native**: make sure native SDK uses `serverClientID` (iOS) / `requestIdToken(webClientId)` (Android).

## 8) Quick reference commands

```bash
gcloud projects list
gcloud config set project lazyingart

# Backend
conda activate ai
cd /home/lachlan/ProjectsLFS/AiMemo/backend
python -m aimemo.app

# PWA
cd /home/lachlan/ProjectsLFS/AiMemo/pwa
python -m http.server 8090
```
