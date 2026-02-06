# Sona - Production-Grade Adaptive Ambient Music App

**Vision**: An Endel-inspired app with adaptive ambient music + 3D visual environments that respond in real-time to time of day, weather, heart rate, and season.

**Tech Stack**: React Native + Expo Router, SonaAudio + SonaSensors native modules (Swift + Expo Modules), Zustand, Three.js/Skia, Supabase, RevenueCat

**Platform**: iOS-first (Android later)

---

## Executive Summary

### Key Decisions from User
- ✅ **Audio Engine**: Hybrid loop-based + synthesis (pre-composed loops + real-time generation)
- ✅ **Platform**: iOS-first, expand to Android later
- ✅ **Backgrounds**: Full 3D environment scenes that adapt to audio
- ✅ **Audio Content**: Source from libraries + AI generation
- ✅ **Adaptive Inputs**: All inputs (time of day, weather, heart rate, season)
- ✅ **Library Scope**: Start focused (3-4 modes, 30-50 loops), expand later
- ✅ **User Controls**: Full mixer interface (individual layer volumes)
- ✅ **Monetization**: Freemium with skippable paywall ($3-4/month, cheap annual, lifetime)

### What Makes This Different from Drift
Drift attempted to build DSP from scratch (C synthesis) but never completed it. Sona takes a pragmatic hybrid approach:
- **Custom native audio engine** (Swift + AVAudioEngine) exposed via Expo Modules instead of JS audio wrappers
- **Pre-composed loops** (50-100 high-quality WAV/CAF files) as the foundation
- **Real-time synthesis** only for binaural beats and subtle tones
- **3D backgrounds** (Drift had minimal UI) that sync with audio
- **Production-ready** architecture from day one

### What We're Learning from Qurio
- Clean Expo Router file-based navigation with route groups
- Zustand for lightweight state management
- Service layer pattern for API/sensor integration
- Glassmorphic UI design system
- RevenueCat subscription integration
- Auth + onboarding flow patterns

### What We're Learning from Endel
- On-device real-time audio generation (Endel Pacific engine concept)
- Circadian rhythm-based parameter mapping
- Multiple adaptive inputs blended intelligently
- Minimalist UI with focus on audio experience
- Freemium model with clear premium value

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                         │
│  ┌────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │   Screens  │  │   Zustand   │  │  Service Layer    │   │
│  │    (UI)    │←→│   Stores    │←→│ (APIs, Sensors)   │   │
│  └────────────┘  └─────────────┘  └───────────────────┘   │
│         ↓                ↓                    ↓             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      SoundscapeOrchestrator (Integration Layer)      │  │
│  │  Coordinates audio engine + 3D rendering + adaptive  │  │
│  └──────────────────────────────────────────────────────┘  │
│         ↓                                        ↓          │
│  ┌─────────────────────┐          ┌──────────────────────┐ │
│  │ NativeAudioEngine   │          │   RenderEngine       │ │
│  │ (SonaAudio module / │          │ (Three.js + Skia)    │ │
│  │  AVAudioEngine)     │ ←Sync→   │  3D Scenes           │ │
│  │ - Loop playback     │          │ - Adaptive visuals   │ │
│  │ - Synthesis         │          │ - Particles          │ │
│  │ - Effects chain     │          │ - Atmosphere         │ │
│  └─────────────────────┘          └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- Sensors are accessed via the native `SonaSensors` module (CoreLocation + HealthKit) to keep adaptive inputs off JS wrappers.

---

## Implementation Phases

### **Phase 1: Foundation Setup (Week 1)**

**Goal**: Project setup, core infrastructure, basic UI shell

#### Tasks:
1. Initialize Expo project with TypeScript
2. Setup Expo Router file-based navigation
3. Create project structure (folders, initial files)
4. Setup Supabase (auth, database, analytics)
5. Setup RevenueCat for subscriptions
6. Implement auth screens (signin, signup)
7. Create basic glassmorphic UI components
8. Setup error boundaries and logging

#### Key Files:
- `app/_layout.tsx` - Root layout with providers
- `app/(auth)/signin.tsx`, `signup.tsx`
- `src/stores/authStore.ts` - Auth state management
- `src/services/api/supabase.ts` - Supabase client
- `src/components/ui/Button.tsx`, `Card.tsx` - Base UI components

