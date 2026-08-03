# Kolormix — Technical Setup

> **Status:** Implemented · **Stack:** Phaser 3.80 + TypeScript + Vite 5

## Stack Overview

| Layer | Technology | Version |
|-------|------------|---------|
| Game engine | Phaser 3 | ^3.80.1 |
| Language | TypeScript | ^5.4 |
| Build tool | Vite | ^5.2 |
| Test runner | Vitest | ^1.6 |
| Mobile wrapper | WebView → Xcode (iOS) | Planned |
| IAP | StoreKit 2 (iOS) | Planned |

---

## Quick Start

```bash
cd kolormix_remix
npm install
npm run dev        # http://localhost:5173
npm run build      # output → dist/
npm test           # Vitest unit tests
```

---

## Folder Structure (Implemented)

```
kolormix_remix/
├── assets/
│   ├── sprites/
│   ├── audio/sfx/
│   ├── audio/music/
│   └── backgrounds/
├── docs/                          # PRD (01–10)
├── src/
│   ├── main.ts                    # Phaser game bootstrap
│   ├── config.ts                  # CONFIG constants
│   ├── types.ts                   # TileColor, Position, etc.
│   ├── scenes/
│   │   ├── BootScene.ts           # Splash → Menu
│   │   ├── MenuScene.ts           # Mode select, settings, a11y, leaderboard
│   │   └── GameScene.ts           # Core gameplay loop
│   ├── game/
│   │   ├── Grid.ts                # 6×8 board logic
│   │   ├── ColorMixer.ts          # Merge rules + palettes
│   │   ├── Wildcard.ts            # Spawn rate + cap
│   │   ├── Scoring.ts             # Points + combos
│   │   ├── Timer.ts               # Countdown + bonus time
│   │   └── Shake.ts               # Reset use counter
│   ├── ui/
│   │   ├── TimerBar.ts            # Left-edge vertical bar
│   │   ├── ScoreDisplay.ts        # Top-right score + floaters
│   │   └── ShakeButton.ts         # Bottom-center reset button
│   ├── accessibility/
│   │   ├── AriaBridge.ts          # aria-live announcements + shake bridge
│   │   ├── ContrastMode.ts        # High-contrast + tap-only prefs
│   │   └── InputAlternatives.ts   # Swipe direction helpers
│   └── storage/
│       └── Storage.ts             # Settings, leaderboard, PB
├── tests/
│   ├── ColorMixer.test.ts
│   ├── Scoring.test.ts
│   └── Grid.test.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## CONFIG Constants

All gameplay values live in `src/config.ts`:

```typescript
export const CONFIG = {
  GRID_COLS: 6,
  GRID_ROWS: 8,
  TILE_SIZE: 64,
  TILE_GAP: 4,
  TIMER_DEFAULT_MS: 120_000,
  TIMER_BONUS_MS: 15_000,
  TIMER_MAX_MS: 180_000,
  TIMER_WARNING_MS: 30_000,
  TIMER_CRITICAL_MS: 10_000,
  COMBO_THRESHOLD: 3,
  COMBO_IDLE_MS: 2_000,
  SHAKE_MAX_USES: 3,
  WILDCARD_SPAWN_RATE: 0.05,
  WILDCARD_MAX_ON_BOARD: 2,
  SCORE_MERGE: 10,
  SCORE_COMBO_BONUS: 50,
  SCORE_TIME_MULTIPLIER: 2,
  SWIPE_THRESHOLD_PX: 24,
  GAME_WIDTH: 390,
  GAME_HEIGHT: 844,
};
```

---

## Scene Architecture

| Scene | File | Responsibility |
|-------|------|----------------|
| BootScene | `src/scenes/BootScene.ts` | Loading splash, route to menu |
| MenuScene | `src/scenes/MenuScene.ts` | Mode select, settings overlays, a11y toggles, leaderboard |
| GameScene | `src/scenes/GameScene.ts` | Grid rendering, input, timer, shake, scoring, game over |

### GameScene Data Flow

```
Input (tap/swipe/shake)
  → Grid.attemptMerge() / Grid.clearAndRefill()
  → Scoring.recordMerge() / Timer.addBonus()
  → UI refresh (tile sprites, score, timer bar)
  → AriaBridge announcements
  → Game over check
```

---

## Core Module API

### ColorMixer

```typescript
canMerge(a: TileColor, b: TileColor): boolean
merge(a: TileColor, b: TileColor): TileColor | null
resolveWildcardMerge(partner: TileColor): TileColor | null
```

### Grid

```typescript
attemptMerge(from: Position, to: Position): TileColor | null
clearAndRefill(): void
hasValidMerge(): boolean
isGameOver(): boolean
```

### Timer

```typescript
start() | pause() | resume() | tick(now: number)
addBonus(ms?: number): void
getRemainingSeconds(): number
getProgress(): number  // 0–1 for bar fill
```

### Shake

```typescript
canShake(): boolean
use(): boolean  // returns false if depleted
```

---

## Build Workflow

### Development

```bash
npm run dev
```

Vite dev server with HMR. Game renders in `#game-container` at 390×844, scaled to fit viewport.

### Production (HTML5)

```bash
npm run build
npm run preview
```

Output: `dist/index.html` + bundled JS. Uses `base: './'` for relative paths (WebView-safe).

### iOS Integration (WebView → Xcode)

1. `npm run build`
2. Copy `dist/` into Xcode `www/` bundle
3. `WKWebView` loads `index.html`
4. Native shake bridge calls `window.onDeviceShake()` (see `AriaBridge.ts`)
5. `Info.plist`:
   - `UIInterfaceOrientation` → Portrait
   - `NSMotionUsageDescription` → "Shake to reset the game board"

---

## StoreKit Hooks (Planned)

| Product ID | Type | Description |
|------------|------|-------------|
| `com.kolormix.theme.neon` | Non-consumable | Alternate neon theme |
| `com.kolormix.theme.midautumn` | Non-consumable | Mid-Autumn reskin |
| `com.kolormix.shake.pack5` | Consumable | +5 shake resets |
| `com.kolormix.shake.unlimited` | Non-consumable | Unlimited shakes |

Bridge pattern: `window.webkit.messageHandlers.storekit.postMessage(...)`

---

## Persistence (localStorage)

| Key | Data | Module |
|-----|------|--------|
| `kolormix_settings` | Audio, shake sensitivity | `Storage.ts` |
| `kolormix_a11y` | Accessibility prefs | `ContrastMode.ts` |
| `kolormix_leaderboard` | Top 10 scores | `Storage.ts` |
| `kolormix_pb` | Personal bests per mode | `Storage.ts` |

---

## Performance Targets

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Frame rate | 60 FPS | Safari Web Inspector during gameplay |
| Memory | < 100 MB | Xcode Memory Gauge |
| Cold start | < 2s to menu | BootScene → MenuScene timing |
| Build size | — | ~1.5 MB JS (Phaser included) |

---

## CI/CD (Recommended)

```yaml
# .github/workflows/build.yml
name: Build & Test
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test
      - run: npm run build
```

---

## Related Documents

- [02_gameplay_rules.md](./02_gameplay_rules.md) — CONFIG value rationale
- [06_accessibility.md](./06_accessibility.md) — AriaBridge, ContrastMode
- [07_testing_QA.md](./07_testing_QA.md) — Test cases and benchmarks
- [10_controls.md](./10_controls.md) — Input handling in GameScene
