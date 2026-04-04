import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { CricketApiService } from '../../../core/api/cricket-api.service';
import {
  BallExtraType,
  CommentaryEntry,
  CreateBallPayload,
  CreateInningsPayload,
  InningsSummary,
  MatchCompletionPayload,
  MatchSummary,
  PlayerSummary,
  PublicLiveMatchDetail,
  TeamSummary,
} from '../../../shared/models/api.models';

type ExtraSelection = BallExtraType | 'none';

interface MatchDeskBundle {
  match: MatchSummary;
  innings: InningsSummary[];
  liveDetail: PublicLiveMatchDetail | null;
  commentary: CommentaryEntry[];
  teamAPlayers: PlayerSummary[];
  teamBPlayers: PlayerSummary[];
}

interface RunOption {
  label: string;
  value: number;
  tone: 'base' | 'boundary' | 'six';
}

interface ExtraOption {
  label: string;
  value: ExtraSelection;
  note: string;
}

interface RecentBallChip {
  label: string;
  kind: 'base' | 'boundary' | 'wicket' | 'highlight';
}

interface CommentaryLine {
  over: string;
  text: string;
}

@Component({
  selector: 'app-matchdesk',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, RouterLink],
  templateUrl: './matchdesk.page.html',
  styleUrls: ['./matchdesk.page.scss'],
})
export class MatchdeskPage implements OnInit {
  readonly runOptions: RunOption[] = [
    { label: '0', value: 0, tone: 'base' },
    { label: '1', value: 1, tone: 'base' },
    { label: '2', value: 2, tone: 'base' },
    { label: '3', value: 3, tone: 'base' },
    { label: '4', value: 4, tone: 'boundary' },
    { label: '6', value: 6, tone: 'six' },
  ];

  readonly extraOptions: ExtraOption[] = [
    { label: 'None', value: 'none', note: 'Standard legal delivery' },
    { label: 'Wide', value: 'wide', note: 'Extra run, ball does not count' },
    { label: 'No Ball', value: 'no-ball', note: 'Free hit trigger and extra run' },
    { label: 'Bye', value: 'bye', note: 'No bat run, extras only' },
    { label: 'Leg Bye', value: 'leg-bye', note: 'Leg-bye extras only' },
  ];

  readonly extrasRange = [0, 1, 2, 3, 4, 5];

  matches: MatchSummary[] = [];
  selectedMatchId = '';
  selectedMatch: MatchSummary | null = null;
  inningsList: InningsSummary[] = [];
  activeInnings: InningsSummary | null = null;
  liveDetail: PublicLiveMatchDetail | null = null;
  commentaryFeed: CommentaryLine[] = [];
  recentBalls: RecentBallChip[] = [];

  teamAPlayers: PlayerSummary[] = [];
  teamBPlayers: PlayerSummary[] = [];
  battingPlayers: PlayerSummary[] = [];
  bowlingPlayers: PlayerSummary[] = [];
  fieldersOutsideOptions: number[] = [0, 1, 2];

  inningsSetup = {
    battingTeamId: '',
    bowlingTeamId: '',
    inningsNumber: 1,
    isSuperOver: false,
  };

  ballForm = {
    strikerId: '',
    nonStrikerId: '',
    bowlerId: '',
    runsOffBat: 0,
    extras: 0,
    extraType: 'none' as ExtraSelection,
    isWicket: false,
    dismissedPlayerId: '',
    fieldersOutsideCircle: 2,
  };

  resultForm = {
    winnerTeamId: '',
    isTie: false,
    isNoResult: false,
  };

  isLoadingMatches = false;
  isLoadingDesk = false;
  isStartingMatch = false;
  isCreatingInnings = false;
  isSubmittingBall = false;
  isEndingInnings = false;
  isCompletingMatch = false;

  pageError = '';
  deskError = '';
  ballError = '';

  constructor(private readonly api: CricketApiService) {}