#### Verification:
- [ ] User can sign up and sign in
- [ ] Auth state persists across app restarts
- [ ] Error boundaries catch and display errors gracefully

---

### **Phase 2: Audio Engine Core (Week 2-3)**

**Goal**: Build production-grade adaptive audio engine with loop playback

#### Architecture:

**Core Classes**:
```typescript
NativeAudioEngine (Swift singleton)
  ├── LayerManager (manages 5 audio layers)
  │   └── AudioLayer (handles playback + crossfading)
  ├── SynthesisEngine (binaural beats, tones)
  ├── AudioMixer (volume control, master chain)
  ├── EffectsChain (reverb, filters, compression)
  └── PerformanceMonitor (CPU, memory tracking)

JS Orchestration
  ├── NativeAudioBridge (JS → native API)
  └── ParameterMapper (maps adaptive inputs → audio parameters)

LoopLibrary (JS)
  └── Selects metadata + file names; native engine loads/decodes audio
```

**Audio Layers**:
1. **Ambient** - Long pads, drones (foundation)
2. **Nature** - Rain, wind, ocean (environmental)
3. **Melody** - Piano, bells, strings (musical)
4. **Rhythm** - Subtle pulses, heartbeat (optional)
5. **Synthesis** - Binaural beats, generated tones

**File Format**: 48kHz stereo WAV/CAF (PCM) for seamless looping; optionally AAC (.m4a) for size if pre-trimmed

**Sample Library Organization**:
```
assets/audio/loops/                # source library (optional)
├── ambient/
│   ├── pad_warm_01.wav + pad_warm_01.json (metadata)
│   └── ...
├── nature/
│   ├── rain_light_01.wav + rain_light_01.json
│   └── ...
└── manifests/
    ├── focus.json (defines which loops for Focus mode)
    ├── relax.json
    └── sleep.json

ios/Sona/audio/                    # bundled into the iOS app
├── ambient_loop_01.wav
├── nature_loop_01.wav
└── ...
```

**Placeholder Generator**: `scripts/generate_audio_loops.py` creates 48kHz stereo synthetic loops for testing. Replace with licensed real-world assets before release.

**Loop Metadata Schema**:
```json
{
  "id": "pad_warm_01",
  "duration": 8.0,
  "key": "C",
  "tags": {
    "mode": ["focus", "relax"],
    "energy": 3,
    "density": 2,
    "timeOfDay": ["morning", "afternoon"],
    "weather": ["clear", "cloudy"],
    "season": ["spring", "summer"]
  },
  "defaultVolume": 0.7,
  "crossfadeDuration": 4.0
}
```

**Parameter Mapping Example**:
```typescript
// Time of day → Energy bias
// 6am-10am: Rising energy (0 → 0.8)
// 10am-2pm: Peak energy (0.8)
// 2pm-6pm: Declining (0.8 → 0.3)
// 6pm-10pm: Evening low (0.3 → -0.3)
// 10pm-6am: Deep rest (-0.5 to -0.8)

// Weather → Density
// Clear: Spacious (0.5)
// Cloudy: Neutral (0.0)
// Rain: Dense/intimate (-0.4)
// Storm: Very dense (-0.7)

// Heart rate → Binaural beat frequency
// Focus mode: 10 Hz (alpha)
// Relax mode: 7.5 Hz (alpha-theta)
// Sleep mode: 2-4 Hz (delta, lower as HR drops)
```

#### Tasks:
1. Wire up SonaAudio Expo module (podspec + autolinking + ExpoModulesProvider)
2. Add SonaSensors Expo module for CoreLocation + HealthKit (read-only)
3. Implement NativeAudioEngine (Swift), LayerManager, AudioLayer
4. Implement LoopLibrary (JS metadata + selection) and feed filenames to native module
5. Define JS → native layer mapping (synthesis → binaural) and audio file naming conventions
6. Ensure audio assets are bundled and loadable by `AudioBufferManager` (WAV/CAF in app bundle)
7. Create 3 initial soundscape modes (Focus, Relax, Sleep)
7. Source/create initial 30 audio loops (10 per mode) in WAV/CAF
8. Implement crossfading system (equal-power curves) in native engine
9. Implement SynthesisEngine (binaural beats only for MVP) in native engine
10. Implement basic EffectsChain (reverb, filter, compression) in native engine
11. Add PerformanceMonitor for CPU tracking (native)
12. Create audioStore (Zustand) for state management + NativeAudioBridge integration

