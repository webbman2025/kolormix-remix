# Kolormix — Testing & QA

> **Status:** 13 unit tests passing · **Runner:** Vitest 1.6

## Test Strategy

| Layer | Tool | Location |
|-------|------|----------|
| Unit tests | Vitest | `tests/` |
| Integration | Vitest (Grid + Scoring) | `tests/Grid.test.ts` |
| E2E | Manual browser testing | `npm run dev` |
| Device | Xcode Simulator (planned) | iOS WebView build |
| Accessibility | VoiceOver + manual | Menu A11Y toggles |
| Performance | Chrome/Safari DevTools | 60 FPS target |

```bash
npm test           # run all tests once
npm run test:watch # watch mode
```

---

## Test Cases

### TC-001: Color Mixing Accuracy

**File:** `tests/ColorMixer.test.ts`

| ID | Input | Expected | Status |
|----|-------|----------|--------|
| TC-001a | Red + Blue | Purple | ✓ |
| TC-001b | Red + Yellow | Orange | ✓ |
| TC-001c | Blue + Yellow | Green | ✓ |
| TC-001d | Purple + Yellow | Brown | ✓ |
| TC-001e | Orange + Blue | Brown | ✓ |
| TC-001f | Green + Red | Brown | ✓ |
| TC-001g | Red + Red | null | ✓ |
| TC-001h | Wildcard + Wildcard | null | ✓ |
| TC-001i | Blue + Red (reversed) | Purple | ✓ |

### TC-002: Shake Reset

**File:** `tests/Grid.test.ts` (Shake section)

| ID | Scenario | Expected | Status |
|----|----------|----------|--------|
| TC-002a | 3 uses available | use() returns true ×3 | ✓ |
| TC-002b | 4th attempt | use() returns false | ✓ |
| TC-002c | Reset button (manual) | Grid clears + refills | Manual |
| TC-002d | During animation | Ignored (busy flag) | Manual |
| TC-002e | Combo reset on shake | comboCount → 0 | Manual |

### TC-003: Wildcard Behavior

| ID | Scenario | Expected | Status |
|----|----------|----------|--------|
| TC-003a | Wildcard + Red | Valid merge (secondary+) | ✓ |
| TC-003b | Wildcard + Wildcard | null | ✓ |
| TC-003c | Wildcard + Purple | Brown | ✓ |
| TC-003d | Max 2 on board | 3rd deferred | Manual |
| TC-003e | Sparkle visual | ★ rendered | Manual |

### TC-004: Timer

| ID | Scenario | Expected | Status |
|----|----------|----------|--------|
| TC-004a | Timed mode start | 120s, bar visible | Manual |
| TC-004b | Timer → 0 | Game over | Manual |
| TC-004c | Combo ≥3 | +15s, bar pulse | Manual |
| TC-004d | ≤30s | Yellow bar | Manual |
| TC-004e | ≤10s | Red flash + aria alert | Manual |
| TC-004f | Pause menu | Timer pauses | Manual |
| TC-004g | Classic mode | No bar | Manual |
| TC-004h | 45s remaining at end | +90 time bonus | Manual |

### TC-005: Scoring

**File:** `tests/Scoring.test.ts`

| ID | Scenario | Expected | Status |
|----|----------|----------|--------|
| TC-005a | Single merge | +10 | ✓ |
| TC-005b | 3-merge combo | +30 + 50 bonus = 80 | ✓ |
| TC-005c | Time bonus (45s) | +90 | ✓ |
| TC-005d | Combo reset | No bonus on next single merge | ✓ |

### TC-006: Grid State

**File:** `tests/Grid.test.ts`

| ID | Scenario | Expected | Status |
|----|----------|----------|--------|
| TC-006a | Dimensions | 6×8 | ✓ |
| TC-006b | Init fill | All cells occupied | ✓ |
| TC-006c | Adjacency | Orthogonal only | ✓ |
| TC-006d | Game over detection | Full + no merges | Manual |

### TC-007: UI Layout

| ID | Scenario | Expected | Status |
|----|----------|----------|--------|
| TC-007a | Timer bar | Left edge (x=12) | Manual |
| TC-007b | Score | Top-right | Manual |
| TC-007c | Reset button | Bottom center | Manual |
| TC-007d | Menu button | Top-left (≡) | Manual |

### TC-008: Accessibility

| ID | Scenario | Expected | Status |
|----|----------|----------|--------|
| TC-008a | High-contrast toggle | Palette swaps | Manual |
| TC-008b | Shape overlays | Icons on tiles | Manual |
| TC-008c | aria-live announcements | Merge/combo/timer spoken | Manual |
| TC-008d | Reduced motion | No timer flash | Manual |
| TC-008e | Tap-only mode | Swipe disabled | Manual |

---

## Performance Benchmarks

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Frame rate | 60 FPS | Safari Web Inspector → FPS meter |
| Memory | < 100 MB | Xcode Memory Gauge (iOS) |
| Cold start | < 2s to menu | BootScene timing |
| Build size | — | ~1.5 MB JS bundle |
| Test suite | < 1s | `npm test` (currently ~200ms) |

### Performance Test Procedure

1. Launch `npm run dev` in Chrome
2. Play Timed Challenge for full 120s with continuous merges
3. Verify no sustained FPS drops below 55
4. Check memory tab for leaks over 3 consecutive rounds
5. Background/foreground tab — verify no crash on resume

---

## Debugging Workflow

### Error Logging

Console errors prefixed with context. Future: Sentry integration.

### Replay Testing (Planned)

```typescript
interface ReplayLog {
  seed: number;
  moves: Array<{ from: Position; to: Position; timestamp: number }>;
  shakes: number[];
  mode: GameMode;
}
```

### Debug Shortcuts (Planned Dev Menu)

- Force wildcard spawn
- Set timer to 10s
- Unlimited resets
- FPS overlay

---

## QA Checklist

### Gameplay

- [x] Primary → secondary merges (unit tested)
- [x] Secondary → tertiary merges (unit tested)
- [x] Invalid merges rejected (unit tested)
- [x] Wildcard merges (unit tested)
- [ ] Wildcard spawn rate ~5% (manual statistical)
- [x] Shake use limit (unit tested)
- [x] Combo scoring (unit tested)
- [ ] Classic mode: no timer
- [ ] Timed mode: countdown + time bonus
- [ ] Time Trial: PB tracking

### UI

- [ ] Grid centered
- [ ] Score top-right, live updates
- [ ] Timer bar left edge (timed modes)
- [ ] Timer yellow at 30s, red at 10s
- [ ] Reset button with use counter
- [ ] Pause menu functional
- [ ] Game over with score breakdown

### Accessibility

- [ ] High-contrast mode
- [ ] Shape overlays
- [ ] Reset as shake alternative
- [ ] aria-live announcements
- [ ] Reduced motion
- [ ] Tap-only mode

### Build

- [x] `npm run build` succeeds
- [x] `npm test` — 13/13 pass
- [ ] `npm run preview` — playable in browser
- [ ] iOS WebView load (planned)

---

## Regression Triggers

Run full test suite when modifying:

- `src/game/ColorMixer.ts`
- `src/game/Grid.ts`
- `src/game/Scoring.ts`
- `src/game/Timer.ts`
- `src/game/Shake.ts`
- `src/ui/TimerBar.ts`
- `src/scenes/GameScene.ts`

---

## Related Documents

- [02_gameplay_rules.md](./02_gameplay_rules.md) — Expected behavior
- [05_technical_setup.md](./05_technical_setup.md) — Test tooling
- [06_accessibility.md](./06_accessibility.md) — WCAG criteria
