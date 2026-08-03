# Kolormix — Controls

> **Status:** Implemented in `src/scenes/GameScene.ts` · **Input reference for players and developers**

---

## Primary Input

### Tap — Select, Mix & Clear

| Step | Action | Result |
|------|--------|--------|
| 1 | Tap a tile | Tile selected (white border); valid neighbors show **green** |
| 2 | Tap a neighbor (adjacent or diagonal) | Mix if colors are compatible |
| 3 | After **3+ mixes** in a row | Result tile gets **magenta border** — double-tap to clear |
| — | Double-tap after only 1–2 mixes | Shake feedback, no clear |

- **2-color mix** (one merge): result stays — cannot double-tap clear
- **3+ mix chain**: double-tap the magenta tile to vanish it (+30 bonus)
- Invalid pairs: target tile shakes, no score change

**Code:** `GameScene.handleTap()`, `GameScene.tryDoubleTapClear()`

**Code:** `GameScene.handleTap()`

### Swipe — Move Tiles Across Grid

| Gesture | Action |
|---------|--------|
| Swipe on tile toward neighbor | Attempt merge in swipe direction |
| Auto-select | Unselected tile is implicitly selected on swipe start |

| Property | Value | Code |
|----------|-------|------|
| Threshold | 24 px | `CONFIG.SWIPE_THRESHOLD_PX` |
| Axis lock | Horizontal OR vertical per gesture | `handleTileTap()` pointer delta |
| Disabled in | Tap-only mode | `ContrastMode.isTapOnly()` |

**Code:** `GameScene.handleTileTap()`, `InputAlternatives.getSwipeDirection()`

### Input Priority

1. UI buttons (menu, reset, pause overlay)
2. Tile tap (select / merge)
3. Swipe (move / merge)
4. Device shake (reset)

When `busy` or `paused` flags are set, all grid input is blocked.

---

## Shake Mechanic

### Device Shake — Grid Reset

| Property | Value |
|----------|-------|
| Uses per level | 3 |
| Effect | Clear grid + refill all 48 cells |
| Combo impact | Resets combo chain |
| Detection | `devicemotion` event, magnitude > 15, 1s cooldown |

**Code:** `AriaBridge.setupShakeBridge()`, `GameScene.handleShake()`

### Accessibility Alternative — Reset Button

Dedicated **RESET** button at **bottom center** of screen.

| Property | Value |
|----------|-------|
| Label | `RESET ×{n}` |
| Size | 160×48 px |
| Position | `(width/2, height - 48)` |
| Disabled | 40% opacity, non-interactive at 0 uses |
| Always visible | Yes — not hidden behind menu |

Shake motion can be disabled in accessibility settings; button always works.

**Code:** `src/ui/ShakeButton.ts`

---

## Wildcard Use

### Tap Wildcard → Merge With Adjacent

| Step | Action | Result |
|------|--------|--------|
| 1 | Tap wildcard | Selected (★ highlight) |
| 2 | Tap adjacent tile | Merge with highest-tier valid result |
| Alt | Swipe wildcard toward neighbor | Same merge behavior |

### Rules

| Pair | Result |
|------|--------|
| Wildcard + any color | Valid (highest tier output) |
| Wildcard + Purple | Brown |
| Wildcard + Red | Purple or Orange (tier 1) |
| Wildcard + Wildcard | Invalid |

Spawn: 5% per new tile, max 2 on board simultaneously.

**Code:** `ColorMixer.resolveWildcardMerge()`, `Wildcard.shouldSpawnWildcard()`

---

## Accessibility Controls

### Screen Reader Labels

| Element | Announcement | Code |
|---------|-------------|------|
| Tile | "Row {r}, Column {c}, {color}" | `Grid.getAriaLabel()` |
| Selected | "... selected" | `AriaBridge.announce()` |
| Merge | "Merged to {color}. Score {n}." | `announceMerge()` |
| Combo | "Combo! 3 merges. Bonus 50 points." | `announceCombo()` |
| Bonus time | "Bonus time! 15 seconds added." | `announceBonusTime()` |
| Timer ≤30s | "30 seconds remaining." | `announce()` |
| Timer ≤10s | "Warning. 10 seconds remaining." | `announce()` assertive |
| Game over | "Game over. Final score {n}." | `announceGameOver()` |
| Reset | "Board reset." | `announce()` |

Live region: `#aria-live` in `index.html`

### High-Contrast Toggle

- Location: Menu → A11Y overlay, or Pause → ACCESSIBILITY
- Effect: WCAG-compliant colors, thicker borders
- Persists in `localStorage` (`kolormix_a11y`)

### Tap-Only Mode

| Setting | Effect |
|---------|--------|
| ON | Swipe disabled, shake motion ignored |
| Merging | Tap source → tap target only |
| Reset | Button only (bottom center) |

**Code:** `ContrastMode.isTapOnly()`, `ContrastMode.isShakeEnabled()`

### Other Accessibility Toggles

| Toggle | Key | Default |
|--------|-----|---------|
| Shape overlays | `shapeOverlays` | Off |
| Reduced motion | `reducedMotion` | Off |
| Shake enabled | `shakeEnabled` | On |
| Screen reader optimized | `screenReaderOptimized` | On |

---

## UI Placement

Fixed gameplay HUD (390×844 canvas, FIT scaled):

```
┌──────────────────────────────────────┐
│ [≡]                      SCORE: 240  │  ← menu top-left, score top-right
│ ▓                                      │
│ ▓                                      │
│ ▓        6×8 GRID (centered)          │  ← timer bar: LEFT edge (x=12)
│ ▓                                      │
│ ▓                                      │
│ ▓                                      │
│              [RESET ×2]                │  ← bottom center
└──────────────────────────────────────┘
```

| Element | Position | Component | Modes |
|---------|----------|-----------|-------|
| Grid | Center | Tile containers | All |
| Score | Top-right (width-16, 16) | `ScoreDisplay` | All |
| Timer bar | Left edge | `TimerBar` | Timed, Trial |
| Reset button | Bottom center | `ShakeButton` | All |
| Menu (≡) | Top-left (36, 28) | `menuBtn` | All |
| Personal best | Top center | Text | Trial only |

### Top-Left Menu (≡)

Opens pause overlay:

- RESUME
- SETTINGS (placeholder)
- ACCESSIBILITY (live high-contrast toggle)
- RESTART
- QUIT → main menu

Timer pauses while menu is open.

---

## Control Mode Matrix

| Mode | Tap | Swipe | Shake | Reset Button |
|------|-----|-------|-------|--------------|
| Default | ✓ | ✓ | ✓ | ✓ |
| Tap-only | ✓ | ✗ | ✗ | ✓ |
| Shake disabled | ✓ | ✓ | ✗ | ✓ |
| Reduced motion | ✓ | ✓ | ✓ | ✓ (no scatter anim) |

---

## Platform Notes

| Platform | Shake | Swipe | Screen Reader |
|----------|-------|-------|---------------|
| Browser (dev) | `devicemotion` if available | Touch / mouse | aria-live |
| iOS WebView | Native bridge → `onDeviceShake` | Touch | VoiceOver (planned DOM grid) |
| Android (future) | SensorManager bridge | Touch | TalkBack |

---

## Related Documents

- [02_gameplay_rules.md](./02_gameplay_rules.md) — Merge and shake rules
- [03_ui_ux_flow.md](./03_ui_ux_flow.md) — Screen flow and pause menu
- [06_accessibility.md](./06_accessibility.md) — WCAG compliance
- [05_technical_setup.md](./05_technical_setup.md) — Source file map
