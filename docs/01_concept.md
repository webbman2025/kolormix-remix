# Kolormix — Concept Document

> **Status:** Implemented (Phaser 3 MVP) · **Version:** 1.0.0 · **Last updated:** 2026-08-03

## Overview

**Kolormix** is a retro neon puzzle game where players mix primary colors into secondary and tertiary shades on a grid. Players tap or swipe adjacent tiles to merge compatible colors, chain combos, and clear space before the board fills—or before time runs out.

The game blends the tactile satisfaction of color-mixing puzzles with the urgency of arcade timers and the nostalgic pull of 80s neon aesthetics.

**Implementation entry point:** `src/main.ts` → `BootScene` → `MenuScene` → `GameScene`

---

## Elevator Pitch

> Mix neon primaries on a glowing grid. Chain combos, dodge wildcards, and shake the board when you're stuck—before the clock runs out.

---

## Core Mechanics

### Color Mixing

Players combine adjacent tiles following real color theory:

| Input | Output |
|-------|--------|
| Red + Blue | Purple |
| Red + Yellow | Orange |
| Blue + Yellow | Green |
| Purple + Yellow | Brown |
| Orange + Blue | Brown |
| Green + Red | Brown |

**Code:** `src/game/ColorMixer.ts`

### Shake-to-Reset

When the grid becomes unmanageable, players shake the device or tap the **RESET** button to clear the entire board.

| Property | Value |
|----------|-------|
| Uses per level | 3 |
| Trade-off | Clears grid; breaks combo momentum |

**Code:** `src/game/Shake.ts`, `src/ui/ShakeButton.ts`

### Wildcard Tiles

Special tiles that merge with any color, enabling rescue plays.

| Property | Value |
|----------|-------|
| Spawn rate | 1 in 20 (~5%) |
| Max on board | 2 |
| Visual | Prismatic star (★) |

**Code:** `src/game/Wildcard.ts`, `resolveWildcardMerge()` in `ColorMixer.ts`

### Scoring System

| Event | Points |
|-------|--------|
| Merge | +10 |
| Combo (3+ chain) | +50 bonus |
| Time bonus (timed modes) | remaining seconds × 2 |

**Code:** `src/game/Scoring.ts`

### Vertical Time Bar

A vertical countdown bar on the **left edge** of the gameplay screen.

| Property | Value |
|----------|-------|
| Default length | 120 seconds |
| Combo bonus | +15 seconds at 3+ merges |
| Soft cap | 180 seconds total |
| Warning | Yellow glow at ≤30s |
| Critical | Red flash at ≤10s |

**Code:** `src/game/Timer.ts`, `src/ui/TimerBar.ts`

---

## Theme & Aesthetic

### Visual Identity

- **Era:** 1980s arcade / synthwave
- **Art style:** 8-bit retro with neon glow (MVP uses procedural Phaser graphics)
- **Palette:** Electric cyan, hot magenta, laser yellow, deep purple (`#0A0014` background)
- **UI:** Monospace pixel-style fonts, neon stroke outlines

### Audio Identity (Planned)

| Event | Sound |
|-------|-------|
| Merge | "pop" |
| Shake | "whoosh" |
| Wildcard | sparkle chime |
| Timer ≤10s | retro alarm pulse |

Asset paths: `assets/audio/sfx/` (see [04_art_assets.md](./04_art_assets.md))

### Mood

Energetic, playful, slightly chaotic—like a late-night arcade cabinet under blacklight.

---

## Game Modes

| Mode | Timer | End Condition | Implementation |
|------|-------|---------------|----------------|
| **Classic** | Off | Grid full, no merges | `GameScene` with `mode: 'classic'` |
| **Timed Challenge** | 120s left bar | Timer hits 0 | `mode: 'timed'` |
| **Time Trial** | 120s + PB display | Beat personal best | `mode: 'trial'` |

---

## Target Audience

### Primary

- **Casual mobile gamers** — 3–8 minute sessions, easy to learn
- **Puzzle enthusiasts** — strategic color chaining and board management

### Secondary

- **Retro arcade fans** — neon aesthetic, pixel art sensibility
- **Accessibility-conscious players** — high-contrast, tap-only, screen reader support

---

## Design Pillars

1. **Readable at a glance** — color + optional shape overlays
2. **Fair urgency** — timer pressure with combo bonus time rewards
3. **Tactile delight** — merge pop animations, combo floaters, shake scatter
4. **Inclusive by default** — shake has button alternative; tap-only mode available

---

## Success Metrics (Launch)

| Metric | Target |
|--------|--------|
| Session length | 3–8 minutes |
| Day-1 retention | 35%+ |
| Frame rate | 60 FPS |
| Memory | < 100 MB |
| Store rating | 4.5+ |

---

## Repository Map

```
kolormix_remix/
├── docs/           ← This PRD (01–10)
├── src/            ← Phaser 3 game source
├── assets/         ← Sprites, audio (future)
├── tests/          ← Vitest unit tests
└── dist/           ← Production HTML5 build
```

---

## Related Documents

| Doc | Topic |
|-----|-------|
| [02_gameplay_rules.md](./02_gameplay_rules.md) | Full rule set |
| [03_ui_ux_flow.md](./03_ui_ux_flow.md) | Screen flow |
| [05_technical_setup.md](./05_technical_setup.md) | Build & deploy |
| [10_controls.md](./10_controls.md) | Input reference |
