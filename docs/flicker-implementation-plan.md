# Flicker - Implementation Plan (Revised)

This plan replaces timeline-based estimates with execution tracks, hard technical gates, and explicit product rules.

---

## Product Rules (Non-Negotiable)

1. **Billing stack is Superwall** (not RevenueCat).
2. **Rewards are claimable only on full session completion**.
3. **Rendering strategy is React Native + Skia sprite pipeline** (single 2D renderer for character + sanctuary).
4. **iOS Deep Focus must persist even if app is backgrounded or killed**.
5. **No rewrite to Flutter/Unity for v1**. Build on the existing RN/Expo foundation.
6. **Move count-up display mode still requires a target duration for rewards**.
7. **Streak recovery is post-v1**.

---

## Build Philosophy

- Ship a playable, emotionally compelling loop first: `start session -> stay off phone -> complete -> earn light -> decorate sanctuary`.
- Keep visual style cozy and intentionally low-stimulus (Focus Friend principle).
- Avoid architecture ambiguity: each major subsystem has one owner path and one source of truth.
- Prefer deterministic systems over “smart” systems for core loops (session completion, reward minting, item purchases).

---

## Track 0 - Architecture Freeze + Rebrand Foundation

### Goal
Lock technical decisions before feature building so implementation does not fork.

### Checklist

- [ ] Rename app identity to Flicker (`app name`, icon, bundle identifiers, deep links, copy).
- [ ] Start Apple Screen Time entitlement request as soon as bundle ID is finalized:
  - `com.apple.developer.family-controls`
- [ ] Keep existing RN/Expo codebase; do not start a parallel Flutter branch.
- [ ] Freeze rendering decision:
  - Character animation: sprite sheets + Skia.
  - Sanctuary rendering: Skia scene composition.
  - Particle overlays: optional and Skia-compatible only (no mixed Skia + Three.js scene for core sanctuary).
- [ ] Freeze billing decision:
  - Superwall SDK as paywall orchestration layer.
  - Product IDs and entitlement names finalized now.
- [ ] Freeze completion/reward rule:
  - Any ended-early session yields **0 light**.
  - No partial minting paths in store logic, backend, or UI copy.
- [ ] Create architecture decision record section in docs:
  - `/Users/thomascadle/flicker-mobile/docs/flicker-technical-doc.md` becomes the canonical source.

### Exit Criteria

- A new engineer can read docs and understand exactly which tech is in/out.
- No references to RevenueCat remain.
- No references to partial rewards remain.

---

## Track 1 - Asset Pipeline (MP4 -> Transparent Frames -> Loopable Spritesheet)

### Goal
Create a repeatable production pipeline from AI video outputs into app-ready sprite assets.

### Checklist

- [ ] Standardize input spec for generated videos:
  - Fixed camera
  - Static flat background color (chroma-friendly)
  - No camera shake/zoom
  - 2-4s loop target
- [ ] Use the `video-to-transparent-spritesheet` skill as canonical pipeline.
- [ ] Create per-animation output package:
  - `frames_raw/`
  - `frames_alpha/`
  - `spritesheet.png`
  - `manifest.json` (`columns`, `rows`, `fps`, `frameCount`, `frameW`, `frameH`)
  - `preview.gif`
- [ ] Define pass/fail loop quality checklist:
  - Seam continuity (first/last frame blend)
  - Edge quality (no haloing)
  - Character center stability
  - No dropped/duplicated frames
- [ ] Build one command wrapper script for repeated processing.
- [ ] Enforce naming convention:
  - `assets/sprites/<mood>/<activity>.png`
  - `assets/sprites/<mood>/<activity>.json`

### Exit Criteria

- You can process a new MP4 into a tested sprite sheet in one repeatable command flow.
- Sprite sheet metadata is generated every time (no manual guessing in UI).

---

## Track 2 - Character Runtime + Animation State Machine

### Goal
Make Flicker feel alive with robust, controllable animation behavior.

### Checklist

- [ ] Build `SpriteAnimator` (Skia + Reanimated, frame-accurate).
- [ ] Build `FlickerCharacter` wrapper with explicit state machine:
  - Inputs: `mood`, `mode`, `sessionState`, `isInterrupted`, `isCelebrating`.
  - Outputs: animation clip key.
