# Sona - Production-Grade Adaptive Ambient Music App

> **Note (2026-02-02):** This document is deprecated. The audio engine is now a native Swift module (SonaAudio). Refer to `docs/IMPLEMENTATION_PLAN.md` for the current architecture and tasks.

**Vision**: An Endel-inspired app with adaptive ambient music + 3D visual environments that respond in real-time to time of day, weather, heart rate, and season.

**Tech Stack**: React Native + Expo Router, react-native-audio-api, Zustand, Three.js/Skia, Supabase, RevenueCat

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
- **Use react-native-audio-api** (Web Audio API for React Native) instead of custom native modules
- **Pre-composed loops** (50-100 high-quality OGG files) as the foundation
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
│  │   AudioEngine       │          │   RenderEngine       │ │
│  │ (react-native-      │          │ (Three.js + Skia)    │ │
│  │  audio-api)         │ ←Sync→   │  3D Scenes           │ │
│  │ - Loop playback     │          │ - Adaptive visuals   │ │
│  │ - Synthesis         │          │ - Particles          │ │
│  │ - Effects chain     │          │ - Atmosphere         │ │
│  └─────────────────────┘          └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

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
AudioEngine (singleton)
  ├── LayerManager (manages 5 audio layers)
  │   └── AudioLayer (handles playback + crossfading)
  ├── SynthesisEngine (binaural beats, tones)
  ├── AudioMixer (volume control, master chain)
  ├── EffectsChain (reverb, filters, compression)
  └── PerformanceMonitor (CPU, memory tracking)

ParameterMapper
  └── Maps adaptive inputs → audio parameters

LoopLibrary
  └── Loads/caches audio files, metadata-driven selection
```

**Audio Layers**:
1. **Ambient** - Long pads, drones (foundation)
2. **Nature** - Rain, wind, ocean (environmental)
3. **Melody** - Piano, bells, strings (musical)
4. **Rhythm** - Subtle pulses, heartbeat (optional)
5. **Synthesis** - Binaural beats, generated tones

**File Format**: OGG Vorbis (best for seamless looping)

**Sample Library Organization**:
```
assets/audio/loops/
├── ambient/
│   ├── pad_warm_01.ogg + pad_warm_01.json (metadata)
│   └── ...
├── nature/
│   ├── rain_light_01.ogg + rain_light_01.json
│   └── ...
└── manifests/
    ├── focus.json (defines which loops for Focus mode)
    ├── relax.json
    └── sleep.json
