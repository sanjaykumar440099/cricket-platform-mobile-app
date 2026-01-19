export type ExtraType =
  | 'wide'
  | 'no-ball'
  | 'bye'
  | 'leg-bye'
  | null;

export interface CreateBallDto {
  matchId: string;
  inningsId: string;

  runsOffBat: number;
  extras: number;
  extraType: ExtraType;

  isWicket: boolean;
}
