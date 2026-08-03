# Kolormix — Accessibility

> **Status:** Implemented · **Target:** WCAG 2.1 Level AA

## Compliance Target

WCAG 2.1 Level AA across menus and gameplay. All accessibility features are toggleable from MenuScene A11Y overlay or GameScene pause menu.

---

## High-Contrast Palette

Activated via `ContrastMode.update({ highContrast: true })`. Persisted in `localStorage` key `kolormix_a11y`.

| Element | Standard | High-Contrast |
|---------|----------|---------------|
| Red tile | `#FF2D55` | `#FF0000` + 3px white border |
| Blue tile | `#007AFF` | `#0000FF` + 3px white border |
| Yellow tile | `#FFCC00` | `#FFFF00` + 3px black border |
| UI text | Neon glow | `#FFFFFF` on `#000000` |
| Timer bar | Cyan gradient | Solid white fill on black track |

**Code:** `HIGH_CONTRAST_COLORS` in `ColorMixer.ts`, applied in `GameScene.paintTile()`

---

## Color-Blind Shape Overlays

Enabled via `shapeOverlays` or automatically with `highContrast`.

| Color | Shape | Unicode |
|-------|-------|---------|
| Red | Circle | ● |
| Blue | Square | ■ |
| Yellow | Triangle | ▲ |
| Purple | Circle + Square | ●■ |
| Orange | Circle + Triangle | ●▲ |
| Green | Square + Triangle | ■▲ |
| Brown | All three | ●■▲ |
| Wildcard | Star | ★ |

**Code:** `TILE_SHAPES` in `ColorMixer.ts`

---

## Input Alternatives

| Action | Primary | Alternative | Code |
|--------|---------|-------------|------|
| Select tile | Tap | Keyboard (web) | `GameScene.handleTapOnly()` |
| Merge | Swipe / tap-tap | Tap-only mode | `ContrastMode.isTapOnly()` |
| Reset board | Shake | RESET button (always visible) | `ShakeButton` |
| Pause | ≡ menu | — | `GameScene.togglePauseMenu()` |

### Shake Button Requirements (Met)

- Touch target: 160×48 px (exceeds 44×44 pt minimum)
- Visible label: "RESET ×{n}"
- Disabled at 0 uses with reduced opacity
- Works when shake motion is disabled

### Tap-Only Mode

When enabled (`tapOnlyMode: true`):

- Swipe gestures ignored
- Device motion ignored
- Merging via tap-select → tap-target only
- Reset button still functional

**Code:** `src/accessibility/ContrastMode.ts`, `src/accessibility/InputAlternatives.ts`

---

## Screen Reader Support

### ARIA Live Region

Hidden `#aria-live` div in `index.html` receives dynamic announcements.

**Code:** `src/accessibility/AriaBridge.ts`

| Event | Function | Priority |
|-------|----------|----------|
| Tile selected | `announce()` | polite |
| Merge | `announceMerge()` | polite |
| Combo | `announceCombo()` | assertive |
| Bonus time | `announceBonusTime()` | assertive |
| Timer warning | `announce()` | assertive |
| Game over | `announceGameOver()` | assertive |

### Tile Labels

Format: `"Row {r}, Column {c}, {color}"` via `Grid.getAriaLabel()`.

### Grid Semantics

```html
<div id="game-container" role="application" aria-label="Kolormix game">
<div id="aria-live" class="sr-only" aria-live="polite" aria-atomic="true">
```

Future: per-cell `role="gridcell"` DOM overlay for VoiceOver grid navigation.

---

## WCAG 2.1 AA Checklist

### Perceivable

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 1.1.1 Non-text Content | ✓ | Shape overlays on all tiles |
| 1.3.1 Info and Relationships | ✓ | aria-live, application role |
| 1.4.1 Use of Color | ✓ | Shapes + high-contrast mode |
| 1.4.3 Contrast (Minimum) | ✓ | High-contrast palette |
| 1.4.11 Non-text Contrast | ✓ | 3px borders in HC mode |
| 1.4.13 Content on Hover/Focus | ○ | Partial (web focus TBD) |

### Operable

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 2.1.1 Keyboard | ○ | Menu navigable; grid TBD for web |
| 2.3.1 Three Flashes | ✓ | Flash disabled in reduced motion |
| 2.5.1 Pointer Gestures | ✓ | Tap alternative for all swipes |
| 2.5.4 Motion Actuation | ✓ | Reset button; shake can be disabled |

### Understandable

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 3.1.1 Language of Page | ✓ | `<html lang="en">` |
| 3.3.2 Labels or Instructions | ✓ | Reset button shows use count |

### Robust

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 4.1.2 Name, Role, Value | ✓ | aria-live, application role |
| 4.1.3 Status Messages | ✓ | Score/combo/timer announcements |

Legend: ✓ implemented · ○ partial / planned

---

## Reduced Motion

Detects `prefers-reduced-motion` via settings toggle (system preference integration planned).

When enabled:

- Merge animation: 50ms (vs 200ms)
- Shake refill: 50ms (vs 350ms)
- Timer bar: no alpha flash (solid red only)
- Background parallax: disabled (when implemented)
- Dog runner animation: static frame (when implemented)

**Code:** `ContrastMode.isReducedMotion()` checked in `GameScene`

---

## Settings Persistence

```typescript
interface AccessibilityPrefs {
  highContrast: boolean;      // default: false
  shapeOverlays: boolean;     // default: false
  reducedMotion: boolean;     // default: false
  shakeEnabled: boolean;      // default: true
  tapOnlyMode: boolean;       // default: false
  screenReaderOptimized: boolean; // default: true
}
```

Storage key: `kolormix_a11y` in `localStorage`.

---

## Testing Requirements

| Test | Method |
|------|--------|
| VoiceOver walkthrough | Complete one round using announcements only |
| High-contrast toggle | Verify all tiles distinguishable |
| Tap-only mode | Verify swipe and shake disabled |
| Shape overlays | Identify all colors without color vision |
| Touch targets | All buttons ≥ 44×44 pt |

See [07_testing_QA.md](./07_testing_QA.md) TC-008.

---

## Related Documents

- [03_ui_ux_flow.md](./03_ui_ux_flow.md) — Accessibility overlay in menu
- [10_controls.md](./10_controls.md) — Tap-only mode details
- [05_technical_setup.md](./05_technical_setup.md) — AriaBridge source
