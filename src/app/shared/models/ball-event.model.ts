export type ExtraType =
  | 'wide'
  | 'no-ball'
  | 'bye'
  | 'leg-bye'
  | null;

export interface BallEvent {
  over: number;
  ball: number;

  runsOffBat: number;   // 0–6
  extras: number;       // total extras
  extraType: ExtraType;

  isWicket: boolean;
  dismissedPlayerId?: string;

  timestamp: number;
}
