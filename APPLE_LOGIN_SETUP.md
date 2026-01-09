# Apple Sign‑In Setup for AiMemo (Step‑by‑Step)

This guide covers Apple Sign‑In for PWA (web) and iOS, and how it connects to the AiMemo backend.

## 0) Prerequisites

- Apple Developer account.
- Your domain `memo.lazying.art` available for verification.
- Backend running and reachable (local dev): `http://localhost:8799`.

## 1) Create an App ID (iOS)

1. Apple Developer → **Certificates, Identifiers & Profiles** → **Identifiers** → **+**.
2. Choose **App IDs** → **App**.
3. Bundle ID: `art.lazying.memo`.
4. Enable **Sign in with Apple**.
5. Save.

This App ID is used by the iOS app. The bundle ID is the iOS audience.

## 2) Create a Service ID (Web / PWA)

1. Apple Developer → **Identifiers** → **+**.
2. Choose **Services IDs**.
3. Identifier: `art.lazying.memo.web` (example).
4. Save.
5. Click the Service ID → **Configure**.
6. Enable **Sign in with Apple**.
7. Add **Website URL**: `https://memo.lazying.art`.
8. Add **Return URL**: `https://memo.lazying.art/auth/apple/callback`.
9. Save.

The Service ID is the web audience for PWA login.

## 3) Configure backend

Edit `backend/.env`:

```
APPLE_CLIENT_ID=art.lazying.memo.web
```

Restart the backend after changes.

> Note: The backend currently accepts a single `APPLE_CLIENT_ID`. If you want both iOS and web tokens validated, we can extend the backend to accept multiple audiences.

## 4) Configure PWA (web)

Create config file:

```bash
cd /home/lachlan/ProjectsLFS/AiMemo/pwa
cp config.example.js config.js
```

Edit `pwa/config.js`:

```
window.__APP_CONFIG__ = {
  API_BASE_URL: "http://localhost:8799",
  GOOGLE_CLIENT_ID: "",
  APPLE_CLIENT_ID: "art.lazying.memo.web",
  APPLE_REDIRECT_URI: "https://memo.lazying.art/auth/apple/callback",
};
```

For local testing, you can temporarily set:

```
APPLE_REDIRECT_URI: "http://localhost:8090/auth/apple/callback",
```

…but the Apple Service ID must whitelist that return URL.

## 5) Configure iOS app

In Xcode:

1. Open `ios/AiMemo.xcodeproj`.
2. Select the target → **Signing & Capabilities**.
3. Add **Sign in with Apple** capability.
4. Ensure bundle ID = `art.lazying.memo`.

In `ios/AiMemo/Resources/Info.plist`:

```
APPLE_CLIENT_ID = art.lazying.memo
```

## 6) Test flow checklist

1. Start backend: `python -m aimemo.app`
2. Start PWA: `python -m http.server 8090` in `pwa/`
3. Open `http://localhost:8090` → **Continue with Apple**.
4. For iOS, run the app in Xcode and tap the Apple sign‑in button.

## 7) Common issues

- **"invalid audience"**: backend expects `APPLE_CLIENT_ID` to match the token audience.
- **Popup blocked** in web: allow popups for `memo.lazying.art`.
- **Apple button not responding**: check that `APPLE_CLIENT_ID` and `APPLE_REDIRECT_URI` are set in `pwa/config.js`.

## 8) Optional: support multiple Apple audiences

If you want both iOS and web tokens verified, update the backend to accept multiple client IDs (e.g., `APPLE_CLIENT_IDS=["art.lazying.memo","art.lazying.memo.web"]`). I can implement this when you are ready.
