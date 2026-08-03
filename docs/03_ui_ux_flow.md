# Kolormix — UI/UX Flow

> **Status:** Implemented in `src/scenes/` · **Resolution:** 390×844 (portrait)

## Information Architecture

```
BootScene (splash)
  └── MenuScene
        ├── Classic → GameScene
        ├── Timed Challenge → GameScene
        ├── Time Trial → GameScene
        ├── Settings (overlay)
        ├── Accessibility (overlay)
        └── Leaderboard (overlay)

GameScene
  ├── Pause menu (≡ top-left)
  ├── Game over screen
  └── Replay / Menu
```

---

## Screen Flow

### 1. Boot Scene

- "Loading Kolormix..." text on dark background
- 600ms fade → MenuScene
- **File:** `src/scenes/BootScene.ts`

### 2. Start / Menu Scene

- Neon "KOLORMIX" title with magenta stroke
- Tagline: "Mix neon colors. Beat the clock."
- Three mode buttons: CLASSIC, TIMED CHALLENGE, TIME TRIAL
- Bottom nav: SETTINGS | A11Y | SCORES
- **File:** `src/scenes/MenuScene.ts`

### 3. Settings Overlay

| Setting | Control | Default | Status |
|---------|---------|---------|--------|
| Music volume | Slider | 70% | UI placeholder |
| SFX volume | Slider | 80% | UI placeholder |
| Shake sensitivity | Low/Med/High | Medium | UI placeholder |
| Haptic feedback | Toggle | On | UI placeholder |

Settings persisted via `loadSettings()` / `saveSettings()` in `Storage.ts`.

### 4. Accessibility Overlay

Toggleable from menu A11Y button:

| Option | Storage key | Default |
|--------|-------------|---------|
| High contrast | `highContrast` | Off |
| Shape overlays | `shapeOverlays` | Off |
| Tap-only mode | `tapOnlyMode` | Off |
| Reduced motion | `reducedMotion` | Off |
| Shake enabled | `shakeEnabled` | On |

**File:** `src/accessibility/ContrastMode.ts`

### 5. Leaderboard Overlay

- Top 5 local scores from `localStorage`
- Empty state: "No scores yet. Play your first round!"
- Saved on game over via `saveScore()`

### 6. Gameplay Screen

```
┌──────────────────────────────────────┐
│ [≡]                      SCORE: 240  │  ← menu top-left, score top-right
│ ▓                                      │
│ ▓                                      │
│ ▓        6×8 GRID (centered)          │  ← timer bar: LEFT edge
│ ▓                                      │
│ ▓                                      │
│ ▓                                      │
│              [RESET ×2]                │  ← bottom center
└──────────────────────────────────────┘
```

| Element | Position | Component | Visibility |
|---------|----------|-----------|------------|
| Grid | Center | `GameScene` tile containers | Always |
| Score | Top-right | `ScoreDisplay` | Always |
| Timer bar | Left edge (x=12) | `TimerBar` | Timed modes only |
| Reset button | Bottom center | `ShakeButton` | Always |
| Menu (≡) | Top-left | `GameScene.menuBtn` | Always |
| Personal best | Top center | Text label | Time Trial only |

**File:** `src/scenes/GameScene.ts`

### 7. Pause Overlay

Triggered by ≡ menu button during gameplay:

- RESUME
- SETTINGS (placeholder)
- ACCESSIBILITY (toggles high-contrast live)
- RESTART
- QUIT → MenuScene

Timer pauses while overlay is open.

### 8. Game Over Screen

- Reason text (e.g., "Time up!" or "Grid full!")
- Final score, merge count, time bonus
- NEW RECORD badge when PB beaten
- [ REPLAY ] and [ MENU ] actions
- Score saved to leaderboard + personal best

---

## Interaction Model

| Gesture | Action | Tap-only mode |
|---------|--------|---------------|
| Tap tile | Select | ✓ |
| Tap neighbor | Merge | ✓ |
| Swipe toward neighbor | Merge | ✗ (disabled) |
| Shake device | Reset grid | ✗ (button only) |
| Tap RESET button | Reset grid | ✓ |

Swipe threshold: 24px (`CONFIG.SWIPE_THRESHOLD_PX`)

---

## Visual Feedback

### Merge

- Tile repaint at target cell
- "+10" floating text above merge point
- Screen reader: "Merged to {color}. Score {n}."

### Combo (3+ chain)

- "+50 COMBO!" floating text
- +15s bonus time (timed modes)
- Screen reader: "Combo! 3 merges. Bonus 50 points."

### Timer Bar

| State | Visual |
|-------|--------|
| Normal (>30s) | Cyan fill |
| Warning (≤30s) | Yellow fill |
| Critical (≤10s) | Red fill + alpha flash (unless reduced motion) |
| Bonus awarded | Scale pulse animation |

### Invalid Merge

- Target tile shakes horizontally (3 repeats, 50ms)
- No score change

### Shake / Reset

- Grid clears and refills
- Button counter decrements
- Combo resets

---

## Transitions & Motion

| Transition | Duration | Reduced motion |
|------------|----------|----------------|
| Boot → Menu | 400ms fade | Same |
| Merge animation | 200ms | 50ms |
| Shake refill | 350ms | 50ms |
| Score floater | 800ms fade up | Same |
| Timer flash | Sine alpha oscillation | Disabled (solid color only) |

Background parallax: planned for menu (not in MVP).

---

## Responsive Layout

| Breakpoint | Behavior |
|------------|----------|
| Phone portrait (default) | 390×844 canvas, FIT scale mode |
| Phone landscape | Canvas scales down proportionally |
| Tablet | Centered with margins via Phaser.Scale.FIT |

Safe area: menu and score offset from top edge (y=16–28).

---

## Error & Empty States

| State | UX |
|-------|-----|
| No valid merges (Classic full board) | Game over screen |
| Reset depleted | Button at 40% opacity, non-interactive |
| Leaderboard empty | Encouraging copy in overlay |
| Timer expired | "Time up!" game over |

---

## Related Documents

- [10_controls.md](./10_controls.md) — Full input reference
- [04_art_assets.md](./04_art_assets.md) — Visual asset specs
- [06_accessibility.md](./06_accessibility.md) — WCAG details