```

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
1. Setup react-native-audio-api
2. Implement AudioEngine, LayerManager, AudioLayer
3. Implement LoopLibrary with metadata system
4. Create 3 initial soundscape modes (Focus, Relax, Sleep)
5. Source/create initial 30 audio loops (10 per mode)
6. Implement crossfading system (equal-power curves)
7. Implement SynthesisEngine (binaural beats only for MVP)
8. Implement basic EffectsChain (reverb, filter, compression)
9. Add PerformanceMonitor for CPU tracking
10. Create audioStore (Zustand) for state management

#### Key Files:
- `src/audio/core/AudioEngine.ts`
- `src/audio/core/LayerManager.ts`
- `src/audio/core/AudioLayer.ts`
- `src/audio/loops/LoopLibrary.ts`
- `src/audio/synthesis/BinauralBeatGenerator.ts`
- `src/audio/effects/EffectsChain.ts`
- `src/audio/parameters/ParameterMapper.ts`
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
- `src/audio/adapters/TimeAdapter.ts`
- `src/audio/adapters/WeatherAdapter.ts`
- `src/audio/adapters/HeartRateAdapter.ts`
- `src/audio/adapters/SeasonAdapter.ts`
- `src/audio/parameters/ParameterMapper.ts`
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
  - audioEngine: AudioEngine
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
- `src/audio/AudioStateProvider.tsx`

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
2. Setup lock screen controls (react-native-track-player)
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
- `src/audio/utils/backgroundAudio.ts`
- `src/services/background/adaptiveMonitor.ts`
- `src/audio/performance/PerformanceMonitor.ts`
- `src/audio/performance/QualityManager.ts`
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
6. `src/audio/core/AudioEngine.ts` - Main audio engine
7. `src/audio/core/LayerManager.ts` - Layer management
8. `src/audio/loops/LoopLibrary.ts` - Loop loading + metadata
9. `src/audio/parameters/ParameterMapper.ts` - Adaptive mapping
10. `src/stores/playerStore.ts` - Playback state
11. `assets/audio/manifests/focus.json` - Mode definition

### Tier 3: Adaptive System (Week 4)
12. `src/integration/AdaptiveController.ts` - Orchestrates adapters
13. `src/audio/adapters/TimeAdapter.ts` - Time of day
14. `src/audio/adapters/WeatherAdapter.ts` - Weather API
15. `src/audio/adapters/HeartRateAdapter.ts` - HealthKit
16. `src/stores/adaptiveStore.ts` - Adaptive state

### Tier 4: Rendering (Week 5-6)
17. `src/rendering/core/RenderEngine.ts` - 3D rendering engine
18. `src/rendering/scenes/FocusScene.ts` - First 3D scene
19. `src/rendering/particles/AudioReactiveParticleSystem.ts` - Particles
20. `src/rendering/components/SceneCanvas.tsx` - UI integration

### Tier 5: Integration (Week 7)
21. `src/integration/SoundscapeOrchestrator.ts` - Central coordinator
22. `src/integration/SyncEngine.ts` - Audio-visual sync
23. `src/hooks/useSoundscape.ts` - Main integration hook

### Tier 6: UI (Week 8-9)
24. `app/(main)/home.tsx` - Main player screen
25. `app/(main)/mixer.tsx` - Mixer interface
26. `src/components/mixer/LayerSlider.tsx` - Volume controls

### Tier 7: Onboarding (Week 10)
27. `app/(onboarding)/welcome.tsx` - Onboarding start
28. `app/(onboarding)/paywall.tsx` - Subscription paywall
29. `src/services/subscription/revenueCat.ts` - RevenueCat SDK

### Tier 8: Polish (Week 11)
30. `src/audio/utils/backgroundAudio.ts` - Background playback
31. `src/audio/performance/PerformanceMonitor.ts` - Optimization

---

## Tech Stack Details

### Core Dependencies
```json
{
  "expo": "~52.0.0",
  "react-native": "0.76.0",
  "expo-router": "~4.0.0",
  "react-native-audio-api": "^0.3.2",
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
- react-native-audio-api: Web Audio API for React Native, production-ready
- OGG Vorbis: Best format for seamless looping, small file size
- Web Audio API Performance: Separate audio thread, <10ms latency possible
- Superpowered SDK: Alternative for intensive DSP (if needed later)

Sources:
- [react-native-audio-api Documentation](https://docs.swmansion.com/react-native-audio-api/)
- [Building Real-Time Audio Pipelines](https://www.callstack.com/blog/from-files-to-buffers-building-real-time-audio-pipelines-in-react-native)
- [Audio Format Comparison](https://www.gumlet.com/learn/ogg-vs-mp3/)

---

---

# PHASE 2 IMPLEMENTATION PLAN: Audio Engine Core

**Status**: Phase 1 Complete ✅ | Ready to implement Phase 2
**Timeline**: 10 days (2 weeks)
**Goal**: Build production-grade adaptive audio engine with seamless loop playback

## Current State (From Phase 1)

**What's Ready** ✅:
- Complete folder structure (`src/audio/core/`, `src/audio/loops/`, etc.)
- Type definitions for audio system (`AudioLayer`, `LoopMetadata`, `ModeManifest`)
- playerStore.ts with placeholder implementations
- Audio configuration in `config.ts` (sampleRate: 44100, bufferSize: 512, crossfadeDuration: 4000ms)
- UI components (Button, Slider, Card) ready for integration

**What's Missing** ❌:
- react-native-audio-api not installed
- All audio classes unimplemented (AudioEngine, LayerManager, AudioLayer, etc.)
- No audio files or manifests
- No synthesis engine
- No effects chain

## Implementation Strategy

### Approach: Incremental Build with Test Tones

**Why**: Build from bottom-up, testing each component independently. Use procedurally generated test tones initially (sine waves, pink noise) to validate engine logic before sourcing real audio. This prevents audio sourcing from blocking development.

**MVP Scope for Week 1**:
- Focus mode ONLY (defer Relax, Sleep to Week 2)
- 3 layers: Ambient, Nature, Synthesis (skip Melody, Rhythm)
- 10-15 test tones/loops
- Basic crossfading (equal-power, 4 seconds)
- Fixed binaural frequency (10 Hz for focus)
- Volume controls only (defer effects to Week 2)

## 10-Day Implementation Sequence

### Day 1: Audio API Setup & Context
**Files to Create**:
- Install: `npm install react-native-audio-api@0.3.2 --legacy-peer-deps`
- `src/audio/core/AudioContext.ts` - Singleton wrapper for Web Audio API
- `src/audio/utils/audioFileLoader.ts` - Load audio from assets
- `src/audio/utils/testToneGenerator.ts` - Generate test sine waves

**Milestone**: Audio context initialized, test tone plays

### Day 2: Single Layer Playback
**Files to Create**:
- `src/audio/core/AudioLayer.ts` - Single layer with basic playback
- `src/audio/core/__tests__/AudioLayer.test.ts` - Unit tests

**What to Implement**:
- Load AudioBuffer from file/generator
- Play/pause/stop methods
- Loop playback (AudioBufferSourceNode.loop = true)
- Volume control (GainNode)

**Milestone**: Can play ONE looping test tone with volume control

### Day 3: Crossfading System
**Files to Create**:
- `src/audio/effects/CrossfadeManager.ts` - Equal-power crossfade curves
- `src/audio/effects/__tests__/CrossfadeManager.test.ts` - Verify curves

**What to Implement**:
- Generate equal-power crossfade curve (out² + in² = 1)
- AudioLayer.crossfadeTo(newBuffer, duration) method
- Overlap playback: start new loop while old one fades out

**Milestone**: Two test tones crossfade smoothly (no clicks/pops)

### Day 4: Loop Library & Metadata
**Files to Create**:
- `src/audio/loops/LoopLibrary.ts` - Central loop registry
- `src/audio/loops/LoopMetadata.ts` - Metadata parser/validator
- `assets/audio/loops/ambient/test_pad_01.json` - Example metadata

**Metadata Schema**:
```json
{
  "id": "test_pad_01",
  "filename": "test_pad_01.ogg",
  "duration": 8.0,
  "layer": "ambient",
  "tags": {
    "mode": ["focus"],
    "energy": 3,
    "density": 2
  },
  "defaultVolume": 0.7,
  "crossfadeDuration": 4.0
}
```

**Milestone**: LoopLibrary loads metadata, retrieves test tones by ID

### Day 5: Mode Manifests & Loop Selection
**Files to Create**:
- `assets/audio/manifests/focus.json` - Focus mode configuration
- `src/audio/loops/ManifestLoader.ts` - Load mode manifests
- `src/audio/loops/LoopSelector.ts` - Select loops based on tags

**focus.json Schema**:
```json
{
  "id": "focus",
  "name": "Focus",
  "description": "Enhanced concentration and productivity",
  "loops": {
    "ambient": ["test_pad_01", "test_pad_02", "test_pad_03"],
    "nature": ["test_rain_01", "test_wind_01"],
    "synthesis": ["test_binaural_10hz"]
  },
  "defaultMix": {
    "ambient": 0.7,
    "nature": 0.5,
    "synthesis": 0.3
  },
  "binauralFrequency": { "min": 10, "max": 12 }
}
```

**Milestone**: Load Focus mode manifest, select loops for 3 layers

### Day 6: Multi-Layer System & Engine Integration
**Files to Create**:
- `src/audio/core/LayerManager.ts` - Manages 5 AudioLayer instances
- `src/audio/core/AudioEngine.ts` - Main singleton orchestrator

**AudioEngine Public API**:
```typescript
class AudioEngine {
  static getInstance(): AudioEngine
  async initialize(): Promise<void>
  async loadMode(mode: SoundscapeMode): Promise<void>
  async play(): Promise<void>
  pause(): void
  stop(): void
  setLayerVolume(layer: AudioLayer, volume: number): void
  setMasterVolume(volume: number): void
  getState(): AudioEngineState
}
```

**Milestone**: Load Focus mode, play 3 layers simultaneously

### Day 7: Binaural Beat Synthesis
**Files to Create**:
- `src/audio/synthesis/BinauralBeatGenerator.ts` - Stereo tone generation
- `src/audio/synthesis/OscillatorManager.ts` - Manage oscillator nodes

**Implementation**:
- Left channel: base frequency (e.g., 200 Hz)
- Right channel: base + beat frequency (e.g., 210 Hz = 10 Hz beat)
- Connect to synthesis layer in LayerManager

**Milestone**: Hear binaural beat effect in headphones (10 Hz for focus)

### Day 8: Basic Effects Chain
**Files to Create**:
- `src/audio/effects/EffectsChain.ts` - Chain of audio effects
- `src/audio/effects/ReverbNode.ts` - Convolution reverb

**What to Implement**:
- Master effects chain: Input → Reverb → Output
- Simple reverb (use ConvolverNode with impulse response)
- Dry/wet mix control

**Milestone**: Add reverb to master output, sounds more spacious

### Day 9: Performance Monitoring
**Files to Create**:
- `src/audio/performance/PerformanceMonitor.ts` - CPU/memory tracking
- `src/audio/performance/AudioQualityManager.ts` - Adaptive quality

**What to Monitor**:
- CPU usage (via InteractionManager timing)
- Memory usage (track AudioBuffer allocations)
- Audio dropouts (detect buffer underruns)
- Target: <15% CPU usage

**Milestone**: Performance metrics logged, no dropouts during 5-min test

### Day 10: PlayerStore Integration & UI
**Files to Update**:
- `src/stores/playerStore.ts` - Replace placeholders with AudioEngine calls
- `app/(main)/home.tsx` - Add basic play/pause controls
- `app/(main)/mixer.tsx` - Add layer volume sliders

**Integration Flow**:
```typescript
// playerStore.ts
play: async () => {
  const engine = AudioEngine.getInstance();
  await engine.initialize();
  await engine.loadMode(get().mode);
  await engine.play();
  set({ playbackState: 'playing' });
}
```

**Milestone**: UI controls trigger audio playback, volumes adjust in real-time

## Week 2 Expansion (Days 11-14)

**Add 2 More Modes**:
- Create `relax.json` and `sleep.json` manifests
- Adjust binaural frequencies (7.5 Hz relax, 2-4 Hz sleep)
- Add 10-15 loops for each mode

**Enable Full 5 Layers**:
- Add melody and rhythm layers to LayerManager
- Update UI to show all 5 layer controls

**Source Real Audio**:
- Download 30 loops from Freesound.org or Splice
- Convert to OGG Vorbis, ensure seamless looping
- Replace test tones with real audio

**Polish**:
- Add loading states and error handling
- Implement proper cleanup on app close
- Add CPU throttling if performance drops

## Critical Files to Create (Priority Order)

1. **src/audio/core/AudioEngine.ts** - Main orchestrator (Day 6)
2. **src/audio/core/AudioLayer.ts** - Single layer playback (Day 2)
3. **src/audio/loops/LoopLibrary.ts** - Asset management (Day 4)
4. **src/audio/effects/CrossfadeManager.ts** - Seamless transitions (Day 3)
5. **src/stores/playerStore.ts** - Update placeholders (Day 10)
6. **assets/audio/manifests/focus.json** - Mode configuration (Day 5)

## Testing Strategy

**Unit Tests** (Jest):
- AudioLayer: load, play, pause, crossfade
- CrossfadeManager: curve generation, equal-power validation
- LoopLibrary: metadata loading, loop selection

**Manual Testing Checklist**:
- [ ] Day 2: Hear test tone loop continuously
- [ ] Day 3: Crossfade produces no clicks/pops
- [ ] Day 6: 3 layers play simultaneously
- [ ] Day 7: Binaural beat audible in headphones
- [ ] Day 9: CPU usage <15% on iPhone 12
- [ ] Day 10: UI controls trigger audio changes

**Performance Testing**:
- Play Focus mode for 5 minutes continuously
- Monitor CPU with Xcode Instruments
- Check memory with React DevTools Profiler
- Test on physical device (not just simulator)

## Audio Asset Strategy

**Week 1: Test Tones** (Procedurally Generated)
```typescript
// Generate in testToneGenerator.ts
- Ambient: 80 Hz sine wave (8 sec)
- Nature: Pink noise (8 sec)
- Synthesis: 200 Hz + 210 Hz binaural
```

**Week 2: Real Audio** (Royalty-Free)
- Source: Freesound.org, Splice free tier, or AudioJungle
- Search: "ambient pad", "rain loop", "meditation drone"
- Format: OGG Vorbis, 44.1kHz, stereo
- Process: Trim to seamless loops in Audacity
- Target: 30 loops total (10 per mode)

## Risk Mitigation

**Risk: react-native-audio-api doesn't work**
- Mitigation: Test Day 1, have fallback (expo-av or react-native-sound)

**Risk: Crossfading produces artifacts**
- Mitigation: Try multiple curve types, adjust overlap duration

**Risk: CPU usage exceeds 15%**
- Mitigation: Increase buffer size (512→1024), reduce layers, implement quality presets

**Risk: Can't source quality audio**
- Mitigation: Test tones prove engine works, AI generation as backup ($50-200)

## Success Criteria (End of Phase 2)

**Technical**:
- [ ] 3 modes (Focus, Relax, Sleep) implemented
- [ ] All 5 layers playing with independent volume control
- [ ] Seamless loop crossfading (no audible seams)
- [ ] Binaural beats at mode-specific frequencies
- [ ] CPU usage <15%, no audio dropouts
- [ ] 30+ audio loops integrated

**User Experience**:
- [ ] Press play, hear Focus soundscape immediately
- [ ] Adjust mixer sliders, volumes change smoothly
- [ ] Switch modes, audio crossfades to new soundscape
- [ ] Sounds pleasant/musical (not robotic test tones)

**Code Quality**:
- [ ] AudioEngine singleton properly initialized/cleaned up
- [ ] No memory leaks (tested with 30-min session)
- [ ] Error handling for failed audio loads
- [ ] Unit tests for critical components
- [ ] TypeScript strict mode passing

## Next Phase Preview

**Phase 3: Adaptive System** (Week 4)
- Connect TimeAdapter, WeatherAdapter, HeartRateAdapter
- Implement ParameterMapper (time → energy, weather → density)
- Real-time parameter adjustments every 30 seconds
- Loop selection adapts to adaptive inputs

After Phase 2, the app will play beautiful soundscapes, but they'll be static. Phase 3 makes them *adaptive* to user context.

---

**Ready to implement!** 🎵
