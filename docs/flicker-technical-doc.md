# Flicker - Technical Document (Revised)

Canonical technical design for building Flicker on the existing React Native/Expo codebase.

---

## 1) Stack Decisions

| Layer | Technology | Decision |
|---|---|---|
| App framework | React Native + Expo | Keep existing app; no framework rewrite for v1 |
| Language | TypeScript | Keep |
| Navigation | Expo Router | Keep |
| State | Zustand | Keep and extend |
| 2D rendering | `@shopify/react-native-skia` | Primary renderer for character + sanctuary |
| Animation timing | Reanimated | Frame clock + transitions |
| Audio engine | Existing Swift AVAudioEngine module | Keep as core differentiator |
| Backend | Supabase | Keep for auth + sync + logs |
| Billing/paywall | **RevenueCat + custom RN paywall** | RevenueCat owns products, purchases, restores, and entitlements |
| iOS app blocking | FamilyControls + ManagedSettings + DeviceActivity | New, native module + extensions |
| Android app blocking | Defer to v1.1 | Not launch-critical for iOS-first strategy |
| Character animation source | AI video -> transparent frames -> spritesheet PNG | Standardized pipeline |

---

## 2) Architecture Overview

```text
Flicker App (RN/Expo)
│
├─ UI Layer (Expo Router screens)
│  ├─ Onboarding / Paywall
│  ├─ Home (mode select + character)
│  ├─ Session screens (reset/focus/move)
│  └─ Sanctuary / Shop
│
├─ Render Layer (Skia + Reanimated)
│  ├─ SpriteAnimator
│  ├─ FlickerCharacter
│  └─ SanctuaryRenderer
│
├─ Domain Stores (Zustand)
│  ├─ sessionStore
│  ├─ moodStore
│  ├─ streakStore
│  ├─ currencyStore
│  ├─ sanctuaryStore
│  └─ onboardingStore
│
├─ Services
│  ├─ AudioService (existing native bridge)
│  ├─ AppBlockingService (new iOS bridge)
│  ├─ BillingService (RevenueCat)
│  └─ Supabase APIs
│
└─ Native iOS Components (Deep Focus)
   ├─ Main app target (Expo module)
   ├─ DeviceActivityMonitor extension
   ├─ Shield configuration extension
   └─ App Group shared storage
```

---

## 3) Rendering Strategy (How We Match Focus Friend Feel)

This is the most important implementation choice. We use **one cohesive 2D pipeline**.

### 3.1 Why this strategy

- Focus Friend’s emotional effect comes from timing, restraint, and consistency, not complex graphics.
- Skia sprites are enough to replicate that feel if animation states and transitions are disciplined.
- Mixing renderers in the same scene (Skia + Three.js) creates complexity and visual mismatch.

### 3.2 Hard rendering rule

For character and sanctuary scenes, render in Skia only:

1. Background layer
2. Back decorations
3. Character layer
4. Front decorations/foreground accents
5. Optional UI overlay

### 3.3 Character animation spec

Each animation clip has a metadata file:

```json
{
  "columns": 6,
  "rows": 6,
  "frameCount": 36,
  "fps": 12,
  "frameWidth": 256,
  "frameHeight": 256,
  "anchor": { "x": 0.5, "y": 0.9 },
  "loop": true
}
```

Directory layout:

```text
assets/sprites/
  calm/
    idle.png
    idle.json
    meditate.png
    meditate.json
    focus.png
    focus.json
    move.png
    move.json
    sad.png
    sad.json
    celebrate.png
    celebrate.json
  neutral/
  overwhelmed/
```

### 3.4 Animation state machine

Inputs:
- `mood`: `calm | neutral | overwhelmed`
- `mode`: `reset | focus | move`
- `sessionState`: `idle | active | paused | interrupted | completed | abandoned`

Mapping rules:
- `idle` -> `idle`
- `active + reset` -> `meditate`
- `active + focus` -> `focus`
- `active + move` -> `move`
- `interrupted/abandoned` -> `sad`
- `completed` -> `celebrate`

### 3.5 “Alive” polish constraints

