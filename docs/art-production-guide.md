# Flicker Art Production Guide

Complete specification for generating all visual assets with AI tools. Every asset must follow this guide to ensure visual cohesion.

---

## 1. Universal Style Rules

**These rules apply to EVERY asset. Break none of them.**

| Property | Value |
|----------|-------|
| Art style | Soft painterly / stylized digital art. NOT photorealistic, NOT flat vector, NOT pixel art. Think Ghibli-meets-cozy-game. |
| Perspective | Elevated 3/4 front view, ~30 degrees above horizontal. Camera looks slightly down at the scene. |
| Lighting direction | Warm interior glow from within. Primary light source is soft warm (amber/orange). Subtle rim lighting from above. No harsh shadows. |
| Color temperature | Warm overall. Dark backgrounds (#0A0A0B app bg). Assets should feel lit from within, glowing softly against darkness. |
| Edge treatment | Soft, slightly painterly edges. No hard pixel-perfect outlines. Objects should feel like they breathe. |
| Background | ALWAYS fully transparent (alpha channel). No background color in any asset. |
| Mood | Cozy, calming, inviting. Premium wellness aesthetic. Nothing cartoonish or hyperactive. |

**Style reference prompt prefix** (use at the start of every prompt):

> Soft painterly digital illustration, cozy warm interior lighting, dark moody atmosphere, stylized not photorealistic, gentle glow effects, transparent background, elevated 3/4 front perspective looking slightly down

---

## 2. Production Pipeline (Order of Operations)

You MUST follow this order. Each phase builds on the previous.

### Phase 1: Style Lock — Generate The Hearth island

Generate the Hearth island platform first. This becomes the **style reference** for everything else. Iterate until it feels right. DO NOT move to Phase 2 until you love this image.

### Phase 2: Remaining Islands

Generate the other 4 island platforms using The Hearth as a style reference. Each should feel like it belongs in the same world but has its own personality.

### Phase 3: Items Per Zone

Generate items zone-by-zone, using that zone's island as context. Items must look like they belong ON that specific island.

### Phase 4: Character Sprite Sheets

Generate Flicker character animations last. The character must feel like it lives inside these spaces.

---

## 3. Island Platforms (5 total)

### Technical Specs

| Property | Value |
|----------|-------|
| Canvas size | 1024 x 768 px |
| Format | PNG with transparency |
| Island position | Centered in canvas. Island structure occupies ~85% of width, ~65% of height. |
| Transparent padding | ~8% on each side, ~15% on top, ~20% on bottom (room for shadow/glow in code) |
| Perspective | Elevated 3/4 front view. We see the front face + top surface of the platform. |
| Platform underside | Visible at the bottom — floating rock/earth/cloud showing the island is suspended in space. NOT a flat cutoff. |

### Spatial Layout

The anchor coordinates from the zone JSON files map to specific regions of the island image:

```
y = 0.15-0.35  →  BACK WALL / far background of room (top ~25% of island)
y = 0.40-0.60  →  MID DEPTH / shelves, middle area (middle ~25% of island)
y = 0.65-0.85  →  FLOOR / ground level (lower ~25% of island)
y = 0.90-0.95  →  FOREGROUND / closest to camera (very bottom edge)
```

```
x = 0.05-0.20  →  LEFT SIDE
x = 0.30-0.70  →  CENTER
x = 0.80-0.95  →  RIGHT SIDE
```

The island art should have VISIBLE SPATIAL ZONES that naturally correspond to these anchor regions — a back wall area, mid-level surfaces (shelves, tables), and a floor area. Items will be composited at these positions.

### Island Prompt Templates

**Hearth (starter zone — cozy fireplace room)**

Anchor layout: back wall (3 spots), mid shelves (2), center table (1), floor (3), corners (2), foreground (1)

> Soft painterly digital illustration of a small cozy floating island room, elevated 3/4 front view looking slightly down, transparent background. A warm intimate hearth room with stone walls, wooden floor, a small fireplace glowing warmly at the back center. Visible back wall with space for hanging art on left, center, and right. Two wooden shelves at mid-height on left and right walls. A small round table in the center. Spacious wooden floor area. The island floats on a chunk of mossy rock, visible underneath. Warm amber glow from the fireplace illuminates everything softly. Dark atmospheric mood, cozy and inviting. No items or decorations placed — the room should feel EMPTY but ready to be decorated. Clean surfaces and open spaces at anchor points.

**Zen Garden (tranquil Japanese garden)**

Anchor layout: back garden (3), stone path (2), center sand area (1), ground stones (3), foreground (1)

> Soft painterly digital illustration of a floating zen garden island, elevated 3/4 front view looking slightly down, transparent background. A serene Japanese-inspired garden platform with raked sand/gravel in the center, natural stone borders. Back area has space for bamboo or plantings on left, center, and right. A winding stone path through the middle. Open flat areas at left, center, and right ground level for stone benches or features. The island floats on a natural rocky base with trailing moss. Soft moonlit cool-blue undertone mixed with warm lantern glow. Peaceful, meditative, minimal. Room should feel EMPTY and sparse — just the base landscape, no decorations placed.

**Study Nook (cozy reading corner)**

Anchor layout: upper shelves (2), mid shelves (2), wall art center (1), desk center (1), desk lamp area (1), desk side (1), chair (1), floor sides (2), foreground (1)

> Soft painterly digital illustration of a floating study nook island room, elevated 3/4 front view looking slightly down, transparent background. A cozy compact study with a wooden desk at center, built-in bookshelves lining both walls from top to mid-height (shelves should be EMPTY — no books placed). A window frame or arch at top center for wall art. Warm wooden floors. The desk surface is clear and empty. A comfortable reading corner feeling. The island floats on old stone and wood beams. Warm desk-lamp amber glow mixed with cool window light. Scholarly, intimate, quiet. No items placed — empty shelves, clear desk, bare walls.

**Greenhouse (lush glass garden)**

Anchor layout: hanging spots (3), trellis sides (2), center bench (1), planters floor (3), water feature (1), path (1), foreground (1)

> Soft painterly digital illustration of a floating greenhouse island, elevated 3/4 front view looking slightly down, transparent background. A small glass-paned greenhouse structure with an arched roof, visible iron/wood frame. Interior has hanging hooks at the ceiling on left, center, and right. Trellis structures along both side walls. A central area with space for a potting bench. Floor level has empty planter beds on left, center, right. The island sits on rich dark earth with trailing roots and vines underneath. Warm dappled sunlight filtering through glass, mixed with earthy green tones. Lush potential but currently EMPTY — no plants placed yet, bare earth in planters, empty hooks.

**Sky Terrace (celestial observation deck)**

Anchor layout: sky area (3), floating lantern spots (2), railing sides (2), center floor (1), balcony floor (3), foreground (1)

> Soft painterly digital illustration of a floating sky terrace island, elevated 3/4 front view looking slightly down, transparent background. An elegant open-air stone terrace/balcony floating high in the sky. Low ornate stone railing along the sides and front. Polished stone floor. Open sky visible above and behind (but sky should be very dark/minimal — just depth). The upper portion is open air with space for floating lights or celestial elements. The platform floats on a dramatic chunk of ancient carved stone. Cool starlight blue and deep purple tones with warm accent lighting. Ethereal, premium, expansive. The terrace is BARE — no furniture, no lights, no plants placed yet.

### Validation Checklist for Each Island

- [ ] Transparent background (NO colored background, NO gradient behind island)
- [ ] Island is centered with padding on all sides
- [ ] Floating underside visible at bottom (rock, earth, or stone)
- [ ] Perspective matches elevated 3/4 front view
- [ ] Anchor regions are visually distinct and EMPTY (surfaces where items will be placed)
- [ ] Warm interior lighting with dark overall mood
- [ ] Art style matches soft painterly aesthetic (not photorealistic, not cartoonish)
- [ ] Exported at 1024 x 768 px

---

## 4. Decoration Items (53 physical items)

### Technical Specs

| Property | Value |
|----------|-------|
| Canvas size | 256 x 256 px |
| Format | PNG with transparency |
| Object position | Centered in canvas, resting on bottom ~15% (as if sitting on a surface) |
| Object fill | Object should occupy ~60-80% of canvas width (varies by item — a candle is narrower, a rug is wider) |
| Perspective | SAME elevated 3/4 front view as the island. This is critical. |
| Lighting | SAME warm glow direction as the island it belongs to. |
| Scale reference | Think "dollhouse furniture" — stylized, slightly simplified, cozy proportions. |

### Anchor Position → Item Size Mapping

Items render at different visual sizes depending on WHERE they're placed:

| Anchor region | y range | Display size | Why |
|--------------|---------|-------------|-----|
| Back wall / far | 0.15 - 0.35 | Smaller (36-40px) | Further from camera = smaller |
| Mid depth / shelves | 0.40 - 0.60 | Medium (40-48px) | Middle distance |
| Floor / ground | 0.65 - 0.85 | Larger (48-56px) | Close to camera |
| Foreground | 0.90 - 0.95 | Largest (56-64px) | Closest to camera |

ALL items are 256x256 PNG regardless — the renderer handles scaling. But when generating art, consider that floor items will display larger and back-wall items smaller.

### Item Prompt Structure

Use this template for EVERY item:

> Soft painterly digital illustration, transparent background, elevated 3/4 front view, [ITEM DESCRIPTION], cozy warm [ZONE-SPECIFIC] lighting, stylized proportions, soft glowing edges. Single isolated object, no background, no surface — just the item floating on transparency.

Zone-specific lighting keywords:
- **Hearth**: warm amber fireplace glow
- **Zen Garden**: cool moonlit blue with warm lantern accents
- **Study Nook**: warm desk-lamp amber with cool window undertone
- **Greenhouse**: dappled warm sunlight with green undertones
- **Sky Terrace**: cool starlight blue-purple with warm accent glow

### Item Prompts by Zone

#### Hearth Items (14 physical items)

**Lighting:**
1. `hearth_candle_01` — A single warm candle in a small clay holder, soft flickering glow, cozy amber light
2. `hearth_lantern_01` — A delicate paper lantern, warm glow from within, Japanese-inspired design, hung from a small hook
3. `hearth_crystal_01` — A glowing crystal formation on a small wooden base, soft blue-white inner light, mystical
4. `hearth_rare_lamp_01` — An ornate celestial lamp with star/moon cutout patterns, casting patterned warm light, premium feel, gold and dark metal

**Plants:**
5. `hearth_succulent_01` — A small succulent plant in a terracotta pot, green with slight blush tips, simple and cute
6. `hearth_fern_01` — A trailing fern in a hanging woven basket, lush green cascading fronds
7. `hearth_bonsai_01` — A miniature bonsai tree in a ceramic pot, gnarled trunk, delicate leaves, zen feeling

**Furniture:**
8. `hearth_rug_01` — A round woven rug seen from above, warm earthy tones, boho textile pattern, flat perspective as if on floor
9. `hearth_cushion_01` — A soft floor cushion / meditation pillow, muted purple/blue fabric, inviting
10. `hearth_bookshelf_01` — A small wooden bookshelf with 2-3 shelves, some old books, warm wood tones

**Wall Art:**
11. `hearth_painting_01` — A framed landscape painting of mountains, small frame, impressionist style, muted cool tones
12. `hearth_tapestry_01` — A hanging woven tapestry with star/constellation pattern, deep blue with gold thread details

**Decor:**
13. `hearth_windchime_01` — A delicate hanging wind chime, small metal tubes/bells, catching warm light
14. `hearth_incense_01` — A ceramic incense holder with a thin trail of smoke, zen minimalist design

#### Zen Garden Items (11 physical items)

15. `zen_stone_lantern_01` — A traditional Japanese stone lantern (tōrō), weathered grey stone, warm glow from opening
16. `zen_paper_lamp_01` — A floating paper lamp, spherical, warm glow, slightly translucent paper texture
17. `zen_bamboo_01` — A cluster of bamboo stalks, tall and slender, bright green, elegant
18. `zen_cherry_01` — A small cherry blossom branch in bloom, delicate pink petals, some petals drifting
19. `zen_moss_01` — A mound of lush green moss on a flat stone, soft and verdant
20. `zen_bridge_01` — A small arched wooden bridge, red-brown wood, Japanese garden style, ornamental
21. `zen_bench_01` — A simple flat stone bench, natural grey stone, zen minimalism
22. `zen_fountain_01` — A bamboo water fountain (shishi-odoshi), bamboo tube pouring water into a stone basin
23. `zen_koi_pond_01` — A small circular koi pond, seen from above, 2-3 orange/white koi visible, lily pads
24. `zen_stones_01` — A stack of 4-5 smooth river stones balanced on top of each other (zen cairn), dark grey and warm brown
25. `zen_rare_torii_01` — A miniature vermillion torii gate, traditional Japanese design, small scale, premium feel

#### Study Nook Items (10 physical items)

26. `study_desk_lamp_01` — A classic adjustable desk lamp, warm brass/gold, warm circular glow, vintage feel
27. `study_fairy_lights_01` — A string of small warm fairy lights in a loose coil or draped, soft twinkling points
28. `study_pothos_01` — A trailing pothos plant in a small ceramic pot, long cascading green vines
29. `study_cactus_01` — A tiny desk cactus in a cute geometric pot, simple and minimal
30. `study_armchair_01` — A comfortable worn leather reading chair, warm brown, slightly overstuffed, inviting
31. `study_bookstack_01` — A stack of 3-4 old hardcover books, muted colors, slightly worn spines, scholarly
32. `study_globe_01` — A small desktop globe on a brass stand, warm tones, vintage explorer aesthetic
33. `study_poster_01` — A vintage-style poster in a thin frame, muted retro colors, slightly faded
34. `study_map_01` — A framed star map / constellation chart, deep blue with white/gold star patterns
35. `study_rare_typewriter` — A vintage manual typewriter, dark metal body, round keys, a small paper loaded, premium rare item

#### Greenhouse Items (9 physical items)

36. `green_fern_large_01` — A large lush fern plant in a wide terracotta pot, dramatic spreading fronds
37. `green_orchid_01` — An elegant orchid with arching stem, white/pink blooms, in a simple pot
38. `green_vine_01` — A climbing vine plant with tendrils, on a small wire support, lush green growth
39. `green_sunflower_01` — A cheerful sunflower in a rustic pot, tall stem, bright yellow petals
40. `green_pot_bench_01` — A wooden potting bench with empty surface, earthy wood, gardener's workstation
41. `green_trellis_01` — A small wooden or wire trellis structure, ready for climbing plants, garden architecture
42. `green_watering_01` — A vintage copper watering can, warm patina, charming garden tool
43. `green_solar_lamp_01` — A garden solar lamp on a short stake, soft warm glow, glass and metal
44. `green_rare_tree_01` — An ancient miniature wisteria tree, dramatic cascading purple blooms, gnarled trunk, premium rare item

#### Sky Terrace Items (9 physical items)

45. `sky_telescope_01` — A brass telescope on a wooden tripod, pointed upward, vintage astronomer's tool
46. `sky_daybed_01` — An elegant outdoor daybed/chaise with flowing fabric and cushions, dreamy, comfortable
47. `sky_lantern_paper_01` — A floating sky lantern (kongming lantern), warm orange glow, slightly translucent
48. `sky_string_lights_01` — A strand of round outdoor string lights, warm white, draped loosely
49. `sky_moon_lamp_01` — A spherical moon-shaped lamp on a thin stand, soft white-blue glow, ethereal
50. `sky_ivy_01` — Trailing ivy growing from an elegant stone urn, cascading green
51. `sky_lavender_01` — A pot of blooming lavender, soft purple, elegant terracotta pot
52. `sky_wind_spinner_01` — A metal wind spinner/kinetic sculpture, geometric shapes catching light
53. `sky_birdbath_01` — A small ornate stone bird bath, shallow water, elegant carved pedestal

### Validation Checklist for Each Item

- [ ] Transparent background (NO colored background, NO shadow baked in)
- [ ] Object centered in 256x256 canvas
- [ ] Same elevated 3/4 perspective as the island it belongs to
- [ ] Lighting matches zone mood (hearth=amber, zen=moonlit, study=warm lamp, greenhouse=dappled sun, sky=starlight)
- [ ] Stylized proportions consistent with other items in the zone
- [ ] Soft painterly art style (not photorealistic, not cartoonish)
- [ ] Item "rests" on the bottom portion of the canvas (gravity-aware positioning)

---

## 5. Character Sprite Sheets (18 total)

### Technical Specs

| Property | Value |
|----------|-------|
| Sheet size | 1536 x 1536 px (6 columns x 6 rows) |
| Frame size | 256 x 256 px each |
| Frame count | 36 frames per sheet |
| Animation FPS | 12 |
| Loop | Yes (seamless loop) |
| Format | PNG with transparency |

### Character Design

Flicker is a small flame spirit — a living flame with personality. NOT a human, NOT an animal. A soft, glowing, warm flame shape with subtle face features (eyes, maybe a mouth).

| Mood | Visual Treatment |
|------|-----------------|
| Calm | Steady, warm golden-orange flame. Relaxed posture. Soft glow. Eyes peaceful/half-closed. |
| Neutral | Standard warm flame. Alert posture. Moderate glow. Eyes open and attentive. |
| Overwhelmed | Flickering, unstable flame. Agitated posture. Bright/erratic glow. Eyes wide, worried. |

### Animation Descriptions

For each sheet, the 36 frames form a seamless loop. The animation should be SUBTLE — gentle movement, not dramatic action. Think breathing, swaying, slight bouncing.

| Activity | Animation Description | Energy Level |
|----------|----------------------|-------------|
| idle | Gentle hovering in place, soft breathing rhythm (expand/contract), occasional tiny sway | Low |
| meditate | Very still, slight rhythmic pulse (like breathing), eyes closed, minimal movement | Very low |
| focus | Slightly leaning forward, concentrated, small periodic intensification of glow | Low-medium |
| move | Bouncing/bobbing up and down, energetic sway, playful | Medium-high |
| sad | Drooping downward, dim glow, slow sluggish sway, eyes downcast | Very low |
| celebrate | Bouncing high, spinning or twirling, bright glow pulses, joyful | High |

### Sprite Sheet Layout

Frames read left-to-right, top-to-bottom:

```
Frame 01  Frame 02  Frame 03  Frame 04  Frame 05  Frame 06
Frame 07  Frame 08  Frame 09  Frame 10  Frame 11  Frame 12
Frame 13  Frame 14  Frame 15  Frame 16  Frame 17  Frame 18
Frame 19  Frame 20  Frame 21  Frame 22  Frame 23  Frame 24
Frame 25  Frame 26  Frame 27  Frame 28  Frame 29  Frame 30
Frame 31  Frame 32  Frame 33  Frame 34  Frame 35  Frame 36
```

Frame 36 should transition smoothly back to Frame 01 for seamless looping.

### Generating Sprite Sheets with AI

Sprite sheets are the HARDEST asset to generate with AI. Recommended approach:

**Option A: Generate key frames, interpolate**
1. Generate 4-6 key poses for each animation (e.g., frame 1, 7, 13, 19, 25, 31)
2. Use frame interpolation tools to fill in the between frames
3. Compose into the 6x6 grid

**Option B: Generate a video, extract frames**
1. Use AI video generation (Runway, Pika, Kling) to create a short ~3 second loop of the animation
2. Extract 36 evenly-spaced frames
3. Remove backgrounds (transparent)
4. Compose into the 6x6 grid at 256x256 per frame

**Option C: Generate single pose, animate procedurally**
1. Generate one high-quality Flicker image per mood (3 total)
2. Use the existing code-driven bob/scale animations (already implemented)
3. Skip sprite sheets for v1 — the static images with code animation already look decent

I recommend **Option B for v1 launch, Option C as fallback** if sprite generation proves too hard.

### Prompt Template for Character

> Soft painterly digital illustration of a small cute flame spirit character, transparent background. A living flame with [MOOD DESCRIPTION]. Warm glowing edges, soft inner light, [ACTIVITY DESCRIPTION]. The flame has subtle face features — small gentle eyes, [EXPRESSION]. No arms or legs — the character IS the flame. Approximately 200x200px centered in frame with padding. Dark void behind.

**Mood modifiers:**
- Calm: "steady golden-orange flame, relaxed and peaceful, soft warm glow"
- Neutral: "warm orange flame, alert and attentive, moderate glow"
- Overwhelmed: "flickering unstable bluish-orange flame, agitated and worried, erratic bright glow"

**Activity modifiers:**
- idle: "gently hovering, slight breathing rhythm"
- meditate: "perfectly still, eyes closed, rhythmic soft pulse"
- focus: "leaning slightly forward, concentrated, glow intensifying"
- move: "bouncing energetically, playful upward motion"
- sad: "drooping downward, dim glow, eyes downcast"
- celebrate: "bouncing joyfully, bright pulsing glow, spinning"

---

## 6. Shop Thumbnails

Items also appear in the Shop grid at small sizes (~40x40px display). The same 256x256 item PNGs are used — they just scale down. When generating items, make sure they are recognizable and distinct even at small sizes. Avoid tiny intricate details that disappear when scaled.

---

## 7. File Naming and Delivery

### Directory Structure

```
assets/
  flicker_calm_transparent.png          (keep — used for thumbnails)
  flicker_neutral_transparent.png       (keep)
  flicker_overwhelmed_transparent.png   (keep)

  sprites/
    flicker_calm_idle.png               (1536x1536 sprite sheet)
    flicker_calm_idle.json              (metadata)
    flicker_calm_meditate.png
    flicker_calm_meditate.json
    ... (18 sheets + 18 jsons = 36 files)

  sanctuary/
    islands/
      hearth_island.png                 (1024x768 island platform)
      zen_garden_island.png
      study_nook_island.png
      greenhouse_island.png
      sky_terrace_island.png

    items/
      hearth_candle_01.png              (256x256 item)
      hearth_lantern_01.png
      ... (53 item PNGs)

    zones/                              (already exist — no changes)
      hearth.json
      zen_garden.json
      study_nook.json
      greenhouse.json
      sky_terrace.json

    catalog.json                        (already exists — no changes)
```

### Metadata JSON Template (for sprite sheets)

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

---

## 8. Priority Order for Generation

**Critical path (app is functional with just these):**
1. Hearth island platform (style lock)
2. 5-8 Hearth items (enough to demo the decoration flow)
3. Remaining 4 island platforms

**Important (full experience):**
4. All remaining items per zone
5. Character sprite sheets (or continue using static PNGs + code animation)

**Nice to have (polish):**
6. App icon refresh
7. Splash screen art
8. Onboarding illustrations

---

## 9. Quick Reference Card

| Asset Type | Size | Count | Total Files |
|-----------|------|-------|-------------|
| Island platforms | 1024x768 | 5 | 5 |
| Decoration items | 256x256 | 53 | 53 |
| Sprite sheets | 1536x1536 | 18 | 18 PNG + 18 JSON |
| Static character (keep) | existing | 3 | 0 (already done) |
| **Total new files** | | | **94** |
