# First Run - Step by Step

Follow these exact steps to run Sona for the first time.

## Step 1: Verify Prerequisites ✅

### Check Node.js
```bash
node -v
# Should show v18.x.x or higher
```

If not installed: https://nodejs.org/

### Check Xcode (macOS for iOS)
```bash
xcodebuild -version
# Should show Xcode 15.x
```

If not installed: Open Mac App Store, search "Xcode", install (large download!)

### Check Command Line Tools
```bash
xcode-select -p
# Should show: /Applications/Xcode.app/Contents/Developer
```

If not:
```bash
xcode-select --install
```

---

## Step 2: Install Dependencies ⬇️

```bash
# From the sona-app directory
npm install
```

Wait for all packages to install (~2-3 minutes).

---

## Step 3: Setup Supabase 🗄️

### 3a. Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Click "New Project"
5. Fill in:
   - **Name**: sona (or whatever)
   - **Database Password**: (save this somewhere!)
   - **Region**: (choose closest)
6. Click "Create new project"
7. **Wait ~2 minutes** for it to provision (get coffee ☕)

### 3b. Get Your Credentials

1. In Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in sidebar
3. You'll see two things:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
4. Keep this tab open!

### 3c. Add to .env File

Open `.env` in your code editor and add:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ...
```

Replace with your actual values (no quotes needed).

**Save the file!**

---

## Step 4: Build and Run 🚀

### Open Simulator First (Recommended)

```bash
open -a Simulator
```

This opens the iOS Simulator. Wait for it to fully boot (you'll see the home screen).

### Build the App

```bash
npx expo run:ios
```

**What happens now**:
1. ✅ Expo creates `ios/` folder with Xcode project
2. ✅ Installs CocoaPods dependencies (2-3 min)
3. ✅ Builds native code with Xcode (5-7 min)
4. ✅ Installs app on simulator
5. ✅ Launches app automatically

**First build takes 8-12 minutes total**. This is normal! ⏱️

You'll see lots of output in the terminal. Look for:
```
› Building iOS...
› Compiling...
› Linking...
› Installing...
✔ Successfully built app for iOS
```

---

## Step 5: First Launch 🎉

The app should open in the simulator automatically!

### What You'll See

1. **Black screen** with "Sona" title (the index page)
2. Navigate to the **Sign Up** screen (you'll need to implement navigation or use auth screens directly)

### Create Your First Account

1. Click **"Sign Up"** (or navigate to `/(auth)/signup`)
2. Enter any email: `test@example.com`
3. Enter password: `password123`
4. Confirm password: `password123`
5. Click **"Create Account"**

If Supabase is configured correctly:
- ✅ Account is created
- ✅ You're signed in
- ✅ Navigates to main app

---

## Step 6: Verify It's Working ✓

### Check Terminal
You should see logs like:
```
[INFO] User signed in
[WARN] RevenueCat not configured - subscription features will be disabled
```

The RevenueCat warning is **normal** - we're skipping that for now.

### Check Supabase Dashboard
1. Go back to your Supabase project
2. Click **Table Editor** in sidebar
3. You should see a `users` table (if using auth)
4. Your test user should appear!

---

## Step 7: Fast Development 🏃

Now that you've built once, you can use the dev server:

```bash
npm start
```

Then press **`i`** to open iOS.

**Changes to React code will hot-reload in ~3 seconds!** No rebuilding needed.

---

## Common First-Run Issues

### "Cannot connect to Supabase"
- Double-check `.env` file has correct URL and key
- Make sure no extra spaces
- Make sure you saved the file
- Restart: `npm start --clear`

### "xcrun: error: SDK not found"
```bash
sudo xcode-select --reset
xcode-select --install
```

### "CocoaPods not installed"
```bash
sudo gem install cocoapods
```

### Build hangs at "Installing CocoaPods"
- This can take 2-3 minutes first time
- Check Activity Monitor - Xcode should be using CPU
- If truly stuck (>10 min), press Ctrl+C and retry

### "Simulator not responding"
- Quit Simulator app
- Run: `npx expo run:ios` again
- It will restart the simulator

---

## Success! 🎉

If you see the app running in the simulator, **you're done!**

### What's Next?

- Explore the codebase
- Try signing up and signing in
- Check out the placeholder screens (Home, Mixer, Modes, Profile)
- Read `docs/IMPLEMENTATION_PLAN.md` for Phase 2

### Development Tips

**Make a code change**:
1. Open `app/index.tsx`
2. Change the text
3. Save
4. App hot-reloads in ~3 seconds ⚡

**View logs**:
- Terminal shows all console.log() output
- Press **`j`** in terminal to open debugger

**Restart app**:
- Press **`r`** in terminal to reload
- Or shake device/simulator and click "Reload"

---

## Need Help?

- Check `docs/BUILDING_THE_APP.md` for detailed troubleshooting
- Check `docs/QUICKSTART.md` for alternative approaches
- Check Expo docs: https://docs.expo.dev/

**You're all set!** Time to build the audio engine in Phase 2! 🎵