- Keep FPS modest (10-16). Too smooth looks synthetic.
- Add micro-idle variability (blink/sway offsets) on long loops.
- Prefer small emotional transition clips over abrupt swaps.
- Keep UI motion secondary; character timing should lead emotional tone.

---

## 4) Session Engine + Completion Semantics

### 4.1 Session model

```ts
type Mode = 'reset' | 'focus' | 'move';
type SessionState = 'idle' | 'active' | 'paused' | 'interrupted' | 'completed' | 'abandoned';

interface Session {
  id: string;
  mode: Mode;
  targetSeconds: number;
  elapsedSeconds: number;
  timerDirection: 'countdown' | 'countup';
  state: SessionState;
  startedAt?: number;
  endedAt?: number;
}
```

### 4.2 Completion rules (strict)

- Rewards are minted **only** when session state transitions to `completed`.
- `abandoned` sessions always mint `0`.
- No partial reward branch in app logic.

Mode-specific completion:
- Reset/Focus (countdown): `elapsedSeconds >= targetSeconds`.
- Move countdown: same rule.
- Move count-up: user still selects a target; `completed` only if elapsed meets/exceeds target.

---

## 5) Reward Economy

### 5.1 Reward formula

Base reward (only on completed sessions):

- Reset: `3 * completedMinutes`
- Focus: `2 * completedMinutes`
- Move: `1 * completedMinutes`

Optional multipliers:
- Streak bonus
- Balance bonus

Multipliers are applied only when status is `completed`.

### 5.2 Transaction model

```ts
interface CurrencyTransaction {
  id: string; // idempotent UUID
  userId: string;
  sessionId?: string;
  amount: number;
  type: 'earn' | 'spend';
  source: 'session_complete' | 'streak_bonus' | 'balance_bonus' | 'shop_purchase';
  createdAt: number;
}
```

Rules:
- All earn events reference `sessionId`.
- One completed session may mint once.
- Reconciliation on app foreground compares local balance with server aggregate.

---

## 6) Sanctuary + Shop Technical Design

### 6.1 Data model

```ts
interface ZoneAnchor {
  id: string;
  x: number;      // normalized 0..1
  y: number;      // normalized 0..1
  z: number;      // render order
  categories: string[];
}

interface Zone {
  id: string;
  name: string;
  background: string;
  anchors: ZoneAnchor[];
  unlockRequirement: { type: 'light_total'; value: number };
}

interface Item {
  id: string;
  zoneId: string;
  category: string;
  image: string;
  price: number;
}

interface Placement {
  id: string;
  userId: string;
  zoneId: string;
  anchorId: string;
  itemId: string;
  placedAt: number;
}
```

### 6.2 Rendering

`SanctuaryRenderer` runs one Skia canvas pass:

1. Draw zone background.
2. Draw placed items sorted by anchor `z`.
3. Draw character at configured anchor.
4. Draw foreground accents.

Placement animation:
- opacity: `0 -> 1`
- scale: `0.85 -> 1.05 -> 1.0`
- optional sparkle asset burst

---

## 7) iOS Deep Focus Architecture (Critical)

This subsystem is the primary technical risk and must be implemented as a multi-target iOS solution.

### 7.1 Required iOS capabilities

- `com.apple.developer.family-controls` entitlement
- App Group shared container
- Screen Time authorization flow

### 7.2 Native targets

1. **Main app target**
   - Expo native module interface.
2. **DeviceActivityMonitor extension**
   - Handles monitor interval lifecycle.
   - Re-applies/clears blocks independent of app process.
3. **Shield configuration extension**
   - Defines shield UI behavior/messages.

### 7.3 JS-facing API contract

```ts
interface AppBlockingAPI {
  requestAuthorization(): Promise<'approved' | 'denied' | 'notDetermined'>;
  presentAppPicker(): Promise<void>;
  saveSelection(selectionId: string): Promise<void>;
  startSessionBlocking(input: {
    sessionId: string;
    mode: 'full' | 'light';
    endsAtEpochMs: number;
  }): Promise<void>;
  stopSessionBlocking(sessionId: string): Promise<void>;
  getAuthorizationStatus(): Promise<string>;
}
```

