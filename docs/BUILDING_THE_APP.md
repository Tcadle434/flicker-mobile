# Building Sona - Development Build Guide

This guide explains how to build and run Sona on iOS and Android.

## Why Do We Need a Native Build?

Sona uses **native modules** that aren't supported by Expo Go:
- `react-native-purchases` (RevenueCat) - Native subscription APIs
- `@react-native-community/slider` - Native slider component
- `SonaAudio` (native Swift module) - Core audio engine
- `SonaSensors` (native Swift module) - Location + HealthKit inputs

This means we need to create a **development build** using Xcode (iOS) or Android Studio (Android).

---

## 🍎 iOS Build (macOS Only)

### Prerequisites

1. **Install Xcode** (free from Mac App Store)
   - Open Xcode once to accept license
   - Wait for "Additional Components" to install

2. **Install Command Line Tools**:
   ```bash
   xcode-select --install
   ```

3. **Accept Xcode License**:
   ```bash
   sudo xcodebuild -license accept
   ```

4. **Install CocoaPods** (if not already installed):
   ```bash
   sudo gem install cocoapods
   ```

### First Build

```bash
# From project root
npx expo run:ios
```

**What happens**:
1. Expo generates the `ios/` folder with native Xcode project
2. Installs iOS dependencies via CocoaPods (~2 minutes)
3. Compiles native modules (~3 minutes)
4. Builds the app with Xcode (~5 minutes)
5. Launches iOS Simulator with your app

**First build time**: 5-10 minutes ⏱️

### Subsequent Builds

After the first build, you have two options:

**Option 1: Full rebuild** (if you changed native code/dependencies):
```bash
npx expo run:ios
```
Time: 1-2 minutes

**Option 2: Dev server** (for JS/React changes only):
```bash
npm start
# Press 'i' to open existing build
```
Time: <10 seconds (hot reload)

### Build Troubleshooting

**"Command line tools not found"**:
```bash
xcode-select --install
sudo xcode-select --reset
```

**"Unable to boot device"**:
- Open Xcode > Window > Devices and Simulators
- Delete and re-add the simulator
- Or: `xcrun simctl erase all`

**"CocoaPods could not find compatible versions"**:
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx expo run:ios
```

**"Build failed" - general**:
```bash
# Nuclear option - clean everything
rm -rf ios node_modules package-lock.json
npm install
npx expo run:ios
```

**Change simulator device**:
```bash
npx expo run:ios --device "iPhone 15 Pro"
```

---

## 🤖 Android Build

### Prerequisites

1. **Install Android Studio**:
   - Download from https://developer.android.com/studio
   - Install Android SDK (API 33+)
   - Install Android SDK Build-Tools
   - Install Android Emulator

2. **Create an AVD (Android Virtual Device)**:
   - Open Android Studio > Tools > Device Manager
   - Create Device > Pixel 5 or similar
   - System Image: Android 13 (API 33) or higher
   - Finish and start the emulator

3. **Set environment variables** (add to `~/.zshrc` or `~/.bash_profile`):
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

4. **Reload shell**:
   ```bash
   source ~/.zshrc  # or source ~/.bash_profile
   ```

### First Build

**Start the emulator first**:
```bash
# List available emulators
emulator -list-avds

# Start your emulator (replace with your AVD name)
emulator -avd Pixel_5_API_33 &
```

**Then build**:
```bash
npx expo run:android
```

**First build time**: 5-10 minutes ⏱️

### Subsequent Builds

**Option 1: Full rebuild**:
```bash
npx expo run:android
```

**Option 2: Dev server**:
```bash
npm start
# Press 'a' to open existing build
```

### Build Troubleshooting

**"ANDROID_HOME not set"**:
- Follow step 3 in Prerequisites above
- Verify: `echo $ANDROID_HOME` (should print SDK path)

**"SDK location not found"**:
```bash
# Create local.properties
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

**"Gradle build failed"**:
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

**"Unable to connect to emulator"**:
- Make sure emulator is running before building
- Or let Expo start it: `npx expo run:android --device`

---

## 📱 Running on Physical Device

### iOS Physical Device

**Requirements**:
- Apple Developer account (free)
- iPhone with USB-C or Lightning cable

**Steps**:
1. Connect iPhone to Mac
2. Open Xcode
3. Select your device from the device menu
4. Sign the app with your Apple ID (Xcode will prompt)
5. Run: `npx expo run:ios --device`

**First time**:
- Settings > General > VPN & Device Management
- Trust your developer certificate

### Android Physical Device

**Steps**:
1. Enable Developer Options on Android device:
   - Settings > About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings > Developer Options > USB Debugging
3. Connect via USB
4. Accept "Allow USB Debugging" prompt on device
5. Run: `npx expo run:android --device`

---

## 🔄 When to Rebuild

**Full rebuild needed** (npx expo run):
- ✅ Added/removed native dependencies
- ✅ Changed `app.json` or `expo.json`
- ✅ Modified native code in `ios/` or `android/`
- ✅ Updated Expo SDK version
- ✅ Changed app permissions

**Dev server sufficient** (npm start):
- ✅ Changed React components
- ✅ Modified JavaScript/TypeScript code
- ✅ Updated styles
- ✅ Changed assets (images, etc.)

---

## 🚀 Production Builds

For production/TestFlight/Play Store:

### iOS (TestFlight)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to TestFlight
eas submit --platform ios
```

### Android (Play Store)
```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

See Expo EAS documentation for full production build guide.

---

## 📊 Build Times Reference

| Action | First Time | Subsequent |
|--------|-----------|-----------|
| iOS build (clean) | 8-12 min | 1-2 min |
| Android build (clean) | 8-12 min | 1-2 min |
| Dev server reload | - | <10 sec |
| Hot reload (code change) | - | <3 sec |

---

## 💡 Development Workflow

**Recommended workflow**:

1. **Morning**: Build once with `npx expo run:ios`
2. **During development**: Use `npm start` for all changes
3. **After adding dependencies**: Rebuild with `npx expo run:ios`
4. **End of day**: Commit and push changes

**Fast iteration**:
- Keep the dev server running (`npm start`)
- Make changes to React components
- Save file → Hot reload (3 seconds)
- No need to rebuild!

---

## 🆘 Getting Help

**Build issues**:
1. Check this doc first
2. Clear cache: `npm start --clear`
3. Clean install: `rm -rf node_modules && npm install`
4. Check Expo forums: https://forums.expo.dev/

**Environment issues**:
- Verify Node version: `node -v` (should be 18+)
- Verify Xcode: `xcodebuild -version`
- Verify Android SDK: `echo $ANDROID_HOME`

---

Good luck building! The first build is slow, but after that it's smooth sailing. 🎵
