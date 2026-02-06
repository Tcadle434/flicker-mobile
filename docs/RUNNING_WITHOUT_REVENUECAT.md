# Running Sona Without RevenueCat Credentials

You can run the Sona app during development without configuring RevenueCat credentials. This guide explains how.

## Quick Start

1. **Create your `.env` file**:
   ```bash
   cp .env.example .env
   ```

2. **Add ONLY Supabase credentials** to `.env`:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   Leave the RevenueCat lines commented out or empty.

3. **Run the app**:
   ```bash
   npm start
   ```

## What Happens Without RevenueCat?

### ✅ Works Normally
- All authentication flows (sign in, sign up, sign out)
- Navigation and routing
- All UI components
- State management
- Error handling

### ⚠️ Gracefully Disabled
- Subscription purchases
- Restore purchases
- Premium feature checks (all users treated as free tier)

### Console Messages
You'll see warning messages like:
```
RevenueCat API key not configured - subscription features will be disabled
RevenueCat not initialized - treating as free user
```

These are **normal and non-critical**. The app continues to function.

## User Experience

Without RevenueCat configured:
- All users are treated as **free tier**
- `isPremium` will always be `false`
- `subscriptionStatus` will always be `'free'`
- Paywall features will still work (they just won't process real purchases)
- Feature gating will apply (free users get limited modes/mixer)

## When to Configure RevenueCat

You should add RevenueCat credentials when:
- Testing subscription flows end-to-end
- Testing purchase restoration
- Testing premium feature unlocking
- Preparing for production deployment
- Working on Phase 7 (Onboarding + Paywall)

## How to Configure RevenueCat Later

1. **Create a RevenueCat account**: https://www.revenuecat.com/
2. **Create a new app** in the RevenueCat dashboard
3. **Get API keys** for iOS and Android
4. **Add to `.env`**:
   ```bash
   EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=your-ios-key
   EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=your-android-key
   ```
5. **Restart the dev server**: `npm start`

## Testing Subscription Features Without RevenueCat

If you want to test subscription UI without RevenueCat:

1. **Mock the subscription store**:
   ```typescript
   // In your component
   const isPremium = true; // Force premium for testing
   ```

2. **Temporarily modify the store**:
   ```typescript
   // In src/stores/subscriptionStore.ts
   isPremium: true, // Change initial state
   ```

3. **Use the subscription store directly**:
   ```typescript
   useSubscriptionStore.setState({ isPremium: true });
   ```

Remember to revert these changes before committing!

## Support

If you encounter issues:
1. Check console warnings (they should be non-critical)
2. Verify Supabase credentials are correct
3. Clear app cache: `npm start --clear`
4. Check `src/services/subscription/revenueCat.ts` for initialization logic

---

**Bottom line**: RevenueCat is completely optional for Phase 1-6 development. You can build and test the entire audio engine, rendering system, and most features without it! 🎵
