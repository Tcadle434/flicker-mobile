# Decisions Log

Date: 2026-02-02

## Audio Architecture
- Native Swift audio engine (SonaAudio via Expo Modules) is the only audio path; the JS Web Audio engine was removed.
- Loop files are WAV/CAF (PCM) stored in the iOS app bundle for predictable low‑latency playback.
- JS loop selection is handled by a lightweight manifest loader + loop library, which maps layers and filenames before handing off to the native module.
- Debug/test audio controls are dev‑only and gated by `__DEV__`.

## Asset Bundling
- A `test.wav` placeholder tone is bundled into the iOS app resources at `ios/Sona/audio/test.wav` and referenced by default test manifests.
- Native `AudioBufferManager` searches bundle subdirectories (`audio`, `loops`, `assets`) to locate files.

## Adaptive System
- Adaptive parameters are mapped in JS and pushed to the native engine via volume + effect adjustments.
- Initial adapters (time, season, weather, heart rate stub) are implemented with safe fallbacks.

## Next Focus
- Add real WAV/CAF loop assets and update manifests to use real loop IDs.
- Wire adaptive inputs (location/health) and UI surfaces.
- Build rendering system and integration layer after audio path is stable.

## 2026-02-02 (later)
- Added JS manifest loader + loop library to drive native `loadMode` with layer configs.
- Added adaptive parameter mapper + adapters (time, season, weather, heart rate stub) and used them in `playerStore`.
- Bundled a `test.wav` placeholder tone into the iOS app resources.
- Gated debug audio controls in the Home screen behind `__DEV__`.
- Added adaptive controller + soundscape orchestrator stubs to align with integration plan.
- Connected Modes screen to the player store for basic mode selection.
- Generated placeholder WAV loops (ambient/nature/melody/rhythm/synthesis) for immediate testing; replace with real audio assets later.
- Added an adaptive update loop in `playerStore` to refresh inputs every 30s and push changes to the native engine.
- Updated Profile screen to surface subscription status and adaptive toggle.

## 2026-02-02 (later #2)
- Replaced placeholder loops with higher-quality 48kHz stereo synthetic loops (20s) via `scripts/generate_audio_loops.py`.
- Added `SonaSensors` native Expo module for CoreLocation + HealthKit heart rate (read-only).
- Added podspec + package.json for `SonaSensors` to ensure Expo autolinking picks it up.
- Cached location for 10 minutes and return `null` on denied/unavailable to keep adaptive pipeline resilient.
- Added HealthKit entitlements (read-only) and kept Info.plist usage strings.
- Sync-started multi-layer playback using a shared `AVAudioTime` for tighter alignment.

## 2026-02-03
- Imported Epic Nature Loops assets (forest, soft rain, beach) and converted to 48kHz stereo WAVs for bundle playback.
- Added `nature_loop_02` and `nature_loop_03` assets and expanded manifests to rotate among nature loops.
- Updated loop selector to choose a random loop per layer when multiple are available.
- Imported SoundGhost Bliss drones (D key) for ambient layer and converted to 48kHz WAVs.
- Expanded manifests to rotate among multiple ambient loops.
- Imported AI-generated melody stems (D minor) for focus/relax/sleep and trimmed to 60s for consistent looping.

## 2026-02-05
- Pivoted product to a single Sensory Reset ritual (no multi-mode library in V1).
- Home screen uses a 3D GL orb as the primary action (liquid-glass aesthetic).
- Enter transition should feel like flying through the orb; added warp/flash effect.
- Session screen shows only timer and an orb icon to open the feel pad; no early stop.
- Post-reset uses a short daily rotating message instead of check-ins.
- Background audio enabled via UIBackgroundModes.
- Supabase chosen for auth + subscription gating (RevenueCat/StoreKit integration later).
