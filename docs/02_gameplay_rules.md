# Kolormix — Gameplay Rules

> **Status:** Implemented in `src/game/` · **Authoritative source for game logic**

## Grid

| Property | Value | Code |
|----------|-------|------|
| Dimensions | 6 columns × 8 rows | `CONFIG.GRID_COLS`, `CONFIG.GRID_ROWS` |
| Total tiles | 48 | — |
| Tile size | 64×64 px | `CONFIG.TILE_SIZE` |
| Gap | 4 px | `CONFIG.TILE_GAP` |
| Spawn | New tiles fill empty cells after merge | `Grid.fillEmpty()` |

### Board Fill Condition

| Mode | End Condition | Code |
|------|-------------|------|
| Classic | Grid full + no valid merges | `Grid.isGameOver()` |
| Timed / Trial | Timer reaches 0 | `Timer.onExpire` callback |

---

## Color Mixing Rules

### Primary Colors

| Color | Hex | Shape (a11y) |
|-------|-----|--------------|
| Red | `#FF2D55` | ● |
| Blue | `#007AFF` | ■ |
| Yellow | `#FFCC00` | ▲ |

### Secondary Mixes (per Kolormix help screen)

| Input A | Input B | Output |
|---------|---------|--------|
| Blue | Red | **Purple** |
| Blue | Yellow | **Green** |
| Red | Yellow | **Orange** |
| Red | White | **Pink** |
| Blue | White | **Cyan** (light blue) |
| Black | White | **Grey** |

### Base Colors (spawn on grid)

Red, Blue, Yellow, White, Black (+ occasional Wildcard)

### Invalid Merges

- Same color + same color → no merge
- Secondary + anything not in table → no merge
- Wildcard + Wildcard → no merge

### Merge Interaction

1. Player taps a tile, then taps a **neighbor** (adjacent or diagonal — 8 directions).
2. If pair is valid, **both cells become the secondary** result color.
3. Score awarded; combo counter increments.

**Code:** `Grid.attemptMerge(from, to)`

---

## Wildcards

| Property | Value | Code |
|----------|-------|------|
| Spawn rate | 1 in 20 (5%) | `CONFIG.WILDCARD_SPAWN_RATE` |
| Max on board | 2 | `CONFIG.WILDCARD_MAX_ON_BOARD` |
| Merge rule | Merges with any color | `resolveWildcardMerge()` |
| Output | Highest-tier valid result | Tier: brown(2) > secondary(1) > primary(0) |

### Examples

| Input | Output | Reasoning |
|-------|--------|-----------|
| Wildcard + Red | Purple or Orange | Best secondary (tier 1); brown if partner is green |
| Wildcard + Purple | Brown | Wildcard acts as yellow |
| Wildcard + Wildcard | — | Invalid |

**Code:** `src/game/Wildcard.ts`, `ColorMixer.resolveWildcardMerge()`

---

## Shake Mechanic

| Property | Value | Code |
|----------|-------|------|
| Uses per level | 3 | `CONFIG.SHAKE_MAX_USES` |
| Effect | Clear grid + refill | `Grid.clearAndRefill()` |
| Combo impact | Resets combo chain | `Scoring.resetCombo()` |
| Inputs | Device shake OR reset button | `ShakeButton`, `AriaBridge.setupShakeBridge()` |

### Restrictions

- Cannot shake during merge animation (`busy` flag in GameScene)
- At 0 uses: button disabled, motion ignored
- Disabled in tap-only mode (button still works)

---

## Timer

### Layout

- **Vertical countdown bar** on the **left side** of the gameplay screen
- Drains top-to-bottom as time elapses
- Hidden in Classic mode

**Code:** `src/ui/TimerBar.ts` — positioned at x=12, vertically centered

### Settings

| Property | Value | Code |
|----------|-------|------|
| Default round | 120 seconds | `CONFIG.TIMER_DEFAULT_MS` |
| Bonus per combo | +15 seconds | `CONFIG.TIMER_BONUS_MS` |
| Soft cap | 180 seconds | `CONFIG.TIMER_MAX_MS` |
| Warning threshold | 30 seconds | `CONFIG.TIMER_WARNING_MS` |
| Critical threshold | 10 seconds | `CONFIG.TIMER_CRITICAL_MS` |

### Bonus Time

Awarded when combo reaches **3+ merges** in a chain. Bar pulses on award.

### Visual & Audio Cues

| Threshold | Feedback | Code |
|-----------|----------|------|
| ≤ 30s | Yellow bar | `TimerBar.setWarning()` |
| ≤ 10s | Red flash + aria alert | `TimerBar.setCritical()` |
| Bonus | Bar pulse | `TimerBar.pulse()` |

Timer pauses when pause menu is open.

---

## Game Modes

### Classic

- Timer: off (bar hidden)
- Objective: survive; maximize score
- End: `Grid.isGameOver()`

### Timed Challenge

- Timer: 120s with left vertical bar
- Objective: maximize score before time expires
- End: timer reaches 0

### Time Trial

- Same as Timed Challenge
- Displays personal best at top of screen
- Tracks PB in `localStorage` via `updatePersonalBest()`

---

## Scoring

| Event | Points | Code |
|-------|--------|------|
| Merge | +10 | `CONFIG.SCORE_MERGE` |
| Combo (≥3 chain) | +50 bonus | `CONFIG.SCORE_COMBO_BONUS` |
| Time bonus | remaining × 2 | `CONFIG.SCORE_TIME_MULTIPLIER` |

### Example (Timed Challenge)

- 12 merges → 120 pts
- 2 combos → 100 pts bonus
- 45s remaining → 90 pts time bonus
- **Total: 310**

### Combo Definition

Combo counter increments per merge in a chain. Resets when:

- Idle > 2 seconds (`CONFIG.COMBO_IDLE_MS`)
- Player uses shake/reset
- `Scoring.resetCombo()` called explicitly

---

## Tile Spawn Distribution

| Color | Weight |
|-------|--------|
| Red | 33% |
| Blue | 33% |
| Yellow | 33% |
| Wildcard | 5% (independent check, capped at 2 on board) |

**Code:** `Grid.spawnRandomTile()`

---

## Edge Cases

| Scenario | Resolution |
|----------|------------|
| Merge during pause | Timer paused; no input accepted |
| Last shake, grid fills | Classic → game over; Timed → timer continues |
| Bonus at 0:01 remaining | Award applies; can exceed 120s up to 180s cap |
| Color-blind mode | Shape icons rendered on tiles |
| Reduced motion | Animations shortened to 50ms |

---

## Related Documents

- [01_concept.md](./01_concept.md) — Vision
- [03_ui_ux_flow.md](./03_ui_ux_flow.md) — HUD layout
- [10_controls.md](./10_controls.md) — Input handling
- [07_testing_QA.md](./07_testing_QA.md) — Test cases