  ngOnInit() {
    this.loadMatches();
  }

  loadMatches(preferredMatchId?: string) {
    this.isLoadingMatches = true;
    this.pageError = '';

    this.api.getMatches()
      .pipe(finalize(() => {
        this.isLoadingMatches = false;
      }))
      .subscribe({
        next: matches => {
          this.matches = matches;

          const nextMatchId =
            preferredMatchId
            ?? this.selectedMatchId
            ?? matches.find(match => match.status === 'live')?.id
            ?? matches.find(match => match.status === 'scheduled')?.id
            ?? matches[0]?.id
            ?? '';

          if (!nextMatchId) {
            this.clearDesk();
            return;
          }

          this.selectedMatchId = nextMatchId;
          this.loadMatchDesk(nextMatchId);
        },
        error: err => {
          console.error('Failed to load matches', err);
          this.matches = [];
          this.clearDesk();
          this.pageError = 'Unable to load matches from the scoring API.';
        },
      });
  }

  onMatchSelectionChange() {
    if (!this.selectedMatchId) {
      this.clearDesk();
      return;
    }

    this.loadMatchDesk(this.selectedMatchId);
  }

  chooseMatch(matchId: string) {
    if (this.selectedMatchId === matchId) {
      return;
    }

    this.selectedMatchId = matchId;
    this.loadMatchDesk(matchId);
  }

  loadMatchDesk(matchId: string) {
    this.isLoadingDesk = true;
    this.deskError = '';
    this.ballError = '';

    forkJoin({
      match: this.api.getMatch(matchId),
      innings: this.api.getMatchInnings(matchId),
      liveDetail: this.api.getLiveMatch(matchId).pipe(
        catchError(() => of(null)),
      ),
      commentary: this.api.getCommentary(matchId, 10).pipe(
        catchError(() => of([])),
      ),
    }).pipe(
      switchMap(base =>
        forkJoin({
          teamAPlayers: this.api.getTeamPlayers(base.match.teamAId).pipe(
            catchError(() => of([])),
          ),
          teamBPlayers: this.api.getTeamPlayers(base.match.teamBId).pipe(
            catchError(() => of([])),
          ),
        }).pipe(
          map(players => ({
            ...base,
            ...players,
          })),
        ),
      ),
      finalize(() => {
        this.isLoadingDesk = false;
      }),
    ).subscribe({
      next: bundle => {
        this.bindDesk(bundle);
      },
      error: err => {
        console.error('Failed to load scorer desk', err);
        this.deskError = 'Unable to load this match desk right now.';
      },
    });
  }

  startSelectedMatch() {
    if (!this.selectedMatch || this.isStartingMatch) {
      return;
    }

    this.isStartingMatch = true;

    this.api.startMatch(this.selectedMatch.id)
      .pipe(finalize(() => {
        this.isStartingMatch = false;
      }))
      .subscribe({
        next: () => {
          this.loadMatches(this.selectedMatch?.id);
        },
        error: err => {
          console.error('Failed to start match', err);
          this.deskError = err?.error?.message ?? 'Unable to start the selected match.';
        },
      });
  }

  createInnings() {
    if (!this.selectedMatch || this.isCreatingInnings) {
      return;
    }

    if (!this.inningsSetup.battingTeamId || !this.inningsSetup.bowlingTeamId) {
      this.deskError = 'Choose batting and bowling teams before creating an innings.';
      return;
    }

    const payload: CreateInningsPayload = {
      matchId: this.selectedMatch.id,
      battingTeamId: this.inningsSetup.battingTeamId,
      bowlingTeamId: this.inningsSetup.bowlingTeamId,
      inningsNumber: this.inningsSetup.inningsNumber,
      isSuperOver: this.inningsSetup.isSuperOver,
    };

    this.isCreatingInnings = true;
    this.deskError = '';

    this.api.createInnings(payload)
      .pipe(finalize(() => {
        this.isCreatingInnings = false;
      }))
      .subscribe({
        next: () => {
          this.loadMatchDesk(this.selectedMatch?.id ?? this.selectedMatchId);
        },
        error: err => {
          console.error('Failed to create innings', err);
          this.deskError = 'Unable to create the innings with the selected teams.';
        },
      });
  }

