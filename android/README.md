# AiMemo Android

Jetpack Compose app wired to the Tornado backend.

## Requirements
- Android Studio Hedgehog (or newer)
- Android SDK 34+
- JDK 17

## Open in Android Studio

1. Open the `android/` folder as a project.
2. Let Android Studio sync Gradle.
3. Run on emulator or device.

If Gradle sync fails, run `./gradlew --version` once to bootstrap the wrapper.

## Configure

Update `android/app/src/main/res/values/strings.xml`:
- `api_base_url` (use `http://10.0.2.2:8799` for the Android emulator)

## Notes
- Email/password auth is wired to `/auth/register` and `/auth/login`.
- OAuth buttons are placeholders and require SDK integration.
