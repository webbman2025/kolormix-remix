# Kolormix — Prompt Engineering for Cursor

> **Status:** Validated against implemented codebase · Use `@docs/` references in Cursor

Reusable prompts for extending Kolormix. Each prompt references actual file paths in this repository.

---

## Core Implementation Prompts

### Grid & Color Mixing

```
Implement color-mixing grid logic for Kolormix.

Reference: docs/02_gameplay_rules.md, src/game/Grid.ts, src/game/ColorMixer.ts

Requirements:
- 6×8 grid (CONFIG.GRID_COLS × CONFIG.GRID_ROWS)
- Merge table: primaries → secondaries, secondaries + primaries → brown
- Wildcard: 5% spawn, max 2 on board, resolveWildcardMerge() picks highest tier
- Orthogonal adjacency only
- Tests in tests/ColorMixer.test.ts and tests/Grid.test.ts
```

### Sprite Sheet Integration

```
Replace procedural tile rendering in GameScene.paintTile() with a Phaser sprite atlas.

Reference: docs/04_art_assets.md, assets/sprites/

Requirements:
- Load tiles_sheet.png + tiles_sheet.json in BootScene.preload()
- 64×64 cells for all 8 tile types + selected overlay
- Keep HIGH_CONTRAST_COLORS and TILE_SHAPES as accessibility fallback overlays
- Wildcard: 4-frame sparkle animation
```

### Scoring System

```
Extend the scoring system with combo multipliers.

Reference: src/game/Scoring.ts, tests/Scoring.test.ts, CONFIG in src/config.ts

Current behavior:
- +10 per merge, +50 combo bonus at 3+ chain
- Time bonus: remaining_seconds × 2
- Combo resets after 2s idle or shake

Add: floating score text variants for different merge tiers.
```

### Vertical Timer Bar

```
Enhance the left-edge vertical timer bar.

Reference: src/ui/TimerBar.ts, src/game/Timer.ts, docs/03_ui_ux_flow.md

Current: cyan fill, yellow at ≤30s, red flash at ≤10s, pulse on bonus
Position: x=12, vertically centered, height = 55% of game height
Hidden in Classic mode (GameScene checks mode !== 'classic')

Add: gradient fill texture and audio warning at 10s.
```

### Shake / Reset Mechanic

```
Implement shake-to-reset with accessibility button.

Reference: src/game/Shake.ts, src/ui/ShakeButton.ts, src/accessibility/AriaBridge.ts

Current: 3 uses per level, RESET button bottom center, devicemotion bridge
Tap-only mode disables motion but keeps button.

Add: scatter animation before refill (respect reducedMotion).
```

### Accessibility Layer

```
Extend WCAG 2.1 AA accessibility for Kolormix.

Reference: docs/06_accessibility.md, src/accessibility/

Files:
- ContrastMode.ts: prefs in localStorage key kolormix_a11y
- AriaBridge.ts: #aria-live announcements
- InputAlternatives.ts: swipe direction helpers

Add: per-cell DOM grid overlay for VoiceOver grid navigation.
```

---

## Scene & UI Prompts

### Menu Flow

```
Extend MenuScene with full settings controls.

Reference: src/scenes/MenuScene.ts, docs/03_ui_ux_flow.md

Current: mode select, settings/a11y/leaderboard overlays
Add: volume sliders wired to loadSettings()/saveSettings() in src/storage/Storage.ts
```

### Gameplay HUD

```
Refine GameScene HUD layout.

Reference: src/scenes/GameScene.ts, docs/10_controls.md

Layout (implemented):
- Grid centered at gridOriginX/Y
- Score top-right (ScoreDisplay)
- Timer bar left edge (TimerBar)
- RESET button bottom center (ShakeButton)
- ≡ menu top-left (pause overlay)
```

---

## Technical Prompts

### Phaser 3 Project

```
The Kolormix project is scaffolded. Review and extend:

- src/main.ts: Phaser config 390×844, FIT scale
- src/config.ts: all gameplay constants
- npm run dev / build / test

Add: code-split Phaser to reduce bundle size below 500KB warning.
```

### iOS WebView Bridge

```
Create iOS WKWebView integration for the dist/ build.

Reference: docs/05_technical_setup.md

1. npm run build → copy dist/ to Xcode www/
2. Native shake → window.onDeviceShake() (see AriaBridge.setupShakeBridge)
3. StoreKit bridge for IAP product IDs in docs/05_technical_setup.md
4. Info.plist: NSMotionUsageDescription, portrait lock
```

### Vitest Tests

```
Add tests for Kolormix game logic.

Reference: tests/, docs/07_testing_QA.md

Existing: ColorMixer (5), Scoring (4), Grid+Shake (4) = 13 tests
Add: Timer tick/bonus, Wildcard spawn cap, Grid.isGameOver() with mocked board
```

---

## Expansion Prompts

### Mid-Autumn Festival Reskin

```
Create a Mid-Autumn Festival theme pack for Kolormix.

Reference: docs/04_art_assets.md, src/game/ColorMixer.ts (TILE_COLORS)

Theme: Chang'e mascot, Jade Rabbit wildcard, jade/gold/silver palette
Implementation: theme config JSON + runtime palette swap in paintTile()
No gameplay logic changes. WCAG shape overlays must remain.
```

### Seasonal Themes

```
Create a seasonal theme pack for Kolormix.

Input: {THEME_NAME} (Halloween, Winter, Lunar New Year)
Swap: TILE_COLORS, HIGH_CONTRAST_COLORS, background, menu logo
Keep: all gameplay rules, shape overlays, CONFIG constants
Store: theme preference in localStorage, load in BootScene
```

### Dog Runner Loading Screen

```
Add dog runner mascot to BootScene.

Reference: docs/04_art_assets.md (mascot section)

Animations: walk (6f), jump (4f), sleep (2f) at 64×64
Show during asset preload. Static sleep frame in reducedMotion mode.
Files: assets/sprites/mascot/
```

### Audio Integration

```
Add SFX and music to Kolormix.

Reference: docs/04_art_assets.md (sound table)

Load in BootScene.preload() from assets/audio/
Play in GameScene: merge pop, combo chime, shake whoosh, timer warning
Respect settings volume from Storage.ts loadSettings()
```

---

## Prompt Chaining Workflow

For a new feature, chain in this order:

1. Read relevant `docs/*.md` file
2. Check existing `src/` implementation
3. Extend game logic module
4. Wire into GameScene or MenuScene
5. Add Vitest tests
6. Update docs if behavior changes
7. `npm test && npm run build`

---

## Cursor Tips

- `@docs/02_gameplay_rules.md` — source of truth for game logic
- `@docs/10_controls.md` — input behavior (timer on LEFT, reset bottom center)
- `@src/config.ts` — never hardcode magic numbers
- `@tests/` — run after every game logic change
- Pin `docs/05_technical_setup.md` for folder structure

---

## Related Documents

- [01_concept.md](./01_concept.md) — Vision
- [05_technical_setup.md](./05_technical_setup.md) — Stack and APIs
- [09_current_chat_notes.md](./09_current_chat_notes.md) — Design changelog
