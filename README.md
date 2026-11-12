# MateVentura

A kid-friendly math practice web app (addition and subtraction) with a fully Romanian UI,
hosted by **Cifrel**, the app's robot mascot (`public/mascot.svg`, head-only `public/mascot-head.svg`).

Built with Angular 22 (standalone components, Signals, Reactive Forms) and Angular Material.

## Features

- **Start screen**: choose **Învățare** (adaptive practice with progressive help), **Joc**, or **Aventură**.
- **Adventure · 3 levels (Beta)**: complete each mission on the Numărilia map to unlock the next. Locked destinations are grayed out; unlocked levels remain accessible when replaying earlier missions. Existing Beta progress is preserved. Compact scenes sit above the original green/red calculation card, with no counting dots or repeated Next clicks:
  - **Atelierul de rachete**: the original five addition/subtraction exercises, rocket repair animation and launch countdown.
  - **Pădurea Adunărilor**: five missing-addend additions up to 10, with the input in either operand position; each answer lights a lantern, and fireflies appear at the finale.
  - **Podul Numerelor**: five boards, each with two guided steps through 10 (8+5, 9+4, 7+6, 6+7 and 13−5). Both steps are needed for a board; Cifrel crosses the completed bridge.
  - Incorrect answers never remove progress. After three mistakes on a step, Cifrel demonstrates the answer and automatically continues. Each mission saves independently, including a bridge board's unfinished second step. Returning to the map cancels pending mission timers without losing saved progress. Completed missions can be replayed individually. Reduced-motion mode uses static fireflies and places Cifrel on the far bank without a crossing animation; the original reduced-motion rocket fade is retained. More levels are planned, but are not playable yet.
- **Game setup**: one-tap **Joc rapid** (5 mixed exercises up to 20), three levels (**Ușor / Mediu / Greu**) and **Personalizat** settings.
- **Cifrel's story**: a playful companion who comes to help Matei and other curious children discover mathematics.
- **Question cards**: big numbers, digits-only answer input with autofocus, ENTER to submit, green/red feedback and smooth transition to the next exercise.
- **Counting dots hint** (max sum ≤ 20): joined dots for addition, crossed-out dots for subtraction.
- **Top bar**: mode selection and sound toggle; timed-game progress and leaderboard when applicable.
- **Results dialog**: 1–3 stars by accuracy, score and total time, confetti, save to leaderboard.
- **Leaderboard (Clasament)**: stored in `localStorage`, one list per level (top 10), ranked by correct answers then time. Quick and custom games are not ranked.
- **Sound effects** generated with the Web Audio API (no audio files).

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm start`     | Dev server with live reload          |
| `npm run build` | Production build into `dist/`        |
| `npm test`      | Unit tests (Vitest)                  |
| `npm run pr:generate` | Regenerate social images and link preview |

## Project structure

```
src/
  app/
    components/      # setup, question card, results, leaderboard (card + dialog)
    directives/      # bump-on-change animation
    models/          # game interfaces and constants
    services/        # question generator, sound, confetti, leaderboard
    utils/           # time formatting
  styles/_palette.scss   # color palette and motion tokens
  styles.scss            # Material theme, big buttons, global styles
```

## Local storage keys

| Key                       | Content                          |
| ------------------------- | -------------------------------- |
| `mateventura:leaderboard` | Saved scores                     |
| `mateventura:player`      | Last player name                 |
| `mateventura:muted`       | Sound on/off                     |
| `mateventura:learning`    | Adaptive learning progress       |
| `mateventura:adventure:rocket` | Repaired rocket pieces (0–5) |
| `mateventura:adventure:forest` | Version 1 JSON: completed lanterns (0–5), step 0 |
| `mateventura:adventure:bridge` | Version 1 JSON: completed boards (0–5), step 0 or 1; completed mission uses step 0 |

Keys saved under the old name (`mate-aventura:*`) are moved to the new ones on start
(`src/app/utils/storage-migration.ts`).

The rocket retains its original numeric storage format and API; existing saves and prefix migration remain compatible.
Forest and bridge saves validate their version, integer piece count and valid step before loading. An invalid save resets only that mission.
Storage is browser-local, not synced between devices; clearing site data removes it. Missions remain playable when storage is blocked, but that session's progress cannot be restored later.

Adventure calculation, persistence, shared-card rendering and mission-flow regression tests are included in the unit-test suite.

## Sharing and promotional material

See [public/pr/README.md](public/pr/README.md) for Romanian copy, asset sizes and deployment/preview checks.
Sharing metadata is static in the HTML head so crawlers do not need to run Angular.
The preview uses a versioned image URL; regenerating images does not deploy the site.