#### Key Files:
- `modules/sona-audio/ios/SonaAudioEngine.swift`
- `modules/sona-audio/ios/SonaAudioModule.swift`
- `modules/sona-audio/SonaAudio.podspec`
- `src/services/audio/nativeAudioModule.ts`
- `src/services/audio/nativeAudioBridge.ts`
- `src/services/audio/loopLibrary.ts`
- `src/services/audio/manifestLoader.ts`
- `src/services/audio/loopSelector.ts`
- `src/services/audio/parameterMapper.ts`
- `src/stores/playerStore.ts`
- `assets/audio/loops/` (audio files + metadata)
- `assets/audio/manifests/focus.json`

#### Verification:
- [ ] Can load and play Focus mode with 3 layers
- [ ] Loops crossfade seamlessly (no clicks/pops)
- [ ] Binaural beats generate at correct frequency
- [ ] Layer volumes can be adjusted independently
- [ ] CPU usage < 15% on iPhone 12
- [ ] No audio dropouts during 5-minute playback test

---

### **Phase 3: Adaptive System (Week 4)**

**Goal**: Implement all adaptive inputs and parameter mapping

#### Adaptive Inputs:

1. **Time of Day** (always enabled)
   - Uses device clock
   - Maps to energy level + loop selection
   - Updates every 5 minutes

2. **Weather** (requires location permission)
   - Uses Open-Meteo API (free, no key needed)
   - Maps to density + nature sound volume
   - Updates every 15 minutes
   - Caches last known weather

3. **Heart Rate** (requires HealthKit permission)
   - Uses react-native-health for iOS
   - Maps to tempo + binaural frequency
   - Polls every 10 seconds when available
   - Mock fallback for testing

4. **Season** (calculated from date + hemisphere)
   - Spring/Summer: Brighter, lighter
   - Fall/Winter: Warmer, deeper
   - Updates daily

#### Tasks:
1. Implement TimeAdapter (circadian rhythm calculations)
2. Implement WeatherAdapter (Open-Meteo API integration)
3. Implement HeartRateAdapter (HealthKit + mock)
4. Implement SeasonAdapter (date-based calculations)
5. Create AdaptiveController (orchestrates all adapters)
6. Create ParameterMapper (mapping rules for each input)
7. Implement adaptive update loop (30-second interval)
8. Create adaptiveStore (Zustand) for state
9. Build UI to display current adaptive state

#### Key Files:
- `src/services/adaptive/TimeAdapter.ts`
- `src/services/adaptive/WeatherAdapter.ts`
- `src/services/adaptive/HeartRateAdapter.ts`
- `src/services/adaptive/SeasonAdapter.ts`
- `src/services/audio/parameterMapper.ts`
- `src/integration/AdaptiveController.ts`
- `src/stores/adaptiveStore.ts`
- `src/services/sensors/healthKit.ts`
- `src/services/api/weather.ts`

#### Verification:
- [ ] Time of day changes audio energy (test at different hours)
- [ ] Weather integration works (test with real location)
- [ ] Heart rate affects binaural frequency (test with mock data)
- [ ] Seasonal adjustments apply correctly
- [ ] Adaptive parameters update every 30 seconds
- [ ] Battery drain < 5% per hour with all inputs enabled

---

### **Phase 4: 3D Rendering System (Week 5-6)**

**Goal**: Build adaptive 3D backgrounds that sync with audio

#### Progressive Strategy:

**Tier 1: Skia Foundation (Start here)**
- Use `@shopify/react-native-skia` for 2D GPU effects
- Animated gradients, particles, glassmorphism
- 60fps easily achievable, minimal battery drain
- Good enough for 80% of visual impact

**Tier 2: WebGL Pseudo-3D (Add later if needed)**
- Use `expo-gl` with custom shaders
- Parallax depth layers, volumetric fog
- More visual depth without full 3D complexity

**Tier 3: Full 3D (Premium scenes)**
- Use `react-three-fiber` with `expo-gl`
- True 3D environments (rainy forest, night sky)
- Higher battery cost, require optimization

#### Initial Scenes (Tier 1 - Skia):

1. **Focus Scene**: Geometric patterns, flowing lines, bright colors
2. **Relax Scene**: Soft flowing particles, gentle gradients, calm blues
3. **Sleep Scene**: Slow-moving stars, deep purples/blacks, minimal motion

