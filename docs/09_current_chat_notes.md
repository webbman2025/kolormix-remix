# Kolormix — Current Chat Notes

> Living changelog · Part of the Kolormix doc lineage (01–10)

**Workspace:** `kolormix_remix`  
**Stack:** Phaser 3 + TypeScript + Vite  
**Last updated:** 2026-08-03

---

## Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Phaser 3 scaffold | ✓ Done | `src/main.ts` |
| 6×8 grid + color mixing | ✓ Done | `src/game/Grid.ts`, `ColorMixer.ts` |
| Wildcard spawn (5%, max 2) | ✓ Done | `src/game/Wildcard.ts` |
| Scoring + combos | ✓ Done | `src/game/Scoring.ts` |
| Timer + left vertical bar | ✓ Done | `src/game/Timer.ts`, `src/ui/TimerBar.ts` |
| Shake/reset (3 uses) | ✓ Done | `src/game/Shake.ts`, `src/ui/ShakeButton.ts` |
| 3 game modes | ✓ Done | `src/scenes/MenuScene.ts`, `GameScene.ts` |
| Tap + swipe input | ✓ Done | `src/scenes/GameScene.ts` |
| Accessibility (a11y) | ✓ Done | `src/accessibility/` |
| Leaderboard + PB | ✓ Done | `src/storage/Storage.ts` |
| Unit tests (13) | ✓ Passing | `tests/` |
| Sprite assets | ○ Planned | `assets/sprites/` |
| Audio SFX/music | ○ Planned | `assets/audio/` |
| iOS WebView wrapper | ○ Planned | Xcode project |
| StoreKit IAP | ○ Planned | `src/iap/` (future) |

---

## Confirmed Design Decisions

| Decision | Detail | Source |
|----------|--------|--------|
| Timer bar position | **Left side** of gameplay screen | PRD + implementation |
| Grid size | 6 × 8 (48 tiles) | PRD |
| Default timer | 120 seconds | `CONFIG.TIMER_DEFAULT_MS` |
| Shake limit | 3 per level | `CONFIG.SHAKE_MAX_USES` |
| Wildcard rate | 1 in 20 tiles | `CONFIG.WILDCARD_SPAWN_RATE` |
| Reset button label | "RESET ×{n}" bottom center | `10_controls.md` |
| Settings menu | Top-left ≡ button | `10_controls.md` |
| Framework | Phaser 3 + TypeScript + Vite | `05_technical_setup.md` |
| MVP graphics | Procedural rectangles + shapes | Build decision 2026-08-03 |

---

## Logged Image Requests

| Asset | Description | Status |
|-------|-------------|--------|
| Dog runner keyframes | Walk (6f), jump (4f), sleep (2f) at 64×64 | Exploration |
| Retro neon logos | 3 variants: pixel, script, icon "K" | Exploration |
| Close-up sprite states | 128×128 idle, merge, selected, wildcard | Exploration |

---

## HUD Layout (Final)

```
┌──────────────────────────────────────┐
│ [≡]                      SCORE: 240  │
│ ▓                                      │
│ ▓        6×8 GRID (centered)          │  ← ▓ = timer bar (LEFT)
│ ▓                                      │
│              [RESET ×2]                │
└──────────────────────────────────────┘
```

---

## Changelog

### 2026-08-03 — Full Project Build

- Scaffolded Phaser 3 + TypeScript + Vite project
- Implemented all core game modules (Grid, ColorMixer, Scoring, Timer, Shake, Wildcard)
- Built BootScene, MenuScene, GameScene with full gameplay loop
- Added accessibility layer (ContrastMode, AriaBridge, InputAlternatives)
- Added localStorage persistence (settings, a11y, leaderboard, PB)
- Created 13 Vitest unit tests (all passing)
- Production build succeeds (`dist/`)
- Updated all 10 PRD docs with implementation references

### 2026-08-03 — Controls Document Added

- Created `10_controls.md`
- Tap-only mode, reset button, top-left menu documented

### 2026-08-03 — Master Spec Generated

- Initial 9-document spec suite in `/docs/`

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Timer bar: drain top→bottom or bottom→top? | **Resolved:** top→bottom drain (implemented) |
| 2 | Wildcard ambiguity → highest tier? | **Resolved:** `resolveWildcardMerge()` uses tier priority |
| 3 | Dog runner: MVP or post-launch? | Leaning post-launch |
| 4 | 180s time soft cap | **Resolved:** implemented in `Timer.addBonus()` |

---

## Cross-References

| Topic | Document |
|-------|----------|
| Game rules | [02_gameplay_rules.md](./02_gameplay_rules.md) |
| Build & deploy | [05_technical_setup.md](./05_technical_setup.md) |
| Controls & input | [10_controls.md](./10_controls.md) |
| Cursor prompts | [08_prompt_engineering.md](./08_prompt_engineering.md) |
| QA | [07_testing_QA.md](./07_testing_QA.md) |

---

## How to Update This File

1. After each design or implementation change, append a changelog entry
2. Update the Implementation Status table
3. Move image requests through Exploration → In Progress → Done
4. Resolve open questions inline with date
