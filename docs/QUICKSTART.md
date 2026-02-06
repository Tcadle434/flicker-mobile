# Quickstart Guide - Run Sona in 5 Minutes

Get the Sona app running on your device/simulator quickly.

## Prerequisites

- Node.js 18+ installed
- **Xcode** (for iOS development on macOS)
  - Install from Mac App Store
  - Open Xcode once to accept license agreements
  - Install Command Line Tools: `xcode-select --install`
- OR **Android Studio** (for Android development)
  - Install Android SDK and create an AVD (emulator)

**Note**: This app uses native modules (RevenueCat, Slider), so Expo Go won't work. You need a development build.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Setup Supabase (5 minutes)

1. **Go to https://supabase.com** and create a free account

2. **Create a new project**:
   - Project name: `sona` (or whatever you prefer)
   - Database password: Save this somewhere safe
   - Region: Choose closest to you

3. **Wait ~2 minutes** for project to provision

4. **Get your credentials**:
   - Go to **Settings** > **API**
   - Copy **Project URL** (looks like `https://xxx.supabase.co`)
   - Copy **anon public** key (long string)

5. **Add to `.env` file**:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-key-here
   ```

## Step 3: Build and Run the App

### For iOS (macOS only):

```bash
# This will build with Xcode and launch iOS Simulator
npx expo run:ios
```

The first build will take 5-10 minutes as it:
1. Installs CocoaPods dependencies
2. Compiles native modules
3. Builds the app with Xcode
4. Launches in iOS Simulator

Subsequent builds are much faster (1-2 minutes).

### For Android:

```bash
# This will build and launch Android Emulator
npx expo run:android
```

### Development Server:

After the first build, you can use the faster dev server for changes:

```bash
npm start
```

Then press:
- **`i`** for iOS (if already built once)
- **`a`** for Android (if already built once)

## First Launch

1. The app will load the welcome screen
2. Navigate to **Sign Up** to create an account
3. Enter any email/password (it will create a Supabase user)
4. You'll be signed in!

## What You'll See

- **Home tab**: Placeholder for player (Phase 2)
- **Mixer tab**: Placeholder for audio mixer (Phase 6)
- **Modes tab**: Placeholder for soundscape modes (Phase 6)
- **Profile tab**: Placeholder for settings (Phase 6)

## Troubleshooting

### "Cannot connect to Supabase"
- Verify your `.env` credentials are correct
- Make sure there are no extra spaces
- Restart dev server: `npm start --clear`

### "Metro bundler error"
```bash
# Clear cache and restart
npm start --clear
```

### "iOS Build Errors"
- Make sure Xcode is installed and updated
- Accept Xcode license: `sudo xcodebuild -license`
- Install Command Line Tools: `xcode-select --install`
- Clean build: `cd ios && pod install && cd .. && npx expo run:ios`

### "CocoaPods error"
```bash
# Update CocoaPods
sudo gem install cocoapods
cd ios
pod install
cd ..
npx expo run:ios
```

### "iOS Simulator not found"
- Open Xcode > Preferences > Locations
- Set Command Line Tools to your Xcode version
- Open Xcode > Window > Devices and Simulators
- Add an iPhone simulator if needed

### "Android Emulator not opening"
- Make sure Android Studio is installed
- Create an AVD (Android Virtual Device) in Android Studio
- Start the emulator before running `npm start`

## What's Next?

Now that the app is running, you're ready to:
- Explore the codebase structure
- Start Phase 2: Build the audio engine
- Customize the design system
- Add your own features

## Development Tips

### Hot Reload
The app will automatically reload when you save files. No need to restart!

### Logs
Check the terminal for useful logs:
```
[DEBUG] Auth initialized
[INFO] User signed in
[WARN] RevenueCat not configured (normal)
```

### TypeScript Errors
```bash
# Check for TypeScript errors
npx tsc --noEmit
```

### Clear Everything
```bash
# Nuclear option - clean install
rm -rf node_modules package-lock.json
npm install
npm start --clear
```

## Optional: RevenueCat Setup

You don't need this yet, but when you're ready:
- See `docs/RUNNING_WITHOUT_REVENUECAT.md` for details
- RevenueCat is only needed for Phase 7 (subscription testing)

---

**You're all set!** 🎉 The app should now be running on your device/simulator.

For detailed architecture info, see `README.md` and `docs/IMPLEMENTATION_PLAN.md`.
