export interface ScoringExtras {
  wides: number;
  noBalls: number;
  byes: number;
  overthrows: number;
}

export interface ScoringState {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: ScoringExtras;
}
