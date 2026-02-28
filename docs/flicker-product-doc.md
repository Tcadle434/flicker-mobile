# Flicker - Product Document

**App Store Name:** Flicker
**App Store Subtitle:** Wellness Timer & Focus Buddy
**Tagline:** Let the noise fade.

---

## Vision

Flicker is a gamified wellness companion app that helps people build healthy habits across three pillars: mindfulness, focus, and movement. Users set timed sessions to meditate, study, or exercise -- and during those sessions, their phone locks down. A small flame spirit named Flicker accompanies them, meditating alongside them, working alongside them, or stretching alongside them. Completing sessions earns currency to grow Flicker's sanctuary.

Where Focus Friend nails one thing (focus/study) with one emotion (guilt/cuteness), Flicker covers the full wellness spectrum with a more premium, atmospheric aesthetic. The audio engine is a genuine differentiator -- adaptive 5-layer soundscapes with binaural beats that evolve during sessions, not simple lo-fi loops.

---

## Target Audience

- **Primary:** Young professionals ages 22-35 who want to build better habits around screen time, meditation, exercise, and focus
- **Secondary:** Students 18-24 looking for a study timer with personality
- **Psychographic:** People who have tried Calm/Headspace but found them too serious, or Focus Friend but want something broader than just study focus

---

## The Character: Flicker

A small flame/wisp spirit creature with a flame-shaped head, simple dot eyes, and a gentle expression. Flicker is your wellness companion -- it does what you do, and it reflects how you're doing.

### Three Mood States

Flicker's appearance changes automatically based on how recently you've completed a session. This is the core emotional hook -- Flicker IS your wellness state, visualized.

| Mood | Appearance | Trigger | Emotion |
|------|-----------|---------|---------|
| **Calm** | Blue, smiling, bright glow | Less than 12 hours since last session | "You're taking care of yourself" |
| **Neutral** | White/purple, expressionless, steady glow | 12-24 hours since last session | "It's been a while..." |
| **Overwhelmed** | Red, anxious expression, flickering erratically | 24+ hours since last session | "Flicker needs you" |

This system is already scaffolded in the current codebase (`moodStore`) and the three character body assets already exist. The mood drives:
- Flicker's sprite animation set (calm/neutral/overwhelmed variants)
- Background atmospheric tinting
- Particle orb color and behavior
- Subtle emotional pressure to maintain sessions (without being punishing)

No character skins in v1. Flicker's appearance is purely mood-driven. Cosmetic spending goes entirely toward the sanctuary.

### Animation States (Per Mood)

Each mood has its own sprite sheet variants for each activity:

| Activity | Calm (Blue) | Neutral (White/Purple) | Overwhelmed (Red) |
|----------|-------------|----------------------|-------------------|
| **Idle** | Gentle breathing, happy sway | Still, subtle breathing | Anxious fidgeting, flickering |
| **Meditating** | Eyes closed, peaceful glow | Eyes closed, steady | Eyes closed, gradually calming |
| **Focused** | Reading contentedly | Reading, neutral posture | Reading, slowly settling |
| **Moving** | Energetic stretching | Moderate movement | Restless energy releasing |
| **Celebrating** | Bright joyful bounce | Warming up, hint of smile | Relief, tension releasing |
| **Sad** | Gentle disappointment | Flat affect | Distressed, dim |

The overwhelmed-to-calm transition during a session is powerful: the user watches Flicker physically calm down as they meditate. The character mirrors their own experience.

---

## Three Modes

### 1. Reset (Meditation / Sensory Reset)

The signature mode. Inherited from the existing session flow.

**Session Flow:**
- 3-phase experience: Fade (15s) -> Still (user duration) -> Return (25s)
- During Fade: Audio ramps down, "Entering your reset..." text appears
- During Still: Full adaptive soundscape plays, mixer accessible
- During Return: Audio swells then fades, "Welcome back." appears

**Audio:** Full 5-layer adaptive soundscape (ambient, nature, melody, rhythm, binaural). Binaural beats tuned to theta/delta range (4-8 Hz) for relaxation. Adaptive parameters shift based on time of day, weather, season.