  endCurrentInnings() {
    if (!this.activeInnings || this.isEndingInnings) {
      return;
    }

    this.isEndingInnings = true;

    this.api.endInnings(this.activeInnings.id)
      .pipe(finalize(() => {
        this.isEndingInnings = false;
      }))
      .subscribe({
        next: () => {
          this.loadMatchDesk(this.selectedMatch?.id ?? this.selectedMatchId);
        },
        error: err => {
          console.error('Failed to end innings', err);
          this.deskError = 'Unable to close the current innings.';
        },
      });
  }

  submitBall() {
    if (!this.selectedMatch || !this.activeInnings || this.isSubmittingBall) {
      return;
    }

    if (!this.ballForm.strikerId || !this.ballForm.nonStrikerId || !this.ballForm.bowlerId) {
      this.ballError = 'Select striker, non-striker, and bowler before scoring the ball.';
      return;
    }

    const state = this.liveDetail?.state;
    const extraType = this.ballForm.extraType === 'none'
      ? null
      : this.ballForm.extraType;

    const payload: CreateBallPayload = {
      inningsId: this.activeInnings.id,
      overNumber: (state?.completedOvers ?? 0) + 1,
      ballNumber: (state?.ballsInOver ?? 0) + 1,
      strikerId: this.ballForm.strikerId,
      nonStrikerId: this.ballForm.nonStrikerId,
      bowlerId: this.ballForm.bowlerId,
      runsOffBat: this.normalizedRunsOffBat(),
      extras: this.normalizedExtras(),
      extraType,
      isWicket: this.ballForm.isWicket,
      dismissedPlayerId: this.ballForm.isWicket
        ? (this.ballForm.dismissedPlayerId || this.ballForm.strikerId)
        : undefined,
      fieldersOutsideCircle: this.ballForm.fieldersOutsideCircle,
    };

    this.isSubmittingBall = true;
    this.ballError = '';

    this.api.addBall(payload)
      .pipe(finalize(() => {
        this.isSubmittingBall = false;
      }))
      .subscribe({
        next: () => {
          this.loadMatchDesk(this.selectedMatch?.id ?? this.selectedMatchId);
        },
        error: err => {
          console.error('Failed to submit ball', err);
          this.ballError = err?.error?.message ?? 'Unable to score this delivery.';
        },
      });
  }

  completeSelectedMatch() {
    if (!this.selectedMatch || this.isCompletingMatch) {
      return;
    }

    const payload: MatchCompletionPayload = {
      winnerTeamId: this.resultForm.isTie || this.resultForm.isNoResult
        ? undefined
        : (this.resultForm.winnerTeamId || undefined),
      isTie: this.resultForm.isTie,
      isNoResult: this.resultForm.isNoResult,
    };

    this.isCompletingMatch = true;

    this.api.completeMatch(this.selectedMatch.id, payload)
      .pipe(finalize(() => {
        this.isCompletingMatch = false;
      }))
      .subscribe({
        next: () => {
          this.loadMatches(this.selectedMatch?.id);
        },
        error: err => {
          console.error('Failed to complete match', err);
          this.deskError = 'Unable to complete the selected match.';
        },
      });
  }

  setRun(value: number) {
    if (!this.canUseBatRuns()) {
      return;
    }

    this.ballForm.runsOffBat = value;
  }