- [ ] Implement animation categories:
  - `idle`, `meditate`, `focus`, `move`, `sad`, `celebrate`.
- [ ] Add transition choreography:
  - Crossfade only where needed.
  - Short reaction clips for interruption and completion.
- [ ] Add micro-alive layer:
  - Idle breathing + occasional blink/tiny sway.
- [ ] Add animation debugging overlay (development-only):
  - current clip
  - frame index
  - FPS

### Exit Criteria

- Character looks emotionally responsive across all mode flows.
- Animation transitions are deterministic and testable.

---

## Track 3 - Session Engine for 3 Modes

### Goal
Implement robust mode-specific session flows without breaking existing reset logic.

### Checklist

- [ ] Extend `sessionStore` with explicit mode + completion state enums.
- [ ] Preserve existing Reset phase flow (fade -> still -> return).
- [ ] Add Focus flow (single phase countdown).
- [ ] Add Move flow with two UI options:
  - Countdown mode.
  - Count-up display mode with a required target duration selected at start.
- [ ] Enforce completion semantics:
  - Countdown: complete only at `remaining == 0`.
  - Count-up mode: complete only when elapsed >= selected target duration and user finishes.
  - Any early stop => status `abandoned` => zero reward.
- [ ] Build session lifecycle hooks:
  - `onStart`
  - `onPause`
  - `onResume`
  - `onAbandon`
  - `onComplete`

### Exit Criteria

- Session completion status is unambiguous in data and UI.
- Reward engine receives only `completed` sessions.

---

## Track 4 - Reward Economy + Persistence

### Goal
Implement a simple, strict, user-visible economy tied to completion.

### Checklist

- [ ] Create `currencyStore`:
  - `balance`
  - `lifetimeEarned`
  - `transactions[]`
- [ ] Reward formula:
  - Reset: `3 * sessionMinutes`
  - Focus: `2 * sessionMinutes`
  - Move: `1 * sessionMinutes`
  - Multipliers (streak/balance) applied only if session status is `completed`.
- [ ] Block all minting for `abandoned`, `cancelled`, `interrupted` sessions.
- [ ] Add transaction types:
  - `session_complete`
  - `streak_bonus`
  - `balance_bonus`
  - `shop_purchase`
- [ ] Persist to Supabase tables with idempotent transaction IDs.
- [ ] Add reconciliation on app foreground to avoid balance drift.

### Exit Criteria

- Rewards cannot be claimed unless the full timer condition is satisfied.
- Balance survives reinstall/sign-in and matches server state.

---

## Track 5 - Sanctuary + Shop Loop

### Goal
Implement the core retention loop: spend earned light to improve Flicker’s space.

### Checklist

- [ ] Define zone manifests (`zone.json` per zone) with anchor points and z-order.
- [ ] Build `sanctuaryStore`:
  - owned items
  - placed items
  - unlocked zones
- [ ] Build `SanctuaryView` with Skia layers:
  - background
  - placed items
  - character
  - foreground accents
- [ ] Build `Shop` flow:
  - catalog
  - buy
  - place
  - remove/move
- [ ] Add placement animation polish:
  - fade + scale bounce + optional sparkle.
- [ ] Add zone unlock requirements by earned light milestones.

### Exit Criteria

- A new user can complete sessions, earn light, buy items, and see room progression.

---

## Track 6 - iOS Deep Focus Blocking (Highest Technical Risk)

### Goal
Implement Screen Time-based blocking that remains active across app lifecycle changes.

### Mandatory Architecture

Deep Focus is **not** just a single JS bridge call. It includes:

- Main app + Expo module bridge
- Screen Time authorization flow (FamilyControls)
- ManagedSettings shield application
- DeviceActivity monitor/schedule
- Extension targets for monitor/shield behavior
- Shared App Group storage for session context and selected tokens

### Checklist

