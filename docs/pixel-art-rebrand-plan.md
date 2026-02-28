# Flicker — Pixel Art Rebrand & Rendering Overhaul

## Context

The app currently has 3 clashing art styles (isometric painterly islands, watercolor UI, flat vector character). Instead of patching the mismatches, we're committing to a full pixel art rebrand. The vision: Flicker is a small glowing spirit who lives in a forest clearing with a tent. You enter the tent and it's a Stardew Valley-style interior you decorate with light currency. Flicker walks around like an NPC, talks to you via RPG dialogue boxes, and reacts to your wellness sessions.

**What stays:** All backend architecture (stores, Supabase, auth, session flow, sound engine, Superwall paywall, Expo Router navigation, app blocking). The core product loop (relax/focus/move sessions → earn light → decorate) is unchanged.

**What changes:** Every visual asset, the rendering approach, all UI components, and the spatial model (floating islands → forest overworld + tent interior rooms).

---

## Part 1: The New World

### Overworld — Forest Clearing
- Top-down pixel art forest (as in your concept images)
- Dense tree canopy forming a natural clearing
- Flicker's tent sits in the center
- Flicker walks around the clearing as a small glowing pixel sprite
- Ambient effects: rain, fireflies, falling leaves (mood-reactive — rain when overwhelmed, fireflies when calm, leaves when neutral)
- Tap the tent to enter → transition to interior
- UI overlay: minimal — light balance in corner, small session button, dialogue prompts

### Interior — Tent Rooms
- Stardew Valley-style top-down room interior
- First room is always unlocked (the main tent room — cozy, small, with a fireplace/lantern)
- Additional rooms unlocked with light currency (library, garden, workshop, observatory, etc.)
- Each room has a tile grid with specific placement slots for items
- Items purchased with light, placed on the grid
- Flicker follows you inside, walks around, comments on decorations

### Flicker — The Character
- Small pixel sprite with a body (not just a floating blob) — as in your concept image
- Glowing white/blue, cute face, little arms and legs
- Mood changes color: calm = soft blue glow, neutral = white, overwhelmed = warm orange/red
- Walk animation, idle animation, celebrate animation, sad animation, meditate animation
- RPG-style dialogue boxes for communication ("Ready to focus?", "Welcome back!", "You're doing great!")

---

## Part 2: Rendering Approach

### The Phaser question
You asked if Phaser works with React Native. Short answer: **not natively** — Phaser runs in a browser, so in RN it would need a WebView wrapper. This adds latency, complicates touch handling, and creates a bridge between RN state and the game world.