**Flicker Behavior:** Meditating alongside you. Eyes closed, gentle glow pulses in rhythm with the soundscape.

**App Blocking:** Total lockdown. No apps accessible except emergency calls.

**Duration Options:** 3, 5, 10, 15, 20, 30 minutes

**Reward Rate:** 3x light per minute (highest -- meditation is hard)

**Post-Session:** Mood check-in (inherited from the existing implementation), completion celebration, currency awarded.

### 2. Focus (Study / Work Timer)

The Focus Friend competitor. Simpler session flow -- just a clean timer.

**Session Flow:**
- Single phase: timer counts down
- No fade in/out phases (you want to get straight to work)
- Option to add Pomodoro-style breaks (25 min focus / 5 min break cycles)

**Audio:** Subtle focus soundscape -- ambient + binaural only (alpha range, 8-14 Hz). Less melodic than Reset. Users can also choose silence. No Spotify in this mode (distraction).

**Flicker Behavior:** Working alongside you. Reading a tiny book, writing, or crafting. Facing slightly away (the Focus Friend insight -- you shouldn't be watching the character).

**App Blocking:** Full lockdown with configurable Allow List (calculator, notes, reference apps). Deep Focus mode uses Screen Time API / overlay.

**Duration Options:** 15, 25, 30, 45, 60, 90, 120 minutes

**Reward Rate:** 2x light per minute

**Post-Session:** Completion celebration, currency awarded. No mood check-in (keep it quick).

### 3. Move (Exercise / Walk / Yoga)

The unique mode nobody else has.

**Session Flow:**
- Single phase timer with user-selected target duration
- Display can be count-down or count-up (user choice)
- Count-up display still requires meeting selected target before reward eligibility
- User manually ends the session after target completion

**Audio:** Three options:
1. Energy soundscape (upbeat ambient, beta-range binaural 14-30 Hz)
2. Nature/walk soundscape (gentle ambient for outdoor walks)
3. Spotify Connect (user's own music -- the primary choice for gym)

**Flicker Behavior:** Active -- stretching, jogging in place, yoga poses. More dynamic animation than other modes.

**App Blocking:** Light lockdown. Allowed by default: music apps (Spotify, Apple Music), maps, workout/health apps, phone calls. Social media and entertainment apps blocked.

**Duration Options:** 15, 30, 45, 60, 90 minutes (displayed as count-down or count-up)

**Reward Rate:** 1x light per minute (easiest mode, but sessions tend to be longer so totals balance out)

**Post-Session:** Completion celebration, currency awarded. Optional activity tag (walk, run, gym, yoga, stretch).

---

## Gamification System

### Currency: Light

Completing sessions earns "light" -- the energy that keeps Flicker alive and grows its sanctuary.

**Earning Rates:**
- Reset: 3 light per minute
- Focus: 2 light per minute
- Move: 1 light per minute
- Bonus: 1.5x multiplier for completing a session in all 3 modes in one day ("Balance Bonus")
- Streak bonus: +10% per consecutive day (caps at 7-day streak = +70%)

**Example earnings:**
- 10 min meditation = 30 light (base) + streak bonus
- 25 min focus session = 50 light + streak bonus
- 60 min gym session = 60 light + streak bonus
- All three in one day = (30 + 50 + 60) * 1.5 = 210 light + streak

### Sanctuary

A growing garden/home for Flicker, built with earned light. This replaces Focus Friend's room decoration system with something more organic and atmospheric.

**Sanctuary Zones (unlock progressively):**

1. **The Hearth** (default) - A small warm space with Flicker at center. Starting point.
2. **Zen Garden** (unlocks at 500 total light) - Earned primarily through Reset sessions. Tranquil, stones, water features, bonsai.
3. **Study Nook** (unlocks at 500 total light) - Earned through Focus sessions. Bookshelves, desk, warm lamp, cozy reading corner.
4. **Greenhouse** (unlocks at 500 total light) - Earned through Move sessions. Lush plants, sunlight, vibrant growth.
5. **Sky Terrace** (unlocks at 2000 total light) - Premium zone. Constellations, aurora effects, floating lanterns.

**Decoration Items (purchased with light):**

Each zone has 30-50+ items across categories:
- Plants & flowers (10-50 light each)
- Furniture & structures (25-100 light each)
- Lighting (lanterns, candles, crystals) (15-75 light each)
- Wall art & decorations (10-40 light each)
- Ambient effects (fireflies, falling petals, mist) (50-150 light each)
- Rare/premium items (200+ light each)

Items are placed at fixed anchor points within each zone (no free drag -- keeps UX simple and ensures everything looks good).

### Streaks

**Daily streak:** Complete at least one session per day to maintain your streak.
**Weekly marks:** Visual 7-day grid showing which days you completed sessions.
**Streak rewards:** +10% light bonus per consecutive day (caps at 7 days = +70%).
**Streak recovery:** Post-v1 consideration (not included in v1 logic).

### Balance Score

A subtle wellness balance indicator:
- Tracks ratio of Reset / Focus / Move sessions over the past 7 days
- Displayed as a simple visual (three bars or a triangle diagram)
- Balanced usage lights up Flicker's character more vibrantly
- Not punishing -- just informational and visually reflected in Flicker's idle state

---

## Monetization: Hard Paywall with Free Trial

### No Free Tier

Flicker uses a hard paywall after onboarding. Users get a 7-day free trial, then must subscribe to continue using the app. This follows the methodology proven by apps like Brainrot, Calm, and other premium wellness apps.

### Pricing

- **Weekly:** $4.99/week (shown as comparison anchor)
- **Annual:** $39.99/year ($3.33/month -- the push)
- **Lifetime:** $79.99 (for deal-seekers)

The paywall screen emphasizes the annual plan. Weekly exists to make annual look like a steal. Lifetime exists for the subset of users who hate subscriptions.

### Onboarding Flow (Emotional + Conversion-Optimized)

The onboarding is long, detailed, and emotionally driven. It educates the user on the problem, makes them feel the cost of their current habits, personalizes the experience, and presents the paywall as the natural next step. The user should feel like they've already invested in Flicker before they see the price.

**Screen 1: Hook**
- "How much of your life is spent staring at a screen?"
- Animated counter: average person spends 7+ hours/day on their phone
- "That's 2,555 hours a year. What could you do with that time?"

**Screen 2: The Cost**
- "Screen time isn't just time lost. It's energy lost."
- Stats: increased anxiety, reduced focus span, disrupted sleep
- "Your attention is the most valuable thing you own."
- Subtle animation: Flicker character appears dimly in the background, overwhelmed state (red, anxious)

**Screen 3: Personalization - What matters to you?**
- Multi-select: "I want to meditate more" / "I want to focus better" / "I want to exercise more" / "I want less screen time" / "I want to feel calmer"
- This data is stored and used to customize the home screen mode ordering

**Screen 4: Personalization - How much time do you spend on your phone?**
- Slider or options: "2-4 hours" / "4-6 hours" / "6-8 hours" / "8+ hours"
- Response: "That's [X] hours you could reclaim this week."

**Screen 5: Personalization - What's your biggest distraction?**
- Options: "Social media" / "News" / "Games" / "YouTube/TikTok" / "Messaging apps"
- "We'll make sure [selection] can't distract you during sessions."

**Screen 6: Meet Flicker**
- Flicker appears in calm state (blue, smiling) for the first time at full size
- "This is Flicker. Your wellness companion."
- "Flicker meditates when you meditate. Focuses when you focus. Moves when you move."
- Flicker does a small wave animation

**Screen 7: How It Works**
- Quick visual walkthrough of the 3 modes (Reset, Focus, Move)
- "Set a timer. Lock your phone. Take care of yourself."
- "Earn light to grow Flicker's sanctuary."
- Brief sanctuary preview showing an empty hearth -> decorated hearth

**Screen 8: The Promise**
- "Build a calmer routine in one week."
- "Use Reset, Focus, and Move to reclaim your attention."
- "Watch Flicker shift from overwhelmed to calm as your consistency grows."
- Flicker transitions from overwhelmed (red) to calm (blue) in a smooth animation

**Screen 9: Paywall**
- "Start your free trial"
- 7-day free trial, then subscription
- Three pricing options (weekly/annual/lifetime) with annual highlighted
- "Cancel anytime during your free trial. No charge."
- Small print: subscription details, restore purchases link
- Flicker sits happily at the bottom of the screen

**Screen 10: Permissions**
- Notification permission (for session reminders, streak alerts)
- Screen Time permission (for app blocking) - explain why it matters
- "Flicker needs these to protect your focus"

### Why Hard Paywall Works Here

1. **The onboarding creates emotional investment** before the price appears
2. **Wellness apps have proven this model** -- Calm, Headspace, Brainrot all use hard paywalls
3. **The 7-day trial is genuinely generous** -- users can fully experience all 3 modes, build a streak, start decorating their sanctuary, and form an emotional bond with Flicker before being asked to pay
4. **The audio engine is a premium feature** -- adaptive soundscapes with binaural beats aren't available for free anywhere. This justifies the price.
5. **No "free but annoying" tier** means the entire experience is polished. No ads, no upsell banners, no feature gates cluttering the UI.

---

## Competitive Positioning

| Feature | Focus Friend | Forest | Brainrot | Flicker |
|---------|-------------|--------|----------|---------|
| Focus timer | Yes | Yes | Yes | Yes |
| Meditation | No | No | No | Yes (signature) |
| Exercise timer | No | No | No | Yes |
| Adaptive audio | Lo-fi loops | Ambient | No audio | 5-layer adaptive + binaural |
| App blocking | Yes | Limited | Yes | Yes |
| Character companion | Bean | Trees | No | Flame spirit (mood-reactive) |
| Gamification | Decorate room | Grow forest | Stats | Grow sanctuary |
| Spotify integration | No | No | No | Yes (Move mode) |
| Mood tracking | No | No | No | Yes (visual via character) |
| Monetization | Freemium | Freemium | Hard paywall | Hard paywall + trial |
| Target audience | Students | Students | Teens/young adults | Young professionals |
| Aesthetic | Cute, bright | Natural, minimal | Bold, dark | Premium, atmospheric |

---

## App Store Presence

**Name:** Flicker
**Subtitle:** Wellness Timer & Focus Buddy
**Category:** Health & Fitness (primary), Productivity (secondary)
**Price:** Free (with 7-day trial, then subscription)

**App Store Description (first 3 lines):**
> Meet Flicker, your wellness companion. A small flame spirit that meditates when you meditate, focuses when you focus, and moves when you move. Set a timer, lock your phone, and let the noise fade.

**Keywords:** wellness timer, focus timer, meditation timer, screen time, productivity, mindfulness, exercise timer, pomodoro, phone blocker, digital wellbeing

---

## Success Metrics

**North Star:** Trial-to-Paid Conversion Rate (target: >15%)

**Key Metrics:**
- Onboarding completion rate (target: >70%)
- Trial start rate (target: >60% of onboarding completers)
- Trial-to-paid conversion (target: >15%)
- Session completion rate (target: >75%)
- 7-day retention (target: >40%)
- 30-day retention (target: >25%)
- Mode diversity (% of users using 2+ modes per week, target: >30%)
- Average sessions per user per day (target: >1.5)

---

## Future Roadmap (Post-Launch)

1. **Character skins:** Cosmetic variants (Ember, Aurora, Frost, etc.) as IAP or earned rewards
2. **Social features:** Friend challenges, shared streaks, sanctuary visits
3. **Apple Watch / wearable:** Haptic session guidance, heart rate integration for adaptive audio
4. **Guided sessions:** Voice-guided meditations using the audio engine
5. **Sleep mode:** 4th mode for sleep tracking/wind-down
6. **Widgets:** iOS/Android home screen widgets showing streak and Flicker state
7. **Seasonal events:** Limited-time decoration themes, community challenges
