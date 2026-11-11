# Mate-Aventura

A kid-friendly math practice web app (addition and subtraction) with a fully Romanian UI.

Built with Angular 22 (standalone components, Signals, Reactive Forms) and Angular Material.

## Features

- **Start screen**: one-tap **Joc rapid** (5 mixed exercises up to 20), three levels (**Ușor / Mediu / Greu**) and a **Personalizat** mode with all settings (max sum, operation, number of questions, counting-dot hint).
- **Question cards**: big numbers, digits-only answer input with autofocus, ENTER to submit, green/red feedback and smooth transition to the next exercise.
- **Counting dots hint** (max sum ≤ 20): joined dots for addition, crossed-out dots for subtraction.
- **Top bar**: timer, progress, correct answers, leaderboard, sound toggle, "Joc Nou".
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

| Key                         | Content                          |
| --------------------------- | -------------------------------- |
| `mate-aventura:leaderboard` | Saved scores                     |
| `mate-aventura:player`      | Last player name                 |
| `mate-aventura:muted`       | Sound on/off                     |
