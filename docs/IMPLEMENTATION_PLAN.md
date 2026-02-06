# Sona V1 - Sensory Reset Implementation Plan

Date: 2026-02-05

This plan reflects the pivot to a single-mode sensory reset experience. The previous multi-mode plan has been archived at `docs/IMPLEMENTATION_PLAN_LEGACY.md`.

---

## Phase 1 - Core Reset Flow (UI + Navigation)

Goal: Build the ritual experience end-to-end.

Tasks:
- Install GL + Three dependencies for real 3D orb (expo-gl, three, expo-three)
- Home screen (liquid glass): cosmic 3D orb + duration chips + streak bar
- Build Orb3D component (custom shader: nebula swirl + Fresnel glow + bright core)
- Enter animation (orb warp/zoom/refraction, feels like flying through the orb)
- Session screen: timer top-left, orb icon top-right
- Post-reset screen: daily message + done
- Background audio enabled

Verification:
- Tap orb enters session with transition
- Timer counts down (3/5/15)
- No early stop UI
- Post-reset message displays and rotates daily

---

## Phase 2 - Audio Family System (Reset mode only)

Goal: Guarantee compatibility and variation without clashes.

Tasks:
- Define Family metadata (key/scale/tempo/brightness/density)
- Build 5 curated families (ambient + melody + nature)
- Lock selection to a single key/scale for Reset mode
- Add earcon start/end (same key)

Verification:
- Each family sounds cohesive in isolation
- No clashing between ambient and melody
- Only nature layers are atonal

---

## Phase 3 - Feel Pad (In-session control)

Goal: Give subtle control over feel without overwhelming the user.

Tasks:
- Add glass control panel with orb cursor
- Map axes:
  - Warm <-> Bright (EQ + reverb)
  - Calm <-> Clear (melody + nature density)
- Smooth parameter fades

Verification:
- Small changes, never jarring
- Feels intuitive without UI instructions

---

## Phase 4 - Personalization + Adaptation

Goal: Use time, weather, and HR to select and shape families.

Tasks:
- Ask location permission on first reset
- Weather input (time + weather fallback if HR missing)
- Heart rate input (optional)
- Map inputs to family selection + parameters

Verification:
- No permission blockers
- Fallback logic works with no HR

---

## Phase 5 - Backend + Subscription Gating

Goal: Add auth + subscription while keeping the product simple.

Tasks:
- Supabase Auth (Apple + email/OTP)
- Supabase tables: profiles, sessions, streaks, subscription_status
- StoreKit / RevenueCat integration to validate subscriptions
- Sync subscription status to Supabase

Verification:
- Auth works end-to-end
- Subscription status gates premium features cleanly

---

## Phase 6 - Polish + Performance

Tasks:
- Visual optimization for 60fps
- Audio latency + background mode hardening
- Notifications: daily prompt
- Quality pass on messaging

---

## Current Priorities
1. Implement Home + Session UI flow
2. Lock 5 audio families for Reset mode
3. Add Feel Pad control
4. Add Supabase auth + subscription status
