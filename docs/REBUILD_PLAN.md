# Plan: Sona App Full Rebuild

> **First Step**: Copy this entire plan to `docs/REBUILD_PLAN.md` in the project

## Summary
Complete rebuild of the Sona mental wellness app according to the final product spec. Transform from current state (basic session flow with static SonaFace) into a polished "anti-noise ritual" with Three.js particle orb, 3-phase session flow, mood-based theming, and sound family system.

---

## Key Decisions from User

1. **Home Orb**: Replace SonaFace with Three.js particle orb (FBO-Core style)
2. **Sona Character**: Keep PNG images, show in header/footer based on mood state
3. **Session Visuals**: Fluid simulation or shader aurora with depth (not flat)
4. **Session UI**: Minimal - small timer in corner during Still phase
5. **Background**: Horizontal wave bands that pulse in mood color
6. **Voice Lines**: User will provide audio files
7. **Sound Families**: Folder-based organization (e.g., `/audio/families/d-major/`)
8. **Approach**: Full rebuild before release

---

## Architecture Overview

### New State Management (Zustand stores)

| Store | Purpose |
|-------|---------|
| `sessionStore` | Session phase (idle/fade/still/return/complete), timing |
| `moodStore` | Current mood (calm/neutral/overwhelmed), theme colors |
| `streakStore` | Weekly days, total resets, current streak |
| `soundPadStore` | Pad position (warmth/density), visibility |

### Mood States & Timing

| Mood | Condition | Colors |
|------|-----------|--------|
| CALM | Reset < 12 hours ago | Light blue/teal |
| NEUTRAL | Reset 12-24 hours ago | White/grey |
| OVERWHELMED | Reset > 24 hours ago | Red |

### Session Phases

| Phase | Duration | What Happens |
|-------|----------|--------------|
| FADE | 10-20s | UI dims, sound drops, voice intro plays |
| STILL | 3/5/15 min | Minimal UI, full visuals, soundscape |
| RETURN | 20-30s | Sound swells, voice outro, UI fades in |

---

## Implementation Plan

### Phase 1: Theme & State Foundation

**Files to create:**
- `src/constants/moodThemes.ts` - 3 mood color schemes
- `src/stores/moodStore.ts` - mood calculation, theme selection
- `src/stores/streakStore.ts` - streak tracking, weekly reset
- `src/stores/sessionStore.ts` - session phase state machine
- `src/stores/soundPadStore.ts` - pad position state
- `src/providers/MoodThemeProvider.tsx` - theme context
- `src/hooks/useMoodTheme.ts` - consume mood theme

**Files to modify:**
- `src/services/storage/resetStorage.ts` - add streak persistence

### Phase 2: Home Screen Rebuild

**Files to create:**
- `src/components/visuals/ParticleOrb/index.tsx` - main component
- `src/components/visuals/ParticleOrb/FBOParticleSystem.tsx` - FBO logic
- `src/components/visuals/ParticleOrb/shaders/*.glsl` - GPU shaders
- `src/components/visuals/WaveBands/index.tsx` - pulsing background
- `src/components/ui/StreakDisplay.tsx` - 7-day ticks + count
- `src/components/ui/DurationSelector.tsx` - 3/5/15 min chips
- `src/components/ui/GlassCard.tsx` - mood-aware glassmorphism

**Files to modify:**
- `app/(main)/home.tsx` - complete rewrite with new components

**Home Screen Layout:**
```
┌─────────────────────────┐
│ [Sona Face]  [Streak: 3]│  ← Header with mood-based face
│      ○ ○ ○ ● ○ ○ ○      │  ← Weekly streak ticks
├─────────────────────────┤
│                         │
│    ╭─────────────────╮      │
│    │  PARTICLE   │      │  ← Three.js FBO orb (tap to start)
│    │    ORB      │      │
│    ╰─────────────────╯      │
│                         │
├─────────────────────────┤
│   [3 min] [5 min] [15]  │  ← Duration selector
├─────────────────────────┤
│   "Let the noise fade." │  ← Footer message
└─────────────────────────┘
  ↑ Horizontal wave bands pulse behind everything
```

### Phase 3: Session Screen Rebuild

**Files to create:**
- `src/components/visuals/Session/FluidSimulation.tsx` - main session visual
- `src/components/visuals/Session/BreathingPulse.tsx` - breathing overlay
- `src/components/ui/MoodCheckIn.tsx` - Calmer/Same/Worse buttons
- `src/controllers/SessionFlowController.ts` - phase orchestration
- `src/services/audio/VoicePromptService.ts` - play intro/outro

**Files to modify:**
- `app/(session)/reset.tsx` - complete rewrite with 3-phase flow
- `app/(session)/complete.tsx` - add mood check-in

