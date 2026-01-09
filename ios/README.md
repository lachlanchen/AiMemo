# AiMemo iOS

SwiftUI app that talks to the Tornado backend.

## Requirements
- macOS with Xcode 15+
- `xcodegen` (install with `brew install xcodegen`)

## Generate the Xcode project

```bash
cd ios
xcodegen generate
open AiMemo.xcodeproj
```

## Configure

Update these values in `ios/AiMemo/Resources/Info.plist`:

- `API_BASE_URL` (use `http://localhost:8799` for simulator)
- `GOOGLE_CLIENT_ID` (optional; Google sign-in wiring is TODO)
- `APPLE_CLIENT_ID` (use the app bundle ID for Sign in with Apple)

Enable the "Sign in with Apple" capability in Xcode if you want Apple auth.

## Run

Select a simulator in Xcode and press Run.

## Notes
- Email/password auth is wired to `/auth/register` and `/auth/login`.
- Apple sign-in posts the `id_token` to `/auth/oauth/apple`.
- Google sign-in is a placeholder for now.