#### Audio-Visual Sync:
- Bass → Particle spawn rate
- Mid frequencies → Color intensity
- Treble → Particle brightness/shimmer
- Beat detection → Camera shake or flash effects
- Layer volumes → Scene element visibility

#### Tasks:
1. Setup Skia for React Native
2. Implement RenderEngine base class
3. Create BaseScene abstract class
4. Build FocusScene (geometric patterns)
5. Build RelaxScene (flowing particles)
6. Build SleepScene (starfield)
7. Implement ParticleSystem with audio reactivity
8. Create SceneTransitionManager (smooth crossfades)
9. Implement PerformanceMonitor for FPS tracking
10. Add quality presets (low/medium/high)
11. Create SceneCanvas component for UI integration

#### Key Files:
- `src/rendering/core/RenderEngine.ts`
- `src/rendering/scenes/BaseScene.ts`
- `src/rendering/scenes/FocusScene.ts`
- `src/rendering/scenes/RelaxScene.ts`
- `src/rendering/scenes/SleepScene.ts`
- `src/rendering/particles/AudioReactiveParticleSystem.ts`
- `src/rendering/transitions/SceneTransitionManager.ts`
- `src/rendering/components/SceneCanvas.tsx`

#### Verification:
- [ ] All 3 scenes render at 60fps on iPhone 12
- [ ] Scenes transition smoothly (2-second crossfade)
- [ ] Particles react to audio in real-time
- [ ] Quality presets adjust particle count correctly
- [ ] Battery drain < 3% additional per hour with rendering
- [ ] No memory leaks after 30 minutes of playback

---

### **Phase 5: Integration Layer (Week 7)**

**Goal**: Connect audio engine + 3D rendering + adaptive system

#### Core Integration Class:

```typescript
SoundscapeOrchestrator {
  - audioEngine: NativeAudioBridge
  - renderEngine: RenderEngine
  - adaptiveController: AdaptiveController
  - syncEngine: SyncEngine

  initialize()
  loadMode(mode)
  onAdaptiveInputChange(input, value)
  onMixerChange(layerId, volume)
  dispose()
}
```

**Responsibilities**:
1. Initialize all subsystems
2. Load audio mode + corresponding 3D scene
3. Route adaptive input changes to both engines
4. Sync audio analysis to visual parameters (60fps)
5. Handle user mixer changes
6. Coordinate scene transitions

#### Tasks:
1. Implement SoundscapeOrchestrator
2. Implement SyncEngine (audio → visual sync loop)
3. Implement StateMapper (Zustand → orchestrator bridge)
4. Create useSoundscape hook (main integration hook)
5. Build AudioStateProvider context
6. Connect all stores to orchestrator
7. Add event logging for debugging

#### Key Files:
- `src/integration/SoundscapeOrchestrator.ts`
- `src/integration/SyncEngine.ts`
- `src/integration/StateMapper.ts`
- `src/hooks/useSoundscape.ts`
- `src/services/audio/AudioStateProvider.tsx`

#### Verification:
- [ ] Changing mode loads audio + scene together
- [ ] Adaptive input changes affect both audio and visuals
- [ ] Mixer changes update both audio and visual intensity
- [ ] Audio analysis syncs to visuals in real-time (< 16ms latency)
- [ ] Scene transitions coordinate with audio crossfades

---

### **Phase 6: UI/UX (Week 8-9)**

**Goal**: Build production-quality UI with glassmorphic design

#### Screens:

1. **Home/Player Screen** (`app/(main)/home.tsx`)
   - Full-screen 3D background
   - Glassmorphic overlay with controls
   - Large play/pause button (center)
   - Mode selector (swipeable carousel)
   - Current adaptive state display (time, weather, HR)
   - Mini mixer (quick access to layer volumes)

2. **Mixer Screen** (`app/(main)/mixer.tsx`)
   - Full mixer interface
   - 5 layer volume sliders (Ambient, Nature, Melody, Rhythm, Synthesis)
   - Master volume + effects controls
   - Preset management (save/load custom mixes)
   - Visual feedback (waveforms, VU meters)

3. **Modes Screen** (`app/(main)/modes.tsx`)
   - Browse all soundscape modes
   - Preview each mode (15-second samples)
   - Mode descriptions and use cases
   - Favorites system

