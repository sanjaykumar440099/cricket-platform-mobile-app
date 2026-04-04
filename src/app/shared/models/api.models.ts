export interface SubscriptionPlan {
  plan: 'free' | 'basic' | 'premium';
  price: number;
  monthlyMatchLimit: number | null;
  features: string[];
}

export interface SubscriptionSummary {
  id: string;
  userId: string;
  plan: 'free' | 'basic' | 'premium';
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  provider: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
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

export interface MatchSummary {
  id: string;
  tournamentId?: string | null;
  teamAId: string;
  teamBId: string;
  oversLimit: number;
  status: 'scheduled' | 'live' | 'completed';
  winnerTeamId?: string | null;
  startTime?: string | null;
  createdAt?: string;
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

export interface PublicLiveMatchDetail {
  matchId: string;
  match?: {
    id: string;
    tournamentId?: string | null;
    status: 'scheduled' | 'live' | 'completed';
    oversLimit: number;
    startTime?: string | null;
    winnerTeamId?: string | null;
    teamA?: TeamSummary | null;
    teamB?: TeamSummary | null;
    winnerTeam?: TeamSummary | null;
  } | null;
  score?: {
    runs?: number;
    wickets?: number;
    overs?: string;
    runRate?: number;
  } | null;
  state?: {
    totalRuns?: number;
    wickets?: number;
    completedOvers?: number;
    ballsInOver?: number;
  } | null;
  lastBall?: {
    overNumber?: number;
    ballNumber?: number;
    runsOffBat?: number;
    extras?: number;
    extraType?: string | null;
    isWicket?: boolean;
  } | null;
  commentary?: CommentaryEntry | null;
  recentEvents?: Array<{
    eventId: number;
    timestamp: number;
    payload?: {
      state?: {
        totalRuns?: number;
        wickets?: number;
        completedOvers?: number;
        ballsInOver?: number;
      };
      lastBall?: {
        overNumber?: number;
        ballNumber?: number;
        runsOffBat?: number;
        extras?: number;
        extraType?: string | null;
        isWicket?: boolean;
      };
    };
  }>;
  lastEventId?: number | null;
}

export interface DashboardSnapshot {
  tournaments: TournamentSummary[];
  liveMatches: LiveMatchesIndex;
  totalTeams: number;
  totalMatches: number;
}