  setExtraType(value: ExtraSelection) {
    this.ballForm.extraType = value;

    if (value === 'none') {
      this.ballForm.extras = 0;
      return;
    }

    if (value === 'wide') {
      this.ballForm.runsOffBat = 0;
      this.ballForm.extras = Math.max(this.ballForm.extras, 1);
      return;
    }

    if (value === 'bye' || value === 'leg-bye') {
      this.ballForm.runsOffBat = 0;
      this.ballForm.extras = Math.max(this.ballForm.extras, 1);
      return;
    }

    this.ballForm.extras = Math.max(this.ballForm.extras, 1);
  }

  toggleWicket() {
    this.ballForm.isWicket = !this.ballForm.isWicket;

    if (this.ballForm.isWicket && !this.ballForm.dismissedPlayerId) {
      this.ballForm.dismissedPlayerId = this.ballForm.strikerId;
      return;
    }

    if (!this.ballForm.isWicket) {
      this.ballForm.dismissedPlayerId = '';
    }
  }

  syncBowlingTeam() {
    if (!this.selectedMatch) {
      return;
    }

    this.inningsSetup.bowlingTeamId =
      this.inningsSetup.battingTeamId === this.selectedMatch.teamAId
        ? this.selectedMatch.teamBId
        : this.selectedMatch.teamAId;
  }

  setResultWinner(teamId: string) {
    this.resultForm.winnerTeamId = teamId;
    this.resultForm.isTie = false;
    this.resultForm.isNoResult = false;
  }

  markTie() {
    this.resultForm.isTie = !this.resultForm.isTie;

    if (this.resultForm.isTie) {
      this.resultForm.isNoResult = false;
      this.resultForm.winnerTeamId = '';
    }
  }

  markNoResult() {
    this.resultForm.isNoResult = !this.resultForm.isNoResult;

    if (this.resultForm.isNoResult) {
      this.resultForm.isTie = false;
      this.resultForm.winnerTeamId = '';
    }
  }

  scoreLine() {
    const runs = this.liveDetail?.score?.runs ?? this.liveDetail?.state?.totalRuns ?? 0;
    const wickets = this.liveDetail?.score?.wickets ?? this.liveDetail?.state?.wickets ?? 0;
    return `${runs}/${wickets}`;
  }

  oversLine() {
    return this.liveDetail?.score?.overs
      ?? `${this.liveDetail?.state?.completedOvers ?? 0}.${this.liveDetail?.state?.ballsInOver ?? 0}`;
  }

  runRateLine() {
    const runRate = this.liveDetail?.score?.runRate ?? 0;
    return runRate.toFixed(2);
  }

  powerplayLabel() {
    return this.liveDetail?.state?.powerplayPhase ?? 'Opening spell';
  }

  activeInningsLabel() {
    if (!this.activeInnings) {
      return 'No innings live';
    }

    return `Innings ${this.activeInnings.inningsNumber}`;
  }

  activeBattingTeam() {
    return this.teamById(this.activeInnings?.battingTeamId ?? '');
  }

  activeBowlingTeam() {
    return this.teamById(this.activeInnings?.bowlingTeamId ?? '');
  }

