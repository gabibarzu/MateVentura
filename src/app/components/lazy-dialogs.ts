// Dialogs that aren't needed at startup: loaded on first use, so they stay out of the initial bundle.

export const loadLeaderboardDialog = () =>
  import('./leaderboard-dialog/leaderboard-dialog').then((m) => m.LeaderboardDialog);

export const loadResultsDialog = () => import('./results-dialog/results-dialog').then((m) => m.ResultsDialog);

export const loadInstallHelpDialog = () =>
  import('./install-help-dialog/install-help-dialog').then((m) => m.InstallHelpDialog);
