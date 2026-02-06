# Sona - Quick Start Guide

## Running the App

### Prerequisites
- Node.js installed
- iOS Simulator (via Xcode) or Android Emulator
- Expo CLI

### Start Development Server

```bash
cd /Users/thomascadle/sona-app
npm start
```

This will open Expo Dev Tools in your browser.

### Run on iOS Simulator

```bash
npm run ios
```

Or press `i` in the Expo terminal.

### Run on Android Emulator

```bash
npm run android
```

Or press `a` in the Expo terminal.

---

## Testing the Audio Engine

### 1. Launch the App
- Open the app in your simulator/emulator
- You'll see the **Home** screen

### 2. Initialize Audio Engine
- The app automatically initializes the audio engine on mount
- You'll see "Initializing audio engine..." briefly
- Wait for initialization to complete (2-3 seconds)

### 3. Test Playback
- Press the large **Play** button (teal circle)
- You should hear 3 audio layers playing:
  - **Ambient**: Low 80 Hz sine wave (sub-bass)
  - **Nature**: Pink noise (sounds like rain)
  - **Synthesis**: High 880 Hz sine wave (ethereal tone)
- These are **test tones**, not real music (real audio in Week 2)

### 4. Test Controls

**Play/Pause/Stop**:
- Press **Play** ▶ to start
- Press **Pause** ❚❚ to pause
- Press **Stop** ■ to stop

**Master Volume**:
- Use **+ / -** buttons or drag the volume slider
- Volume changes should happen smoothly
- Watch the percentage update

**Adaptive Toggle**:
- Toggle the **Adaptive Mode** switch
- When ON, you'll see adaptive parameters displayed:
  - Energy: 0.00
  - Density: 0.00
  - Binaural: 10.0 Hz
- (Full adaptive system in Phase 3)

### 5. Test Mixer Screen
- Tap the **Mixer** tab at the bottom
- You'll see 5 layer controls:
  - 🌊 Ambient (purple) - Foundation pads
  - 🌿 Nature (green) - Environmental sounds
  - ♪ Melody (orange) - Musical elements (muted by default)
  - ⊙ Rhythm (red) - Pulses and beats (muted by default)
  - ◊ Synthesis (teal) - Binaural tones

**Test Layer Controls**:
- Drag each **slider** to adjust layer volume
- Press **🔊/🔇** to mute/unmute layers
- Changes should happen in real-time
- Notice how the mix changes as you adjust layers

**Master Volume**:
- Adjust the master volume at the top
- It controls overall output volume

---

## Expected Behavior

### ✅ What Should Work

1. **Audio initializes** without errors
2. **Test tones play** when you press play
3. **Volume controls** affect audio level
4. **Mute buttons** silence layers
5. **UI updates** in real-time
6. **No crashes** or TypeScript errors

### ⚠️ Known Limitations

1. **Test tones only** - Not real music yet (coming in Week 2)
2. **One mode only** - Only Focus mode available (Relax/Sleep in Week 2)
3. **No mode switching** - UI shows mode but can't change yet
4. **No adaptive behavior** - Adaptive system in Phase 3
5. **No background audio** - Will pause when backgrounded (Phase 8)

### ❌ What Doesn't Work Yet

- Mode switching (need Relax/Sleep manifests)
- Adaptive parameter changes (Phase 3)
- Weather/heart rate integration (Phase 3)
- 3D backgrounds (Phase 4)
- Background playback (Phase 8)

---

## Troubleshooting

### Audio doesn't play
**Possible causes**:
- Audio context not initialized
- Simulator audio muted
- Test tone generation failed

**Solutions**:
1. Check console logs for errors
2. Restart the app
3. Check simulator volume settings
4. Try running on a physical device

### App crashes on startup
**Possible causes**:
- Missing dependencies
- TypeScript compilation errors

**Solutions**:
1. Run `npm install` again
2. Clear cache: `npx expo start --clear`
3. Check TypeScript errors: `npx tsc --noEmit`

### Volume controls don't work
**Possible causes**:
- Audio engine not initialized
- Layer not loaded

**Solutions**:
1. Wait for initialization to complete
2. Check that playback is active
3. Look for errors in console

### UI doesn't update
**Possible causes**:
- Zustand state not syncing
- React component not re-rendering

**Solutions**:
1. Check that playerStore actions are called
2. Verify Zustand store is updated
3. Use React DevTools to inspect state

---

## Console Logs to Watch For

### Successful Initialization
```
INFO: Initializing AudioContext...
INFO: AudioContext initialized successfully
INFO: Generating test tones for all layers...
INFO: Test tones generated successfully
INFO: LayerManager initialized
INFO: Mode loaded successfully
INFO: Playback started
```

### Errors to Watch For
```
ERROR: Failed to initialize AudioContext
ERROR: Failed to load loop
ERROR: Failed to start playback
```

---

## Performance Check

### Monitor Performance
1. Open browser console (Expo Dev Tools)
2. Look for performance metrics:
   - CPU usage (should be <15%)
   - Memory usage (should be <100MB)
   - No audio dropouts

### Check Audio Quality
1. Use **headphones** to test binaural beats
2. Listen for:
   - Seamless looping (no clicks/pops)
   - Smooth volume fades
   - Clean audio (no distortion)

---

## Next Steps

Once you've verified basic functionality:

1. **Test on physical device** (iOS/Android)
2. **Source real audio loops** (30-50 loops)
3. **Add Relax and Sleep modes**
4. **Implement Phase 3: Adaptive System**

---

## Getting Help

### Check Logs
1. Expo Dev Tools (browser)
2. React Native debugger
3. Console logs in code

### Debug Mode
Uncomment logger.debug calls in:
- `src/audio/core/AudioEngine.ts`
- `src/stores/playerStore.ts`

### Report Issues
Check `PHASE2_COMPLETE.md` for known limitations and next steps.

---

**Have fun testing! 🎵**