4. **Profile/Settings Screen** (`app/(main)/profile.tsx`)
   - Account management
   - Subscription status + upgrade
   - Audio settings (quality, background playback)
   - Visual settings (performance, quality)
   - Adaptive input settings (enable/disable, intensity)
   - Notifications, privacy, help

#### UI Components:

**Base Components**:
- Button (primary, secondary, ghost variants)
- Card (glassmorphic design)
- Slider (volume controls)
- Toggle (switches)
- Modal (overlays)

**Player Components**:
- PlayerControls (play/pause/skip)
- ModeSelector (carousel)
- WaveformVisualizer
- NowPlaying (current mode info)

**Mixer Components**:
- LayerSlider (individual layer control)
- MasterControls
- EffectsPanel (reverb, filter settings)
- PresetManager

**Adaptive Components**:
- TimeOfDayIndicator (clock + phase)
- WeatherDisplay (current conditions)
- HeartRateMonitor (BPM display)
- AdaptiveSettings (configure inputs)

#### Design System:
```typescript
// Colors (dark theme, glassmorphic)
background: '#0A0A0B'
surface: '#141416'
glass: 'rgba(255,255,255,0.06)'
glassBorder: 'rgba(255,255,255,0.1)'
text: '#FAFAFA'
textSecondary: '#A1A1AA'
primary: '#2DD4BF' (teal accent)

// Typography
fontFamily: 'Inter' (300, 400, 500, 600, 700)
fontSize: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, xxl: 32 }

// Spacing
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }

// Animations
timing: { fast: 150ms, normal: 250ms, slow: 350ms }
```

#### Tasks:
1. Create design system (theme.ts with colors, typography, spacing)
2. Build base UI components (Button, Card, Slider, Toggle, Modal)
3. Implement PlayerScreen with 3D background integration
4. Implement MixerScreen with full controls
5. Implement ModesScreen with browsing
6. Implement ProfileScreen with settings
7. Add glassmorphic effects (blur, transparency)
8. Implement smooth animations (react-native-reanimated)
9. Add haptic feedback (button presses, interactions)
10. Responsive design for different screen sizes

#### Key Files:
- `src/constants/theme.ts`
- `src/components/ui/` (Button, Card, Slider, etc.)
- `app/(main)/home.tsx`
- `app/(main)/mixer.tsx`
- `app/(main)/modes.tsx`
- `app/(main)/profile.tsx`
- `src/components/player/` (player components)
- `src/components/mixer/` (mixer components)

#### Verification:
- [ ] UI matches glassmorphic design vision
- [ ] All animations run at 60fps
- [ ] Haptic feedback works on interactions
- [ ] Player screen integrates 3D background seamlessly
- [ ] Mixer controls update audio in real-time
- [ ] Settings persist across app restarts

---

### **Phase 7: Onboarding + Paywall (Week 10)**

**Goal**: Create compelling onboarding flow with skippable paywall

#### Onboarding Flow:

**Step 1: Welcome** (`app/(onboarding)/welcome.tsx`)
- Hero animation (flowing gradients)
- Play 30-second auto-demo of Focus mode
- "Adaptive ambient music for focus, relaxation, and sleep"
- Continue button

**Step 2: Permissions** (`app/(onboarding)/permissions.tsx`)
- Request notifications (daily reminders)
- Request motion/fitness (for heart rate - optional)
- Request location (for weather - optional)
- Skip button for each (explain benefit)

**Step 3: Interactive Demo** (`app/(onboarding)/soundscape-intro.tsx`)
- Let user try switching modes
- Show adaptive inputs in action (time of day demo)
- Quick mixer introduction
- Showcase 3D backgrounds

**Step 4: Paywall** (`app/(onboarding)/paywall.tsx`)
- Show premium benefits
- Pricing: $3.99/month, $29.99/year (save 38%), $79.99 lifetime
- "Start Free Trial" (7 days) or "Continue with Limited Features"
- Skip tracking (show paywall again after 5 sessions or 10 plays)

#### Free vs. Premium:

**Free Tier**:
- 1 mode (Focus only)
- Basic mixer (3 layers: Ambient, Nature, Synthesis)
- Time of day adaptive only
- Basic 3D scene (no advanced particles)
- 10-minute session limit

**Premium Tier**:
- All modes (Focus, Relax, Sleep, Energize, + future modes)
- Full mixer (all 5 layers + effects)
- All adaptive inputs (weather, heart rate, season)
- All 3D scenes with full quality
- Unlimited session length
- Offline mode (future)
- Custom presets (future)