### 7.4 Blocking behavior model

- **Full mode**: block everything except emergency/system-required categories.
- **Light mode**: allow movement-support apps (music/maps/health) via token selection rules.
- Active session metadata stored in App Group.
- DeviceActivity interval start should enforce shielding if app is dead.
- Interval end must clear shielding safely.

### 7.5 Failure handling

- Permission revoked mid-session -> session marked interrupted; stop reward path.
- App kill/relaunch -> session restored from persistent state.
- Overlapping session start -> reject with explicit error.
- Time changes/manual clock edits -> recompute end timestamps and enforce policy.

---

## 8) RevenueCat Integration

### 8.1 Billing architecture

- RevenueCat controls products, purchases, restores, and entitlement state.
- The paywall UI lives in React Native and is fully app-owned.
- Entitlement state drives navigation gates.
- Product IDs configured in App Store Connect and mapped in RevenueCat.

### 8.2 Root gating behavior

```ts
if (!onboardingCompleted) return <OnboardingStack />;
if (!hasActiveEntitlement) return <PaywallStack />;
return <MainStack />;
```

### 8.3 Minimum billing requirements

- Purchase
- Restore
- Entitlement refresh on app foreground
- Graceful handling of expired/cancelled states

### 8.4 Remove legacy assumptions

- RevenueCat SDK is required for v1 billing.
- All docs, services, and analytics events should reference RevenueCat/custom paywall naming.

---

## 9) Supabase Schema (v1)

```sql
create table session_logs (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  mode text not null check (mode in ('reset','focus','move')),
  target_seconds integer not null,
  elapsed_seconds integer not null,
  status text not null check (status in ('completed','abandoned')),
  light_earned integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create table currency_transactions (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  session_id uuid,
  amount integer not null,
  type text not null check (type in ('earn','spend')),
  source text not null,
  created_at timestamptz not null default now()
);

create table sanctuary_unlocks (
  user_id uuid not null references auth.users(id),
  zone_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, zone_id)
);

create table sanctuary_placements (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  zone_id text not null,
  anchor_id text not null,
  item_id text not null,
  placed_at timestamptz not null default now()
);
```

Recommended policies:
- RLS enabled on all user tables.
- `user_id = auth.uid()` for read/write checks.
- `currency_transactions` direct client inserts for earn events should be blocked.
- Reward minting should happen through a single idempotent server function (for example, `complete_session` RPC).

---

## 10) Code Ownership Map

### Existing code to retain

- Swift audio engine and bridge
- Mood system
- Core auth and Supabase setup
- Design token structure
- Existing reset flow foundations

### Modules to add/replace

- `src/services/billing/*` -> RevenueCat-backed billing service
- `src/services/appBlocking/*` -> iOS blocking bridge
- `src/stores/currencyStore.ts`
- `src/stores/sanctuaryStore.ts`
- `src/stores/onboardingStore.ts` (extend/align to Flicker flow)
- `src/components/animation/SpriteAnimator.tsx`
- `src/components/character/FlickerCharacter.tsx`
- `src/components/sanctuary/SanctuaryRenderer.tsx`

---

## 11) Quality Gates

### Functional gates

- Completed sessions always mint reward.
- Abandoned sessions never mint reward.
- Shop spend updates balance and persists.
- App blocking activates/deactivates with session lifecycle.
- Entitlement gates app access correctly.

### Visual gates

- Character appears emotionally coherent across mood/mode transitions.
- Sanctuary stays at stable frame pacing on target devices.
- No visible background halos on transparent sprite assets.

### Reliability gates

- App restart during active session restores correct state.
- Duplicate transaction prevention works.
- Native module errors surface user-safe messages.

---

## 12) Open Decisions (Defaulted)

These are defaulted for execution unless you override:

1. **Move mode completion**: require target duration even in count-up UI mode.
2. **Streak recovery mechanic**: keep as optional post-v1 toggle.
3. **Android blocking**: defer until iOS flow is stable and validated.
