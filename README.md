# MateVentura

A kid-friendly math practice web app (addition and subtraction) with a fully Romanian UI,
hosted by **Cifrel**, the app's robot mascot (`public/mascot.svg`, head-only `public/mascot-head.svg`).

Built with Angular 22 (standalone components, Signals, Reactive Forms) and Angular Material.

## Features

- **Start screen**: choose **Învățare** (adaptive practice with progressive help), **Joc**, or **Aventură**.
- **First adventure mission**: a compact rocket workshop with five addition/subtraction exercises (no counting dots), automatic piece progression and launch countdown. Incorrect answers do not remove pieces; after three attempts Cifrel demonstrates the answer and helps fit the piece. Progress is saved locally. More Numărilia missions are not available yet.
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

Keys saved under the old name (`mate-aventura:*`) are moved to the new ones on start
(`src/app/utils/storage-migration.ts`).

## Sharing and promotional material

See [public/pr/README.md](public/pr/README.md) for Romanian copy, asset sizes and deployment/preview checks.
Sharing metadata is static in the HTML head so crawlers do not need to run Angular.
The preview uses a versioned image URL; regenerating images does not deploy the site.
