# Flicker

Flicker is an iOS-first wellness and productivity companion app with three timer modes (`Reset`, `Focus`, `Move`), adaptive audio, app-blocking for deep focus, and reward-based sanctuary progression.

## Current Direction

The project is now aligned to the Flicker docs in `/docs`:

- `/Users/thomascadle/flicker-mobile/docs/flicker-product-doc.md`
- `/Users/thomascadle/flicker-mobile/docs/flicker-implementation-plan.md`
- `/Users/thomascadle/flicker-mobile/docs/flicker-technical-doc.md`

## Stack

- React Native + Expo Router + TypeScript
- Zustand for state
- Skia + Reanimated for 2D rendering/animation
- Supabase for auth/data sync
- Native iOS modules for audio and Screen Time integration
- RevenueCat for subscriptions/entitlement tracking with a custom React Native paywall

## Run

```bash
npm install
npm start
```

For native development builds:

```bash
npx expo run:ios
npx expo run:android
```

## Environment

Copy and fill `.env` from `.env.example`.

Required today:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`

## Notes

- `ios/` and `android/` are generated from Expo prebuild config.
- Native feature work (Screen Time extensions, entitlement work) will be done in iOS target(s) as implementation advances.
