# Kolormix

Retro neon color-mixing puzzle game built with Phaser 3, TypeScript, and Vite.

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 13 unit tests
npm run build    # production build → dist/
```

## Game Modes

- **Classic** — No timer; survive until the grid fills
- **Timed Challenge** — 120s countdown with left-edge timer bar
- **Time Trial** — Beat your personal best

## Controls

- **Tap** — Select tile, tap neighbor to merge
- **Swipe** — Swipe toward neighbor to merge
- **Shake / RESET button** — Clear grid (3 uses per round)

## Documentation

Full PRD in `docs/` (01–10):

| Doc | Topic |
|-----|-------|
| 01_concept | Vision and pillars |
| 02_gameplay_rules | Grid, mixing, scoring |
| 03_ui_ux_flow | Screen flow and HUD |
| 04_art_assets | Sprites and audio specs |
| 05_technical_setup | Build and architecture |
| 06_accessibility | WCAG 2.1 AA |
| 07_testing_QA | Test cases |
| 08_prompt_engineering | Cursor prompts |
| 09_current_chat_notes | Changelog |
| 10_controls | Input reference |

## Project Structure

```
src/
├── scenes/       Boot, Menu, Game
├── game/         Grid, ColorMixer, Scoring, Timer, Shake
├── ui/           TimerBar, ScoreDisplay, ShakeButton
├── accessibility/ ContrastMode, AriaBridge
└── storage/      Settings, leaderboard, PB
```

## License

Private — all rights reserved.
