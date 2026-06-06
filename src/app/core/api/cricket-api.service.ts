import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import {
  BallSubmissionResult,
  CommentaryEntry,
  CreateBallPayload,
  CreateInningsPayload,
  DashboardSnapshot,
  InningsSummary,
  LiveMatchesIndex,
  MatchCompletionPayload,
  PlayerSummary,
  PublicLiveMatchDetail,
  MatchSummary,
  SubscriptionPlan,
  SubscriptionPlanCode,
  SubscriptionCheckoutResult,
  SubscriptionSummary,
  TeamSummary,
  TournamentSummary,
} from '../../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class CricketApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService,
  ) {}

  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(
      this.apiConfig.url('subscriptions/plans'),
    );
  }

  getMySubscription(): Observable<SubscriptionSummary> {
    return this.http.get<SubscriptionSummary>(
      this.apiConfig.url('subscriptions/me'),
    );
  }

  checkoutMonthlyPlan(
    plan: SubscriptionPlanCode,
  ): Observable<SubscriptionCheckoutResult> {
    return this.http.post<SubscriptionCheckoutResult>(
      this.apiConfig.url('subscriptions/checkout/monthly'),
      { plan },
    );
  }

  cancelSubscription(): Observable<SubscriptionSummary> {
    return this.http.post<SubscriptionSummary>(
      this.apiConfig.url('subscriptions/cancel'),
      {},
    );
  }

  getTournaments(): Observable<TournamentSummary[]> {
    return this.http.get<TournamentSummary[]>(
      this.apiConfig.url('admin/tournaments'),
    );
  }

  createTournament(payload: {
    name: string;
    format: 'T20' | 'ODI' | 'TEST';
  }) {
    return this.http.post(
      this.apiConfig.url('admin/tournaments'),
      payload,
    );
  }

  updateTournament(
    tournamentId: string,
    payload: Partial<{
      name: string;
      format: 'T20' | 'ODI' | 'TEST';
    }>,
  ) {
    return this.http.patch(
      this.apiConfig.url(`admin/tournaments/${tournamentId}`),
      payload,
    );
  }

  deleteTournament(tournamentId: string) {
    return this.http.delete(
      this.apiConfig.url(`admin/tournaments/${tournamentId}`),
    );
  }

  getTournamentTeams(tournamentId: string): Observable<TeamSummary[]> {
    return this.http.get<TeamSummary[]>(
      this.apiConfig.url(`admin/tournaments/${tournamentId}/teams`),
    );
  }

  createTeam(
    tournamentId: string,
    payload: { name: string; shortName?: string },
  ) {
    return this.http.post(
      this.apiConfig.url(`admin/tournaments/${tournamentId}/teams`),
      payload,
    );
  }

  getTeamPlayers(teamId: string): Observable<PlayerSummary[]> {
    return this.http.get<PlayerSummary[]>(
      this.apiConfig.url(`admin/teams/${teamId}/players`),
    );
  }

  createPlayer(
    teamId: string,
    payload: { name: string; role?: string },
  ) {
    return this.http.post(
      this.apiConfig.url(`admin/teams/${teamId}/players`),
      payload,
    );
  }

  deletePlayer(playerId: string) {
    return this.http.delete(
      this.apiConfig.url(`admin/players/${playerId}`),
    );
  }

  getMatches(): Observable<MatchSummary[]> {
    return this.http.get<MatchSummary[]>(
      this.apiConfig.url('matches'),
    );
  }

  getMatch(matchId: string): Observable<MatchSummary> {
    return this.http.get<MatchSummary>(
      this.apiConfig.url(`matches/${matchId}`),
    );
  }

  getTournamentMatches(tournamentId: string): Observable<MatchSummary[]> {
    return this.getMatches().pipe(
      map(matches =>
        matches.filter(match => match.tournamentId === tournamentId),
      ),
    );
  }

  scheduleMatch(payload: {
    teamAId: string;
    teamBId: string;
    oversLimit: number;
    tournamentId?: string;
    startTime?: string;
  }): Observable<MatchSummary> {
    return this.http.post<MatchSummary>(
      this.apiConfig.url('matches/schedule'),
      payload,
    );
  }

  startMatch(matchId: string): Observable<MatchSummary> {
    return this.http.post<MatchSummary>(
      this.apiConfig.url(`matches/${matchId}/start`),
      {},
    );
  }

  completeMatch(
    matchId: string,
    payload: MatchCompletionPayload,
  ): Observable<MatchSummary> {
    return this.http.post<MatchSummary>(
      this.apiConfig.url(`matches/${matchId}/complete`),
      payload,
    );
  }

  getMatchInnings(matchId: string): Observable<InningsSummary[]> {
    return this.http.get<InningsSummary[]>(
      this.apiConfig.url(`innings/match/${matchId}`),
    );
  }

  createInnings(payload: CreateInningsPayload): Observable<InningsSummary> {
    return this.http.post<InningsSummary>(
      this.apiConfig.url('innings'),
      payload,
    );
  }

  endInnings(inningsId: string) {
    return this.http.post(
      this.apiConfig.url(`innings/${inningsId}/end`),
      {},
    );
  }

  addBall(payload: CreateBallPayload): Observable<BallSubmissionResult> {
    return this.http.post<BallSubmissionResult>(
      this.apiConfig.url('balls'),
      payload,
    );
  }

  getLiveMatches(): Observable<LiveMatchesIndex> {
    return this.http.get<LiveMatchesIndex>(
      this.apiConfig.url('public/matches/live'),
    );
  }

  getLiveMatch(matchId: string): Observable<PublicLiveMatchDetail> {
    return this.http.get<PublicLiveMatchDetail>(
      this.apiConfig.url(`public/matches/${matchId}/live`),
    );
  }

  getLiveSpectators(matchId: string): Observable<{ spectators: number }> {
    return this.http.get<{ spectators: number }>(
      this.apiConfig.url(`public/matches/${matchId}/spectators`),
    );
  }

  getCommentary(
    matchId: string,
    limit: number = 8,
  ): Observable<CommentaryEntry[]> {
    return this.http.get<CommentaryEntry[]>(
      this.apiConfig.url(`commentary/matches/${matchId}?limit=${limit}`),
    );
  }

  getDashboardSnapshot(): Observable<DashboardSnapshot> {
    return forkJoin({
      tournaments: this.getTournaments(),
      liveMatches: this.getLiveMatches(),
    }).pipe(
      map(({ tournaments, liveMatches }) => ({
        tournaments,
        liveMatches,
        totalTeams: tournaments.reduce(
          (sum, tournament) => sum + (tournament.teams?.length ?? 0),
          0,
        ),
        totalMatches: tournaments.reduce(
          (sum, tournament) => sum + (tournament.matches?.length ?? 0),
          0,
        ),
      })),
    );
  }
}
