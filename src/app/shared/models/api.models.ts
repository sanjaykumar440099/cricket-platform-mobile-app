export type MatchStatus = 'scheduled' | 'live' | 'completed';
export type BallExtraType = 'wide' | 'no-ball' | 'bye' | 'leg-bye' | null;
export type SubscriptionPlanCode = 'free' | 'basic' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
  plan: SubscriptionPlanCode;
  name?: string;
  description?: string;
  price: number;
  currency?: string;
  interval?: 'month';
  monthlyMatchLimit: number | null;
  monthlyTournamentLimit?: number | null;
  highlighted?: boolean;
  isEnterprise?: boolean;
  features: string[];
}

export interface SubscriptionSummary {
  id: string;
  userId: string;
  plan: SubscriptionPlanCode;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  provider: string;
  billingInterval?: 'month';
  monthlyPrice?: number;
  currency?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
}

export interface SubscriptionCheckoutResult {
  subscription: SubscriptionSummary;
  billing: {
    provider: string;
    interval: 'month';
    amount: number;
    currency: string;
    status: string;
  };
}

export interface TeamSummary {
  id: string;
  name: string;
  shortName?: string | null;
  players?: PlayerSummary[];
}

export interface PlayerSummary {
  id: string;
  name: string;
  role?: string | null;
}

export interface TournamentLite {
  id: string;
  name: string;
  format: 'T20' | 'ODI' | 'TEST';
}

export interface MatchSummary {
  id: string;
  tournamentId?: string | null;
  teamAId: string;
  teamBId: string;
  oversLimit: number;
  status: MatchStatus;
  winnerTeamId?: string | null;
  startTime?: string | null;
  createdAt?: string;
  isTie?: boolean;
  isNoResult?: boolean;
  teamA?: TeamSummary | null;
  teamB?: TeamSummary | null;
  winnerTeam?: TeamSummary | null;
  tournament?: TournamentLite | null;
}

export interface InningsSummary {
  id: string;
  matchId: string;
  battingTeamId: string;
  bowlingTeamId: string;
  inningsNumber: number;
  isCompleted: boolean;
  isSuperOver?: boolean;
  createdAt?: string;
}

export interface ScoreSummary {
  runs?: number;
  wickets?: number;
  overs?: string;
  runRate?: number;
}

export interface LiveStateSummary {
  totalRuns?: number;
  wickets?: number;
  completedOvers?: number;
  ballsInOver?: number;
  strikerId?: string;
  nonStrikerId?: string;
  currentBowlerId?: string;
  isCompleted?: boolean;
  isFreeHit?: boolean;
  powerplayPhase?: string | null;
  maxFieldersOutside?: number;
  isPowerplay?: boolean;
}

export interface LastBallSummary {
  overNumber?: number;
  ballNumber?: number;
  runsOffBat?: number;
  extras?: number;
  extraType?: BallExtraType;
  isWicket?: boolean;
  dismissedPlayerId?: string;
}

export interface CreateInningsPayload {
  matchId: string;
  battingTeamId: string;
  bowlingTeamId: string;
  inningsNumber: number;
  isSuperOver?: boolean;
}

export interface CreateBallPayload {
  inningsId: string;
  overNumber: number;
  ballNumber: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsOffBat: number;
  extras: number;
  extraType: BallExtraType;
  isWicket: boolean;
  dismissedPlayerId?: string;
  fieldersOutsideCircle: number;
}

export interface MatchCompletionPayload {
  winnerTeamId?: string;
  isTie?: boolean;
  isNoResult?: boolean;
}

export interface BallSubmissionResult {
  score?: ScoreSummary | null;
  state?: LiveStateSummary | null;
  commentary?: CommentaryEntry | null;
  lastBall?: LastBallSummary | null;
  lastEventId?: number | null;
  event?: LiveScoreEvent;
}

export interface TournamentSummary {
  id: string;
  name: string;
  format: 'T20' | 'ODI' | 'TEST';
  teams?: TeamSummary[];
  matches?: MatchSummary[];
  createdAt?: string;
}

export interface LiveMatchesIndex {
  total: number;
  matches: string[];
}

export interface CommentaryEntry {
  id: string;
  matchId: string;
  inningsId?: string | null;
  overNumber?: number | null;
  ballNumber?: number | null;
  entryType: 'ball' | 'summary';
  style: 'basic' | 'enhanced' | 'advanced';
  context?: string | null;
  text: string;
  createdAt: string;
}

export interface LiveScoreEvent {
  eventId: number;
  matchId: string;
  timestamp: number;
  score?: ScoreSummary | null;
  state?: LiveStateSummary | null;
  lastBall?: LastBallSummary | null;
  commentary?: CommentaryEntry | null;
  payload?: {
    score?: ScoreSummary | null;
    state?: LiveStateSummary | null;
    lastBall?: LastBallSummary | null;
    commentary?: CommentaryEntry | null;
  };
}

export interface PublicLiveMatchDetail {
  matchId: string;
  match?: {
    id: string;
    tournamentId?: string | null;
    status: MatchStatus;
    oversLimit: number;
    startTime?: string | null;
    winnerTeamId?: string | null;
    teamA?: TeamSummary | null;
    teamB?: TeamSummary | null;
    winnerTeam?: TeamSummary | null;
  } | null;
  score?: ScoreSummary | null;
  state?: LiveStateSummary | null;
  lastBall?: LastBallSummary | null;
  commentary?: CommentaryEntry | null;
  recentEvents?: LiveScoreEvent[];
  lastEventId?: number | null;
}

export interface DashboardSnapshot {
  tournaments: TournamentSummary[];
  liveMatches: LiveMatchesIndex;
  totalTeams: number;
  totalMatches: number;
}
