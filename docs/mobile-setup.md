# Mobile Platform Prep

Follow these platform-specific checklists before you start building, testing, or releasing the Expo client. Complete both if you plan to maintain Android and iOS builds.

## Android (Ubuntu/Linux)

- **System packages**
  - `sudo apt update && sudo apt install -y openjdk-17-jdk build-essential libglu1-mesa`
- **Android Studio**
  - Download from https://developer.android.com/studio and install to `/opt/android-studio` or preferred location.
  - Launch Android Studio once to let it install the Android SDK, emulator images, and platform tools.
- **Environment variables**
  - Add to `~/.bashrc` or shell profile:
    ```bash
    export ANDROID_SDK_ROOT=$HOME/Android/Sdk
    export ANDROID_HOME=$ANDROID_SDK_ROOT
    export PATH=$PATH:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools
    ```
- **Emulator setup**
  - Through Android Studio’s Device Manager, create an Android 13+ virtual device (Pixel recommended).
  - Enable hardware virtualization in BIOS/UEFI if the emulator refuses to start.
- **USB debugging (optional for real devices)**
  - Enable Developer Options on the device, turn on USB debugging, install `adb` (`sudo apt install adb`), and authorize the host computer.
- **Expo tooling**
  - `npm install -g expo-cli` (optional) and verify `npx expo start --android` opens the emulator or attached device.
- **API access from emulator/device**
  - Set `EXPO_PUBLIC_API_URL` to use your host machine’s LAN IP (e.g., `http://192.168.1.10:8787`). `localhost` only works for PWA/web previews on the same machine.

## iOS (macOS)

- **macOS updates**
  - Update macOS to the latest stable release; Xcode requires current versions.
- **Xcode**
  - Install from the Mac App Store.
  - Launch Xcode once, accept the license, and install additional components.
  - Install command line tools: `xcode-select --install`.
- **CocoaPods**
  - `sudo gem install cocoapods` (required for native iOS dependencies).
- **Expo tooling**
  - Install Node.js ≥ 18 (`brew install node` or via nvm) and `npm install -g expo-cli` (optional).
  - Verify the iOS simulator works: `npx expo start --ios`.
- **API access from simulator/device**
  - Update `EXPO_PUBLIC_API_URL` to point at your backend host reachable from the simulator or physical device (e.g., `http://192.168.1.10:8787`). The default `localhost` works only when the backend runs on the same machine as the simulator.
- **Apple developer account**
  - Ensure you have an active Apple Developer Program membership for signing, TestFlight, and App Store submissions.
  - Add your Apple ID in Xcode > Settings > Accounts to download provisioning profiles automatically.
- **Certificates & provisioning (release builds)**
  - Use Xcode’s automatic signing for development.
  - For Expo EAS builds, run `eas device:create` or `eas build:configure` and upload certificates when prompted.
- **Device testing (optional)**
  - Register devices in the Apple Developer portal.
  - Install the Expo Go app via TestFlight or build a development client with `eas build --profile development --platform ios`.

Keep this document updated as your toolchain evolves (e.g., adding EAS Build/Submit configurations or CI integration).***