  statusLabel(status: MatchSummary['status']) {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  teamShort(team?: TeamSummary | null) {
    if (!team) {
      return 'TM';
    }

    if (team.shortName) {
      return team.shortName;
    }

    return team.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  canCreateInnings() {
    return !!this.selectedMatch
      && this.selectedMatch.status === 'live'
      && !this.activeInnings
      && this.inningsList.length < 2;
  }

  canScoreBall() {
    return !!this.selectedMatch
      && this.selectedMatch.status === 'live'
      && !!this.activeInnings
      && !this.activeInnings.isCompleted;
  }

  canStartSelectedMatch() {
    if (!this.selectedMatch || this.selectedMatch.status !== 'scheduled') {
      return false;
    }

    return this.isScoringWindowOpen(this.selectedMatch);
  }

  startWindowMessage() {
    if (!this.selectedMatch?.startTime) {
      return 'No scheduled time set. Start when the teams are ready.';
    }

    const openTime = this.startWindowOpensAt(this.selectedMatch);
    const startTime = new Date(this.selectedMatch.startTime);

    if (!openTime) {
      return 'Start time unavailable.';
    }

    if (this.isScoringWindowOpen(this.selectedMatch)) {
      return `Scoring window is open. Scheduled start is ${this.formatDateTime(startTime)}.`;
    }

    return `Scoring opens at ${this.formatDateTime(openTime)} for the scheduled start ${this.formatDateTime(startTime)}.`;
  }

  canUseBatRuns() {
    return this.ballForm.extraType !== 'bye'
      && this.ballForm.extraType !== 'leg-bye'
      && this.ballForm.extraType !== 'wide';
  }

  teamById(teamId: string) {
    if (!this.selectedMatch) {
      return null;
    }

    if (this.selectedMatch.teamAId === teamId) {
      return this.selectedMatch.teamA ?? null;
    }

    if (this.selectedMatch.teamBId === teamId) {
      return this.selectedMatch.teamB ?? null;
    }

    return null;
  }

  private bindDesk(bundle: MatchDeskBundle) {
    this.selectedMatch = bundle.match;
    this.inningsList = bundle.innings;
    this.activeInnings =
      [...bundle.innings]
        .reverse()
        .find(innings => !innings.isCompleted)
      ?? null;

    this.liveDetail = bundle.liveDetail;
    this.teamAPlayers = bundle.teamAPlayers;
    this.teamBPlayers = bundle.teamBPlayers;
    this.commentaryFeed = bundle.commentary.map(entry => ({
      over: entry.overNumber !== null && entry.overNumber !== undefined
        && entry.ballNumber !== null && entry.ballNumber !== undefined
        ? `${entry.overNumber}.${entry.ballNumber}`
        : 'Update',
      text: entry.text,
    }));
    this.recentBalls = this.buildRecentBalls(bundle.liveDetail);

    this.prepareInningsSetup();
    this.prepareLineups();
    this.prepareBallForm();
    this.prepareResultForm();
  }

  private prepareInningsSetup() {
    if (!this.selectedMatch) {
      return;
    }

    if (!this.inningsList.length) {
      this.inningsSetup = {
        battingTeamId: this.inningsSetup.battingTeamId || this.selectedMatch.teamAId,
        bowlingTeamId: this.inningsSetup.battingTeamId === this.selectedMatch.teamBId
          ? this.selectedMatch.teamAId
          : this.selectedMatch.teamBId,
        inningsNumber: 1,
        isSuperOver: false,
      };
      return;
    }

    const lastInnings = this.inningsList[this.inningsList.length - 1];

    if (lastInnings && lastInnings.isCompleted && this.inningsList.length === 1) {
      this.inningsSetup = {
        battingTeamId: lastInnings.bowlingTeamId,
        bowlingTeamId: lastInnings.battingTeamId,
        inningsNumber: 2,
        isSuperOver: false,
      };
      return;
    }

    if (lastInnings) {
      this.inningsSetup = {
        battingTeamId: lastInnings.battingTeamId,
        bowlingTeamId: lastInnings.bowlingTeamId,
        inningsNumber: lastInnings.inningsNumber,
        isSuperOver: false,
      };
    }
  }

  private prepareLineups() {
    if (!this.selectedMatch) {
      this.battingPlayers = [];
      this.bowlingPlayers = [];
      return;
    }

    const battingTeamId = this.activeInnings?.battingTeamId ?? this.inningsSetup.battingTeamId;
    const bowlingTeamId = this.activeInnings?.bowlingTeamId ?? this.inningsSetup.bowlingTeamId;

    this.battingPlayers = this.playersForTeam(battingTeamId);
    this.bowlingPlayers = this.playersForTeam(bowlingTeamId);

    const maxFieldersOutside = this.liveDetail?.state?.maxFieldersOutside ?? 2;
    this.fieldersOutsideOptions = Array.from(
      { length: maxFieldersOutside + 1 },
      (_, index) => index,
    );
  }

  private prepareBallForm() {
    const strikerId = this.liveDetail?.state?.strikerId
      ?? this.battingPlayers[0]?.id
      ?? '';
    const nonStrikerId = this.liveDetail?.state?.nonStrikerId
      ?? this.battingPlayers.find(player => player.id !== strikerId)?.id
      ?? strikerId;
    const bowlerId = this.liveDetail?.state?.currentBowlerId
      ?? this.bowlingPlayers[0]?.id
      ?? '';

    this.ballForm = {
      strikerId,
      nonStrikerId,
      bowlerId,
      runsOffBat: 0,
      extras: 0,
      extraType: 'none',
      isWicket: false,
      dismissedPlayerId: '',
      fieldersOutsideCircle: Math.min(
        this.liveDetail?.state?.maxFieldersOutside ?? 2,
        this.fieldersOutsideOptions[this.fieldersOutsideOptions.length - 1] ?? 2,
      ),
    };
  }

  private prepareResultForm() {
    this.resultForm = {
      winnerTeamId: this.selectedMatch?.winnerTeamId ?? '',
      isTie: !!this.selectedMatch?.isTie,
      isNoResult: !!this.selectedMatch?.isNoResult,
    };
  }

  private buildRecentBalls(detail: PublicLiveMatchDetail | null): RecentBallChip[] {
    if (!detail?.recentEvents?.length) {
      return [];
    }

    return detail.recentEvents.slice(-6).map(event => {
      const ball = event.payload?.lastBall;

      if (!ball) {
        return { label: '-', kind: 'base' as const };
      }

      if (ball.isWicket) {
        return { label: 'W', kind: 'wicket' as const };
      }

      if (ball.extraType === 'wide') {
        return { label: 'Wd', kind: 'highlight' as const };
      }

      if (ball.extraType === 'no-ball') {
        return { label: 'Nb', kind: 'highlight' as const };
      }

      const totalRuns = (ball.runsOffBat ?? 0) + (ball.extras ?? 0);

      if (totalRuns === 4) {
        return { label: '4', kind: 'boundary' as const };
      }

      if (totalRuns >= 6) {
        return { label: `${totalRuns}`, kind: 'highlight' as const };
      }

      return { label: `${totalRuns}`, kind: 'base' as const };
    });
  }

  private playersForTeam(teamId: string) {
    if (!this.selectedMatch) {
      return [];
    }

    if (this.selectedMatch.teamAId === teamId) {
      return this.teamAPlayers;
    }

    if (this.selectedMatch.teamBId === teamId) {
      return this.teamBPlayers;
    }

    return [];
  }

  private startWindowOpensAt(match: MatchSummary) {
    if (!match.startTime) {
      return null;
    }

    return new Date(new Date(match.startTime).getTime() - 60 * 60 * 1000);
  }

  private isScoringWindowOpen(match: MatchSummary) {
    const openTime = this.startWindowOpensAt(match);

    if (!openTime) {
      return true;
    }

    return Date.now() >= openTime.getTime();
  }

  private formatDateTime(value: string | Date) {
    return new Date(value).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private normalizedRunsOffBat() {
    return this.canUseBatRuns() ? this.ballForm.runsOffBat : 0;
  }

  private normalizedExtras() {
    if (this.ballForm.extraType === 'none') {
      return 0;
    }

    return Math.max(this.ballForm.extras, 1);
  }

  private clearDesk() {
    this.selectedMatchId = '';
    this.selectedMatch = null;
    this.inningsList = [];
    this.activeInnings = null;
    this.liveDetail = null;
    this.commentaryFeed = [];
    this.recentBalls = [];
    this.teamAPlayers = [];
    this.teamBPlayers = [];
    this.battingPlayers = [];
    this.bowlingPlayers = [];
  }
}