### Recommended: Skia + Sprite System (already in the project)
We already have `@shopify/react-native-skia` installed. Skia can:
- Render pixel art sprites and tilemaps at 60fps on the GPU
- Handle sprite sheet animation (we already do this for Flicker's current animations)
- Draw particles (rain, fireflies, leaves)
- Apply shaders for lighting effects (glow around Flicker, lamp light in rooms)
- Composit with standard RN views for UI overlays (dialogue boxes, menus)

**Architecture:**
```
┌─────────────────────────────────────┐
│  React Native (Expo Router)         │  ← Navigation, stores, services
│  ┌───────────────────────────────┐  │
│  │  Skia Canvas (full screen)    │  │  ← Pixel world rendering
│  │  - Tilemap renderer           │  │
│  │  - Sprite renderer            │  │
│  │  - Particle systems           │  │
│  │  - Lighting/shader effects    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  RN Overlay (pointerEvents)   │  │  ← Dialogue boxes, menus, HUD
│  │  - Pixel art styled components│  │
│  │  - Touch handlers             │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Alternative: Expo GL + custom renderer
If Skia proves limiting for tile-based games, we can use `expo-gl` with a lightweight 2D renderer. But Skia is the simpler starting point since it's already integrated.

---

## Part 3: Asset Pipeline

### Pixel grid standard (LOCKED)
- **Base tile size:** 16x16 pixels
- **Render scale:** 3x on screen (each 16px tile renders as 48px on device)
- **Character sprite:** 16x24 per frame (one tile wide, 1.5 tiles tall)
- **Color palette:** Limited to ~32 colors for cohesion (define a master palette from your concept art — the greens, browns, whites from the forest clearing)
- **Canvas size:** A phone screen at 3x is ~8 tiles wide × 18 tiles tall (390px / 48 = ~8)

### Asset sources
1. **itch.io packs** for tilesets, furniture, nature elements — search terms:
   - "cozy pixel art interior tileset"
   - "forest top-down tileset"
   - "pixel art furniture pack"
   - "pixel RPG UI kit"
2. **Custom generation** for Flicker (unique character), tent exterior, special items
3. **AI tools** (PixelLab, Aseprite + AI assist) for quick iteration

### What we need (in priority order)

**Batch 1 — Core (needed to see anything)**
| Asset | Type | Spec |
|-------|------|------|
| Forest clearing tileset | Tilemap | Trees, grass variants, paths, clearing edges |
| Tent exterior | Sprite | Isometric-ish pixel tent, matches your concept |
| Flicker sprite sheet | Spritesheet | Idle (4f), walk-down (4f), walk-up (4f), walk-side (4f) |
| Rain particles | Sprite/code | Small pixel rain drops |

**Batch 2 — Interior (needed for decoration loop)**
| Asset | Type | Spec |
|-------|------|------|
| Interior floor/wall tileset | Tilemap | Wooden floor, stone walls, doorways |
| Basic furniture set | Sprites | Bed, table, chair, lantern, rug, bookshelf |
| Fireplace | Animated sprite | 3-4 frame flicker animation |

**Batch 3 — UI (needed for interaction)**
| Asset | Type | Spec |
|-------|------|------|
| Dialogue box frame | 9-slice | RPG-style text box with border |
| Pixel font or font styling | Config | Pixel-perfect text rendering |
| Button sprites | Sprites | Small pixel art icons for session/shop/stats |
| Menu panel background | 9-slice | Wooden/parchment panel for shop, stats |

**Batch 4 — Polish**
| Asset | Type | Spec |
|-------|------|------|
| Flicker mood variants | Recolors + expressions | Calm (blue glow), neutral (white), overwhelmed (orange) |
| Flicker action animations | Spritesheets | Celebrate, meditate, sad, sleep |
| Ambient sprites | Animated | Fireflies, falling leaves, campfire sparks |
| Additional rooms | Tilemaps | Library, garden, workshop, observatory |
| Decoration items (50+) | Sprites | Plants, lighting, furniture, wall art per room theme |

---

## Part 4: Tile Grid & Placement System

The current anchor system (normalized 0-1 coordinates on a free-form island) gets replaced with a **tile grid** system that's much more natural for pixel art:

### How it works
- Each room is a grid (e.g., 12x10 tiles for a small room)
- Each tile has a type: `floor`, `wall`, `door`, `blocked`, `decoration_slot`
- Items snap to grid positions (no freeform placement)
- Items can span multiple tiles (a bed is 2x1, a bookshelf is 1x2, etc.)
- Collision: Flicker can walk on `floor` and `door` tiles, not through furniture

### Data model change
```
// Old: freeform anchors with normalized coords
{ id: "floor_left", x: 0.15, y: 0.75, categories: ["furniture"] }

// New: tile grid with explicit positions
{
  room: "main",
  grid: [
    "WWWWWWWWWWWW",
    "W..........W",
    "W..........W",
    "W....FF....W",
    "W..........W",
    "W..........W",
    "W..........W",
    "W..........W",
    "W....DD....W",
    "WWWWWWWWWWWW"
  ],
  slots: [
    { id: "fireplace", tileX: 5, tileY: 1, width: 2, height: 1, categories: ["lighting"] },
    { id: "left_wall", tileX: 1, tileY: 3, width: 1, height: 2, categories: ["wall_art"] },
    ...
  ]
}
```

This is dramatically easier to work with than freeform coordinates — everything snaps to the grid, items never float in empty space, and it's trivial to verify placement visually.

---

## Part 5: UI Component System

All UI becomes pixel art styled. No more glassmorphic overlays or system fonts.

### Dialogue system (Pokemon/RPG style)
- Pixel art bordered text box at bottom of screen
- Flicker's portrait (small pixel face) on the left
- Text appears letter-by-letter with a soft typing sound
- Tap to advance, choices appear as selectable options
- Used for: greetings, session prompts, rewards, tips, tutorials

### Menu panels
- Wooden/parchment pixel art frame (9-slice scaling)
- Interior uses the limited pixel palette
- Items displayed as pixel sprites on a grid
- Prices shown with a small light crystal icon

### HUD
- Minimal: light balance in top corner (pixel crystal icon + number)
- Session button: small pixel campfire/lantern icon
- All text in pixel font or pixel-styled system font

### Transitions
- Screen wipe/fade transitions between overworld and interior (classic RPG feel)
- No spring animations or iOS-native transitions — everything feels "game-like"

---

## Part 6: Design-First Workflow (updated)

### For every feature, I will:
1. **Describe the experience** — what does the player see, feel, hear?
2. **Reference the pixel grid** — what tiles/sprites are involved?
3. **List required assets** — with exact pixel dimensions, animation frame counts, palette constraints
4. **Ask you to provide/source assets** before writing rendering code
5. **Build the rendering** — using Skia sprite/tile system
6. **Overlay UI** — using pixel-styled RN components

### Asset request format (example):
> **Need:** Flicker walk-down spritesheet
> **Grid:** 16x24 per frame, 4 frames
> **Palette:** White body (#F0F0FF), blue glow (#7DD3FC calm / #FFA07A overwhelmed), dark eyes (#2D3436)
> **Reference:** Your concept image — the little white character next to the tent
> **Format:** Single PNG spritesheet, 64x24 (4 frames horizontal), no anti-aliasing (nearest-neighbor scaling)

---

## Part 7: Build Sequence

### Phase 1: Foundation (rendering engine + core assets)
- Build Skia tile renderer (draw a tilemap from JSON)
- Build Skia sprite renderer (draw animated sprite at grid position)
- Source/create forest tileset + tent exterior
- Create Flicker walk/idle spritesheet
- Render the forest clearing scene (static, no interaction yet)

### Phase 2: Overworld interaction
- Flicker walks around the clearing (tap-to-move or auto-wander)
- Tap tent → screen transition to interior
- Rain/weather particle system (mood-reactive)
- Basic HUD overlay (light balance, session button)

### Phase 3: Interior + decoration
- Build room tilemap renderer
- Source interior tileset + basic furniture
- Implement tile-grid placement system (replaces old anchor system)
- Shop panel (pixel art styled)
- Place/remove items on grid

### Phase 4: Dialogue + personality
- Build RPG dialogue box component
- Write Flicker dialogue lines (mood-reactive greetings, session prompts, rewards)
- Flicker reactions (celebrate on reward, sad when overwhelmed)

### Phase 5: Session flow integration
- Wire session start/complete to the pixel world
- Flicker animates during session (meditates during reset, focuses during focus, stretches during move)
- Reward moment: light particles flow in, Flicker celebrates, currency counter ticks up
- Timer UI in pixel art style

### Phase 6: Full UI overhaul
- Replace all remaining non-pixel UI (profile, onboarding, auth screens)
- Pixel art notification style
- Pixel art paywall screen
- Polish all transitions

---

## Part 8: What stays vs what changes

### Code that stays (unchanged)
- `src/stores/` — all Zustand stores (session, mood, streak, currency, sanctuary, subscription, onboarding)
- `src/services/` — Supabase, audio engine, app blocking, notifications, Spotify
- `src/controllers/SessionFlowController.ts`
- `app/_layout.tsx` — boot sequence
- `app/(auth)/` — auth flow (visual restyle only)
- `app/(session)/` — session screens (visual restyle only)

### Code that gets rewritten
- `src/components/home/SkyScene.tsx` → new pixel world renderer
- `src/components/home/SceneButton.tsx` → pixel art buttons
- `src/components/home/ArtisanPanel.tsx` → pixel art menu panel
- `src/components/home/ShopPanel.tsx` → pixel art shop
- `src/components/home/DecorateOverlay.tsx` → tile grid decoration mode
- `src/components/character/FlickerCharacter.tsx` → pixel sprite renderer
- `app/(main)/home.tsx` → new overworld + interior scene host
- `src/utils/imageRegistry.ts` → new asset registry for tilesets/spritesheets

### Data that changes
- `assets/sanctuary/zones/*.json` → room grid definitions (tile-based, not anchor-based)
- `assets/sanctuary/catalog.json` → items with tile dimensions instead of freeform categories
- All image assets replaced with pixel art equivalents

---

## Verification

This plan succeeds when:
1. Forest clearing renders with Flicker walking around the tent
2. Tap tent → smooth transition to interior room
3. Interior has tile grid, items snap to positions
4. Dialogue boxes appear with Flicker's messages
5. Session start/complete flows work in the new visual style
6. All UI feels cohesive — no system-default alerts, no non-pixel elements
7. Rain/weather effects respond to Flicker's mood
8. Decoration loop works: earn light → shop → buy item → place in room

---

## Current Codebase State (Pre-Rebrand)

### What exists that we build on:
- **Skia v2.2.12** installed — currently used for gradients, blur, basic shapes, one SKSL shader
- **SpriteAnimator** — frame-by-frame spritesheet playback (CPU-based setInterval, not GPU-optimized)
- **15 sprite sheets** in `/assets/sprites/` with metadata JSON — existing Flicker animations
- **Sanctuary system** — 5 zones, 71 items, anchor-based placement, all wired to Zustand stores
- **Asset registry** — `require()` map for islands, items, clouds, buttons
- **Full store layer** — session, mood, streak, currency, sanctuary, subscription, onboarding stores
- **Gesture handling** — react-native-gesture-handler + reanimated for pan/pinch

### Current limitations to address:
- Sanctuary items render as abstract Skia shapes (placeholder), not actual pixel art
- No tilemap rendering capability
- Sprite animator is CPU-bound (setInterval), needs Skia/Reanimated upgrade
- No pixel art scaling (nearest-neighbor filtering)
- No tile-grid collision or placement logic
