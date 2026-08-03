# Kolormix — Art Assets

> **Status:** MVP uses procedural graphics · **Target:** 64×64 sprite sheets + audio

## Art Direction

- **Style:** 8-bit retro pixel art with neon glow
- **Era:** Late-80s arcade / synthwave
- **MVP approach:** Phaser rectangles + text shapes (no binary assets required to run)
- **Production approach:** Replace procedural tiles with sprite atlas (see below)

---

## Color Palette

### Primary Tiles

| Name | Base | Neon Glow | Shape |
|------|------|-----------|-------|
| Red | `#CC1144` | `#FF2D55` | ● |
| Blue | `#0055BB` | `#007AFF` | ■ |
| Yellow | `#CCAA00` | `#FFCC00` | ▲ |

### Secondary Tiles

| Name | Base | Neon Glow |
|------|------|-----------|
| Purple | `#7722AA` | `#BF5AF2` |
| Orange | `#CC6600` | `#FF9500` |
| Green | `#228833` | `#30D158` |

### Tertiary

| Name | Base | Neon Glow |
|------|------|-----------|
| Brown | `#664422` | `#AC8E68` |

### Wildcard

White base (`#FFFFFF`) with magenta star (★) and prismatic shimmer (4-frame animation planned).

### UI & Background

| Element | Color |
|---------|-------|
| Background | `#0A0014` |
| Grid panel | `#1A0A2E` |
| UI text | `#FFFFFF` stroke `#FF00FF` |
| Timer normal | `#00FFFF` |
| Timer warning | `#FFCC00` |
| Timer critical | `#FF2D55` |
| Button fill | `#330066` stroke `#FF00FF` |

**Code reference:** `TILE_COLORS`, `HIGH_CONTRAST_COLORS`, `TILE_SHAPES` in `src/game/ColorMixer.ts`

---

## Sprites

### Tile Sprites (Production)

| Asset | Size | Format |
|-------|------|--------|
| `tile_red.png` | 64×64 | PNG |
| `tile_blue.png` | 64×64 | PNG |
| `tile_yellow.png` | 64×64 | PNG |
| `tile_purple.png` | 64×64 | PNG |
| `tile_orange.png` | 64×64 | PNG |
| `tile_green.png` | 64×64 | PNG |
| `tile_brown.png` | 64×64 | PNG |
| `tile_wildcard.png` | 64×64 | PNG (4-frame) |
| `tile_selected.png` | 64×64 | PNG overlay |

### Sprite Sheet

| Property | Value |
|----------|-------|
| Sheet size | 512×512 (8×8 grid) |
| Export | `tiles_sheet.png` + `tiles_sheet.json` |
| Loader | Phaser `this.load.atlas('tiles', ...)` |

### Close-Up Sprite States (Marketing)

| State | Size | Purpose |
|-------|------|---------|
| Idle | 128×128 | Store screenshots |
| Merge mid-animation | 128×128 | Tutorial |
| Selected | 128×128 | Feature highlight |
| Wildcard sparkle | 128×128 | Social media |

---

## Backgrounds

### Gameplay

- Full-screen `#0A0014` rectangle (MVP)
- Production: gradient mesh purple → black with animated neon grid overlay
- Optional CRT scanline shader (disabled in reduced motion)

### Menu

- Same dark fill (MVP)
- Production: parallax city silhouette + glow orbs

### Mode Cards

- 320×180 per mode with unique accent (Classic=cyan, Timed=magenta, Trial=gold)

---

## UI Assets

| Asset | Size | States |
|-------|------|--------|
| `logo_kolormix.png` | 512×128 | Animated glow |
| `btn_reset.png` | 160×48 | normal, pressed, disabled |
| `btn_play.png` | 240×80 | normal, pressed |
| `icon_menu.png` | 48×48 | — |
| `timer_bar_frame.png` | 32×600 | Left-edge container |
| `timer_bar_fill.png` | 24×596 | Tiling fill strip |

### Logo Variants (Exploration)

| Version | Style |
|---------|-------|
| A | Outlined pixel letters + inner glow |
| B | Script neon tube (synthwave) |
| C | Icon-only "K" for app icon |

Deliverables: 1024×1024 app icon + 512×128 wordmark per variant.

---

## Mascot — Dog Runner (Exploration)

| Animation | Frames | Size | Use |
|-----------|--------|------|-----|
| Walk | 6 | 64×64 | Loading screen |
| Jump | 4 | 64×64 | Attract mode |
| Sleep | 2 | 64×64 | Idle loop |

Not required for MVP. Disabled in reduced motion mode when implemented.

---

## Particle & VFX

| Effect | MVP | Production |
|--------|-----|------------|
| Merge pop | Tile repaint | 8 particles, result color, 200ms |
| Combo burst | Float text | 16 rainbow particles, 400ms |
| Wildcard sparkle | ★ text | 4-frame sprite loop |
| Shake scatter | Instant refill | Tiles fly outward 150ms |
| Timer pulse | Scale tween on bar | Edge glow shader |

---

## Sound Effects

| ID | Trigger | Format | Status |
|----|---------|--------|--------|
| `sfx_merge_pop` | Merge | OGG + MP3 | Planned |
| `sfx_combo` | 3+ combo | OGG + MP3 | Planned |
| `sfx_shake_whoosh` | Reset | OGG + MP3 | Planned |
| `sfx_wildcard_sparkle` | Wildcard merge | OGG + MP3 | Planned |
| `sfx_timer_warning` | ≤10s | OGG + MP3 loop | Planned |
| `sfx_bonus_time` | +15s | OGG + MP3 | Planned |
| `sfx_game_over` | Round end | OGG + MP3 | Planned |
| `sfx_ui_click` | Menu tap | OGG + MP3 | Planned |

### Music

| ID | Context | BPM | Status |
|----|---------|-----|--------|
| `music_menu` | Menus | ~90 | Planned |
| `music_gameplay` | In-round | ~120 | Planned |

Load via Phaser in `BootScene.preload()`:

```typescript
this.load.audio('merge_pop', 'assets/audio/sfx/sfx_merge_pop.ogg');
```

---

## Asset Delivery Checklist

- [x] Procedural tile rendering (MVP)
- [x] Color palettes in code (`ColorMixer.ts`)
- [x] Shape icons for accessibility
- [ ] Tile sprite sheet (64×64)
- [ ] Close-up marketing sprites (128×128)
- [ ] Backgrounds (gameplay + menu)
- [ ] UI button sprites
- [ ] Timer bar frame + fill PNGs
- [ ] Logo variants (A, B, C)
- [ ] Dog runner keyframes
- [ ] SFX pack (8 effects)
- [ ] Music loops (2 tracks)
- [ ] App icon 1024×1024

---

## File Organization

```
assets/
├── sprites/
│   ├── tiles_sheet.png
│   ├── tiles_sheet.json
│   ├── ui/
│   └── mascot/
├── backgrounds/
│   ├── gameplay_bg.png
│   └── menu_bg.png
├── audio/
│   ├── sfx/
│   └── music/
└── branding/
    ├── logo_vA.png
    ├── logo_vB.png
    └── logo_vC.png
```

---

## Related Documents

- [03_ui_ux_flow.md](./03_ui_ux_flow.md) — HUD layout
- [05_technical_setup.md](./05_technical_setup.md) — Asset loading in Phaser
- [09_current_chat_notes.md](./09_current_chat_notes.md) — Logged image requests