**Session Flow:**
```
FADE (15s)
  ├─ UI opacity → 0
  ├─ Sound volume → 5%
  └─ Play voice: "Entering your mental reset. Enjoy"

STILL (3/5/15 min)
  ├─ Timer in corner only
  ├─ Full-screen fluid visuals
  ├─ Sound pad available (optional)
  └─ Ambient soundscape plays

RETURN (25s)
  ├─ Sound swells gently
  ├─ Play voice: "Welcome back..."
  └─ UI fades back in

COMPLETE
  ├─ "Reset complete"
  ├─ Mood check-in (Calmer/Same/Worse or Skip)
  └─ Update streak
```

### Phase 4: Sound System Rebuild

**Files to create:**
- `src/services/audio/SoundFamilyController.ts` - family loading/mixing
- `src/services/audio/SoundFamilyLoader.ts` - load manifests
- `src/components/ui/SoundPad.tsx` - draggable Endel-style pad

**Files to modify:**
- `src/stores/playerStore.ts` - add family support, pad integration
- `src/services/audio/nativeAudioBridge.ts` - family methods, voice prompts

**Audio Asset Structure:**
```
assets/audio/
  families/
    d-major/
      manifest.json
      drone_01.wav, drone_02.wav
      melody_01.wav, melody_02.wav
      nature_01.wav
    f-minor/
      manifest.json
      ...
  voice/
    intro_01.wav
    outro_01.wav
```

**Sound Pad Mapping:**
```
         Clear (sparse)
              ↑
    Warm ←─── ● ───→ Bright
              ↓
         Calm (dense)

Pad position controls layer volumes:
- X axis: warmth (filter cutoff, layer mix)
- Y axis: density (layer count, reverb)
```

### Phase 5: Polish & Integration

- Haptic feedback on orb tap, pad drag
- Animated transitions between mood themes
- Performance optimization for particle orb
- Test on multiple device sizes
- Streak persistence to Supabase (optional)

---

## Files Modified (Summary)

### Create New (19 files)
```
src/constants/moodThemes.ts
src/stores/moodStore.ts
src/stores/streakStore.ts
src/stores/sessionStore.ts
src/stores/soundPadStore.ts
src/providers/MoodThemeProvider.tsx
src/hooks/useMoodTheme.ts
src/components/visuals/ParticleOrb/index.tsx
src/components/visuals/ParticleOrb/FBOParticleSystem.tsx
src/components/visuals/ParticleOrb/shaders/position.frag
src/components/visuals/ParticleOrb/shaders/render.frag
src/components/visuals/WaveBands/index.tsx
src/components/visuals/Session/FluidSimulation.tsx
src/components/ui/StreakDisplay.tsx
src/components/ui/DurationSelector.tsx
src/components/ui/GlassCard.tsx
src/components/ui/MoodCheckIn.tsx
src/components/ui/SoundPad.tsx
src/controllers/SessionFlowController.ts
src/services/audio/SoundFamilyController.ts
src/services/audio/VoicePromptService.ts
```

### Modify Existing (6 files)
```
app/(main)/home.tsx              - Complete rewrite
app/(session)/reset.tsx          - Complete rewrite
app/(session)/complete.tsx       - Add mood check-in
src/stores/playerStore.ts        - Sound family support
src/services/audio/nativeAudioBridge.ts - Family + voice methods
src/services/storage/resetStorage.ts    - Streak persistence
```

### Keep As-Is
```
src/components/visuals/SonaFace.tsx     - Use in header
src/components/visuals/SessionAurora.tsx - May enhance or replace
src/constants/theme.ts                   - Base theme (extend, don't replace)
```

---

## Technical Notes

### Three.js Particle Orb
- Use `expo-gl` with raw Three.js (not react-three-fiber)
- FBO ping-pong pattern for GPU particle simulation
- 10,000-30,000 particles, scale based on device
- Mood affects: color, movement speed, particle density

### Session Visuals
- Start with enhanced shader aurora (simpler)
- Can upgrade to fluid simulation later
- Breathing pulse: 4-6 second sine wave affecting brightness/scale

### Sound Pad
- Pan gesture handler for drag
- Debounce audio updates (50-100ms)
- Visual: glassmorphic square with draggable cursor
- Haptic feedback on movement

---

## Verification

1. **Home Screen**
   - Particle orb renders and animates
   - Mood theme changes based on last reset time
   - Wave bands pulse in background
   - Sona face shows in header matching mood
   - Streak display shows correct day marks
   - Duration selector works

2. **Session Flow**
   - Fade phase: UI dims, sound drops, voice plays
   - Still phase: Minimal timer, full visuals, soundscape
   - Return phase: Swell, voice outro, UI returns
   - Sound pad (if opened) affects sound

3. **Post-Session**
   - Mood check-in appears
   - Skip works
   - Streak updates correctly
   - Navigate back to home with updated mood

4. **Run Commands**
   ```bash
   npx expo start
   # Test on iOS simulator and physical device
   ```
