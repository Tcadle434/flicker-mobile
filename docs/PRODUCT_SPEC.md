# Sona V1 Product Spec - Sensory Reset

Date: 2026-02-05

## One-line vision
A short sensory reset for your mind.

Sona is not a content library. It is a ritual: tap the orb, enter a calming visual+audio experience, and return grounded.

---

## Core experience

### Home
- Primary action: a large liquid-glass orb labeled "Reset" (tap to start).
- Duration chips (liquid glass): 3 / 5 / 15 minutes. Default = 5.
- Streak bar at top: 7 ticks for the week, filled per reset day.
- Streak count to the right of the ticks (can exceed 7 days).

### Enter (transition)
- Tap orb triggers an "entering the orb" animation (warp/zoom/refraction).
- Audio fades in over 10-20s.
- Visuals begin to animate during the transition.
- Transition should feel like flying through the orb into the session.

### Session
- Full-screen abstract visual (swirling light / aurora style).
- Timer only (top-left). No early stop.
- Small orb icon (top-right) opens the feel control panel.

### Return
- 20-30s gentle return animation.
- Single line: "You're here." (or similar).

### Post-reset
- One short daily-changing message. Example: "Carry this with you."
- "Done" button.
- Streak updates silently.

---

## Sound design

### Mode strategy
- V1 ships with ONE mode: Reset.
- We use 5 curated families for variation.
- One key/scale for the Reset mode (locked for now).

### Sound families
Each family is a pre-auditioned bundle:
- 1 ambient drone (tonal anchor)
- 1 melody (same key/scale, always on but very subtle)
- 2-3 nature textures (atonal only)
- No rhythm in V1

### Mixing rules
- Melody always on, low in the mix (subtle thread).
- Nature is quiet and non-pitched.
- No abrupt changes; only fades.

### Start/End cue
- No voice narration in V1.
- Use a soft tonal earcon (2-3 seconds) in the same key at session start/end.

---

## Feel control pad (session UI)

- Tap orb icon to open a square glass panel.
- Center orb acts as the cursor.
- Axes labels:
  - Left/Right: Warm <-> Bright
  - Bottom/Top: Calm <-> Clear

Mapping (initial):
- Warm/Bright: EQ cutoff + reverb mix
- Calm/Clear: melody volume + nature density

Behavior:
- Starts centered.
- Small range changes (10-20% max).
- Smooth fades only.

---

## Personalization inputs (V1)

Primary inputs:
- Time of day
- Weather
- Heart rate (optional)

Fallback:
- If HR unavailable, use time + weather.
- Location permission requested on first reset to enable weather.

---

## Visual design

- Liquid glass aesthetic: soft gradients, blur, refraction.
- Orb is the ritual object and must be fully animated, 3D, and cosmic.
- Use a real 3D render (GL + Three.js) with a custom shader:
  - Fresnel edge glow
  - Animated noise displacement / swirling nebula
  - Bright white core with deep color gradients
  - Subtle bloom/halo
- Session visuals: swirling light / aurora, slow motion, no hard edges.

---

## Streaks and notifications

- Weekly streak bar = 7 ticks.
- Total streak count displayed on Home and Post-reset.
- One daily prompt:
  "Life moves fast. Give Sona 5 minutes to help you slow down."

---

## Backend and auth

We will use a minimal Supabase backend to support auth and subscription gating.

### Supabase usage
- Auth: email/OTP or Sign in with Apple (iOS).
- Database tables:
  - profiles (user preferences)
  - sessions (timestamp, duration)
  - streaks (current streak, weekly ticks)
  - subscription_status (active, expiration, platform)

### Subscriptions
- Payments must use Apple IAP (iOS). Supabase stores the subscription status.
- We can mirror status via RevenueCat or StoreKit receipt verification.

---

## Non-goals (V1)

- No content library.
- No long guided meditations.
- No journaling.
- No multiple modes beyond Reset.

---

## Success criteria (V1)

- User completes a 3-5 minute reset with zero friction.
- Experience feels premium, calm, and distinct.
- Audio families never clash.
- Visuals are smooth and immersive.