#### Tasks:
1. Create onboarding screens (welcome, permissions, demo, paywall)
2. Implement permission request flows (notifications, health, location)
3. Setup RevenueCat SDK with subscription offerings
4. Implement PaywallService (feature gating logic)
5. Create skippable paywall with usage tracking
6. Add analytics for onboarding completion rates
7. Build subscription management in settings
8. Implement restore purchases functionality

#### Key Files:
- `app/(onboarding)/welcome.tsx`
- `app/(onboarding)/permissions.tsx`
- `app/(onboarding)/soundscape-intro.tsx`
- `app/(onboarding)/paywall.tsx`
- `src/services/subscription/revenueCat.ts`
- `src/services/subscription/paywallService.ts`
- `src/stores/subscriptionStore.ts`
- `src/stores/onboardingStore.ts`

#### Verification:
- [ ] Onboarding flow guides user smoothly
- [ ] Permissions requests work on iOS
- [ ] Paywall can be skipped
- [ ] Subscription purchase flow works (test in sandbox)
- [ ] Feature gating prevents free users from accessing premium features
- [ ] Restore purchases works correctly
- [ ] Paywall re-appears after usage threshold

---

### **Phase 8: Background Audio + Polish (Week 11)**

**Goal**: iOS background audio, lock screen controls, final polish

#### Background Audio Setup:

1. Configure audio session for background playback
2. Setup lock screen controls (play/pause/mode info)
3. Handle audio interruptions (calls, alarms)
4. Handle route changes (headphones, Bluetooth)
5. Background task for adaptive input updates

#### Polish Items:

1. **Performance Optimization**
   - Profile and optimize CPU usage
   - Reduce memory footprint
   - Battery optimization (adaptive quality based on battery level)
   - Thermal throttling (reduce quality if device overheats)