- [ ] Request and obtain `com.apple.developer.family-controls` entitlement.
- [ ] Configure App Group for app + extension targets.
- [ ] Build native module APIs:
  - `requestAuthorization`
  - `presentAppPicker`
  - `saveSelection`
  - `startSessionBlocking(sessionId, mode, endAt)`
  - `stopSessionBlocking(sessionId)`
  - `authorizationStatus`
- [ ] Build DeviceActivity monitor extension:
  - apply/refresh block at interval start
  - clear block at interval end
- [ ] Build Shield configuration extension (custom shield messaging/UX where appropriate).
- [ ] Persist active session metadata in App Group store.
- [ ] Wire session engine start/stop to native APIs.
- [ ] Handle edge cases:
  - app killed
  - permission revoked mid-session
  - overlapping sessions
  - device time changes

### Exit Criteria

- Blocking remains active when app is backgrounded/killed.
- Blocking always clears on valid session completion or explicit cancellation path.

---

## Track 7 - Onboarding + Paywall (Superwall)

### Goal
Ship conversion-focused onboarding tied to your product’s differentiators.

### Checklist

- [ ] Build onboarding flow with personalization inputs:
  - goals
  - screen-time profile
  - distractions
- [ ] Implement `onboardingStore` and persist completion state.
- [ ] Integrate Superwall:
  - placements
  - paywall presentation
  - purchase/restore hooks
- [ ] Define paywall offerings:
  - weekly
  - annual
  - lifetime
- [ ] Wire entitlement state to root navigation gate.
- [ ] Ensure app flow:
  - not onboarded -> onboarding
  - onboarded + no entitlement -> paywall
  - entitled -> main app

### Exit Criteria

- Purchase and restore flows work in sandbox and production.
- No RevenueCat code path is required for v1.

---

## Track 8 - Audio + Mode Personalization

### Goal
Leverage Flicker’s strongest differentiator: adaptive layered audio.

### Checklist

- [ ] Keep existing Swift audio engine unchanged where possible.
- [ ] Define per-mode audio defaults:
  - Reset: full adaptive stack
  - Focus: minimal focus stack or silence
  - Move: energetic stack or Spotify
- [ ] Resolve audio session policy with Spotify (exclusive route selection).
- [ ] Add lightweight “recommended mix by mode/time” logic using existing adaptive inputs.

### Exit Criteria

- Audio feels premium and mode-aware without introducing regression risk.

---

## Track 9 - QA, Telemetry, and Release Gates

### Goal
Validate correctness and product quality before launch.

### Checklist

- [ ] Build test matrix for all mode/session outcomes.
- [ ] Add deterministic tests for completion/reward logic.
- [ ] Add tests for purchase/balance transactions and idempotency.
- [ ] Add iOS deep-focus QA matrix:
  - lock screen
  - phone calls
  - app restart
  - force-quit
  - permission revoke
- [ ] Add performance profiling:
  - sprite memory
  - sanctuary frame pacing
  - battery under long sessions
- [ ] Prepare App Store submission artifacts and Screen Time reviewer notes.

### Exit Criteria

- All critical flows pass test matrix.
- App blocking + rewards + purchases are stable.

---

## Recommended Build Order (No Time Estimates)

1. Track 0 (freeze decisions)
2. Track 1 + Track 2 (asset pipeline + character runtime)
3. Track 3 + Track 4 (session correctness + reward correctness)
4. Track 6 (iOS deep focus risk burn-down)
5. Track 5 (sanctuary loop)
6. Track 7 (onboarding/paywall)
7. Track 8 (audio polish)
8. Track 9 (QA/release)

Parallelizable at any time:
- Asset generation batches
- Sanctuary art production
- Onboarding copy iteration

---

## Definition of Done (v1)

Flicker v1 is done when all are true:

- [ ] Users can run Reset, Focus, and Move sessions reliably.
- [ ] Early exits never produce rewards.
- [ ] Completed sessions always produce rewards and log transactions.
- [ ] Users can spend rewards in sanctuary and see persistent progression.
- [ ] iOS Deep Focus blocking works under real-world lifecycle conditions.
- [ ] Superwall paywall + restore + entitlement gating are production-ready.
- [ ] Audio experience is stable and meaningfully differentiating.