2. **Error Handling**
   - Graceful degradation (if audio fails, show error but don't crash)
   - Network error handling (weather API, Supabase)
   - Permission denial handling (show explanations)
   - Audio buffer underrun recovery

3. **Edge Cases**
   - App backgrounding/foregrounding
   - Airplane mode (disable weather, continue playing)
   - Low storage (prevent new downloads)
   - No internet (offline mode for premium)

4. **Accessibility**
   - VoiceOver support
   - Dynamic text sizing
   - Reduce motion (visual settings)
   - High contrast mode

5. **Analytics**
   - Track playback sessions
   - Track mode preferences
   - Track mixer usage
   - Track subscription conversions
   - Track onboarding completion

#### Tasks:
1. Configure iOS background audio session
2. Setup lock screen controls (MPNowPlayingInfoCenter via native module)
3. Handle audio interruptions and route changes
4. Implement background adaptive updates
5. Profile and optimize performance
6. Add battery/thermal monitoring and adaptive quality
7. Implement error boundaries and recovery
8. Add comprehensive error handling
9. Test all edge cases thoroughly
10. Implement VoiceOver support
11. Setup Mixpanel analytics events
12. Final testing on multiple devices

#### Key Files:
- `modules/sona-audio/ios/AudioSessionManager.swift`
- `src/services/background/adaptiveMonitor.ts`
- `modules/sona-audio/ios/PerformanceMonitor.swift`
- `modules/sona-audio/ios/QualityManager.swift`
- `src/lib/logger.ts`
- `src/services/api/analytics.ts`

#### Verification:
- [ ] Audio plays in background continuously
- [ ] Lock screen controls work (play/pause/artwork)
- [ ] Audio resumes after phone call
- [ ] Audio switches to headphones/Bluetooth correctly
- [ ] Adaptive inputs update in background (every 15 min)
- [ ] Battery drain < 5% per hour total
- [ ] No memory leaks after 1 hour playback
- [ ] VoiceOver can navigate entire app
- [ ] App doesn't crash on any error scenario

---

## Critical Files to Create (Priority Order)

### Tier 1: Foundation (Week 1)
1. `app/_layout.tsx` - Root layout with providers
2. `src/stores/authStore.ts` - Auth state management
3. `src/services/api/supabase.ts` - Supabase client
4. `src/constants/theme.ts` - Design system
5. `src/components/ui/Card.tsx` - Glassmorphic base component

### Tier 2: Audio Engine (Week 2-3)
6. `modules/sona-audio/ios/SonaAudioEngine.swift` - Native audio engine
7. `modules/sona-audio/ios/SonaAudioModule.swift` - Expo module bridge
8. `modules/sona-audio/SonaAudio.podspec` - CocoaPods spec
9. `src/services/audio/nativeAudioModule.ts` - JS wrapper for Expo module
10. `src/services/audio/nativeAudioBridge.ts` - JS bridge used by stores
11. `src/services/audio/loopLibrary.ts` - Loop metadata + selection
12. `src/services/audio/parameterMapper.ts` - Adaptive mapping
13. `src/stores/playerStore.ts` - Playback state
14. `assets/audio/manifests/focus.json` - Mode definition

### Tier 3: Adaptive System (Week 4)
15. `src/integration/AdaptiveController.ts` - Orchestrates adapters
16. `src/services/adaptive/TimeAdapter.ts` - Time of day
17. `src/services/adaptive/WeatherAdapter.ts` - Weather API
18. `src/services/adaptive/HeartRateAdapter.ts` - HealthKit
19. `src/stores/adaptiveStore.ts` - Adaptive state

### Tier 4: Rendering (Week 5-6)
20. `src/rendering/core/RenderEngine.ts` - 3D rendering engine
21. `src/rendering/scenes/FocusScene.ts` - First 3D scene
22. `src/rendering/particles/AudioReactiveParticleSystem.ts` - Particles
23. `src/rendering/components/SceneCanvas.tsx` - UI integration

### Tier 5: Integration (Week 7)
24. `src/integration/SoundscapeOrchestrator.ts` - Central coordinator
25. `src/integration/SyncEngine.ts` - Audio-visual sync
26. `src/hooks/useSoundscape.ts` - Main integration hook

### Tier 6: UI (Week 8-9)
27. `app/(main)/home.tsx` - Main player screen
28. `app/(main)/mixer.tsx` - Mixer interface
29. `src/components/mixer/LayerSlider.tsx` - Volume controls

### Tier 7: Onboarding (Week 10)
30. `app/(onboarding)/welcome.tsx` - Onboarding start
31. `app/(onboarding)/paywall.tsx` - Subscription paywall
32. `src/services/subscription/revenueCat.ts` - RevenueCat SDK

### Tier 8: Polish (Week 11)
33. `modules/sona-audio/ios/AudioSessionManager.swift` - Background playback
34. `modules/sona-audio/ios/PerformanceMonitor.swift` - Optimization

---

## Tech Stack Details

### Core Dependencies
```json
{
  "expo": "~54.0.33",
  "react-native": "0.81.5",
  "expo-router": "~6.0.23",
  "@shopify/react-native-skia": "^1.0.0",
  "@react-three/fiber": "^8.15.0",
  "expo-gl": "~15.0.0",
  "zustand": "^4.5.0",
  "@supabase/supabase-js": "^2.39.0",
  "react-native-purchases": "^7.0.0",
  "react-native-reanimated": "~3.16.0",
  "react-native-health": "^1.18.0",
  "@react-native-community/geolocation": "^3.0.0"
}
```

### APIs & Services
- **Supabase**: Auth, user profiles, analytics
- **RevenueCat**: Subscription management
- **Open-Meteo**: Weather data (free, no key)
- **HealthKit**: Heart rate (iOS native)
- **Mixpanel**: Analytics (optional)

---

## Success Metrics

### Technical Metrics
- [ ] Audio playback latency < 50ms
- [ ] Zero audio glitches (clicks, pops, dropouts)
- [ ] Seamless loop crossfades (no perceivable seams)
- [ ] 60fps rendering on iPhone 12+
- [ ] CPU usage < 15% average
- [ ] Memory usage < 100MB total
- [ ] Battery drain < 5% per hour total
- [ ] Cold start time < 2 seconds

### User Experience Metrics
- [ ] Onboarding completion rate > 70%
- [ ] Paywall conversion rate > 5% (target)
- [ ] Average session duration > 15 minutes
- [ ] Daily active users retention > 40% D7
- [ ] Crash-free rate > 99.5%
- [ ] App Store rating > 4.5 stars

### Business Metrics
- [ ] Free to premium conversion > 5%
- [ ] Subscription retention > 80% month-2
- [ ] Churn rate < 10% monthly
- [ ] LTV:CAC ratio > 3:1

---

## Risk Mitigation

### Technical Risks

**Risk 1: Audio quality not meeting expectations**
- Mitigation: Source high-quality loops, test with users early
- Fallback: Partner with sound designer or use premium audio libraries

**Risk 2: 3D rendering too battery-intensive**
- Mitigation: Progressive rendering strategy (start with Skia, add 3D later)
- Fallback: Focus on 2D effects, make 3D optional in settings

**Risk 3: Adaptive system feels random/not meaningful**
- Mitigation: Design clear parameter mappings, test with real users
- Fallback: Add manual override, reduce automation intensity

**Risk 4: Loop-based approach sounds repetitive**
- Mitigation: Use large loop library (50-100 loops), intelligent selection
- Fallback: Add more synthesis, use shorter loops with more variation

### Business Risks

**Risk 1: Low conversion from free to premium**
- Mitigation: Make free tier limited but functional, showcase premium value
- Fallback: Adjust pricing, add more premium features

**Risk 2: High production costs (audio content)**
- Mitigation: Use royalty-free libraries + AI generation for MVP
- Fallback: Launch with fewer modes, expand based on revenue

**Risk 3: Market saturation (Endel, Brain.fm, etc.)**
- Mitigation: Differentiate with 3D visuals, transparent pricing, better UX
- Fallback: Pivot to specific niche (focus for ADHD, sleep for insomnia)

---

## Post-MVP Roadmap (Future Phases)

### Phase 9: Additional Modes (Month 4)
- Energize mode (upbeat, motivating)
- Meditation mode (sparse, mindful)
- Study mode (no vocals, consistent tempo)
- Creative mode (inspiring, varied)

### Phase 10: Social Features (Month 5)
- Share favorite mixes
- Collaborative soundscapes
- Community presets
- Weekly challenges

### Phase 11: Advanced Features (Month 6)
- Custom preset creation
- Playlist mode (sequence of modes)
- Timer/alarms with adaptive wake-up
- Offline mode (download modes)
- Widget for home screen
- Apple Watch app

### Phase 12: Platform Expansion (Month 7)
- Android version
- macOS app
- Web player (PWA)
- Smart speaker integration (Alexa, Google Home)

### Phase 13: AI Personalization (Month 8+)
- Learn user preferences over time
- Suggest modes based on usage patterns
- Auto-adjust parameters based on feedback
- Personalized soundscape generation

---

## Appendix: Key Research References

### Endel Insights
- Endel Pacific: Patented AI engine, on-device generation
- Circadian rhythm-based parameter mapping
- Pricing: $19.99/month or $5.99/month (varies), 7-day free trial
- Features: Focus, Relax, Sleep, Activity modes
- Integrations: Apple Watch, Alexa, spatial audio

Sources:
- [Endel Technology Overview](https://endel.io/technology)
- [Endel Pricing & Features](https://techshark.io/tools/endel/)
- [Endel User Interface](https://screensdesign.com/showcase/endel-focus-sleep-sounds)

### Technical Implementation
- SonaAudio native module: Swift + AVAudioEngine, lowest-latency path on iOS
- WAV/CAF (PCM): Best for seamless looping and predictable timing
- AVAudioEngine Performance: Dedicated audio render thread, low-latency by default
- Superpowered SDK: Alternative for intensive DSP (if needed later)

Sources:
- [Apple AVAudioEngine Overview](https://developer.apple.com/documentation/avfaudio/avaudioengine)
- [Apple Audio File Formats](https://developer.apple.com/documentation/avfaudio/avaudiofile)

---

## Next Steps

1. **User approval of this plan**
2. **Initialize Expo project** with TypeScript
3. **Begin Phase 1** (Foundation Setup)
4. **Weekly check-ins** to review progress and adjust timeline

**Estimated Total Timeline**: 11 weeks to production-ready MVP (3 months)

**Team Size Assumption**: 1-2 developers full-time

**Budget Considerations**:
- Audio content: $500-1500 (royalty-free libraries or AI generation)
- Supabase: Free tier for MVP, $25/month for production
- RevenueCat: Free tier for MVP, $99/month when revenue > $2.5k/month
- App Store: $99/year (Apple Developer Program)

---

This is an ambitious but achievable project. The key to success is starting with a solid foundation (Phases 1-2), proving the core audio experience works (Phase 3-5), then layering on visual polish and business features (Phase 6-8). Let me know if you'd like to adjust any priorities or approaches!
