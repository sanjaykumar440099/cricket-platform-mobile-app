import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { finalize, forkJoin, of, Subscription, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CricketApiService } from '../../../core/api/cricket-api.service';
import {
  SocketConnectionState,
  SocketService,
} from '../../../core/socket/socket.service';
import {
  CommentaryEntry,
  LiveScoreEvent,
  PublicLiveMatchDetail,
} from '../../../shared/models/api.models';

interface Team {
  id: string;
  name: string;
  short: string;
  descriptor: string;
}

interface SignalCard {
  label: string;
  value: string;
  detail: string;
}

interface BallChip {
  label: string;
  kind: string;
}

interface CommentaryLine {
  over: string;
  text: string;
}

@Component({
  selector: 'app-stadium',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './stadium.page.html',
  styleUrls: ['./stadium.page.scss'],
})
export class StadiumPage implements OnInit, OnDestroy {
  home: Team = {
    id: 'team-a',
    name: 'Team A',
    short: 'TA',
    descriptor: 'Awaiting live fixture',
  };

  away: Team = {
    id: 'team-b',
    name: 'Team B',
    short: 'TB',
    descriptor: 'Match metadata will appear here',
  };

  status = 'Waiting for a live match';
  venue = 'Start a live match in the backend to populate this stadium feed.';
  currentScore = '0/0';
  currentOvers = '0.0 ov';
  scoreContext = 'Live innings data will appear here.';
  recentOverLabel = 'No over yet';
  matchId: string | null = null;
  isLoading = false;
  hasLiveMatch = false;
  errorMessage = '';
  socketState: SocketConnectionState = 'idle';

  summaryStats = [
    { label: 'Run Rate', value: '0.00' },
    { label: 'Spectators', value: '0' },
    { label: 'Last Event', value: '-' },
  ];

  recentOver: BallChip[] = [];
  signals: SignalCard[] = [];
  commentary: CommentaryLine[] = [];

  matchFacts = [
    { label: 'Format', value: 'Awaiting live data' },
    { label: 'Status', value: 'Offline' },
    { label: 'Last ball', value: '-' },
  ];

  private currentDetail: PublicLiveMatchDetail | null = null;
  private currentSpectators = 0;
  private currentCommentary: CommentaryEntry[] = [];
  private readonly socketSubscriptions = new Subscription();
  private fallbackTimerId: ReturnType<typeof setInterval> | null = null;
  private isFallbackSyncing = false;

  constructor(
    public auth: AuthService,
    private readonly api: CricketApiService,
    private readonly socket: SocketService,
  ) {}

  ngOnInit() {
    this.bindSocketListeners();
    this.loadLiveFeed();
  }

  ngOnDestroy() {
    this.socketSubscriptions.unsubscribe();
    this.stopFallbackResync();
    this.socket.disconnect();
  }

  ballClass(kind: string) {
    return `ball-${kind}`;
  }

  reload() {
    this.loadLiveFeed();
  }

  socketLabel() {
    if (this.socketState === 'connected') {
      return 'Live socket';
    }

    if (this.socketState === 'connecting') {
      return 'Connecting';
    }

    if (
      this.socketState === 'disconnected'
      || this.socketState === 'error'
    ) {
      return 'Resyncing';
    }

    return 'Standby';
  }

  private loadLiveFeed() {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.getLiveMatches()
      .pipe(
        switchMap(index => {
          if (!index.matches.length) {
            this.applyEmptyState();
            return of(null);
          }

          const liveMatchId = index.matches[0];
          this.matchId = liveMatchId;

          return forkJoin({
            detail: this.api.getLiveMatch(liveMatchId),
            spectators: this.api.getLiveSpectators(liveMatchId),
            commentary: this.api.getCommentary(liveMatchId, 10),
          });
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: result => {
          if (!result) {
            return;
          }

          this.bindLiveFeed(
            result.detail,
            result.spectators.spectators,
            result.commentary,
          );
          this.connectLiveSocket(result.detail);
        },
        error: err => {
          console.error('Failed to load live feed', err);
          this.applyEmptyState();
          this.socket.disconnect();
          this.errorMessage = 'Unable to load the live feed from the API right now.';
        },
      });
  }

  private bindLiveFeed(
    detail: PublicLiveMatchDetail,
    spectators: number,
    commentaryFeed: CommentaryEntry[],
  ) {
    this.currentDetail = detail;
    this.currentSpectators = spectators;
    this.currentCommentary = commentaryFeed;

    const teamAName = detail.match?.teamA?.name ?? 'Team A';
    const teamBName = detail.match?.teamB?.name ?? 'Team B';
    const teamAShort = detail.match?.teamA?.shortName ?? this.toInitials(teamAName);
    const teamBShort = detail.match?.teamB?.shortName ?? this.toInitials(teamBName);
    const oversLimit = detail.match?.oversLimit ?? 20;
    const runs = detail.score?.runs ?? detail.state?.totalRuns ?? 0;
    const wickets = detail.score?.wickets ?? detail.state?.wickets ?? 0;
    const overs = detail.score?.overs
      ?? `${detail.state?.completedOvers ?? 0}.${detail.state?.ballsInOver ?? 0}`;
    const runRate = detail.score?.runRate ?? 0;
    const commentary = commentaryFeed.length
      ? commentaryFeed
      : detail.commentary
        ? [detail.commentary]
        : [];

    this.hasLiveMatch = true;
    this.home = {
      id: detail.match?.teamA?.id ?? 'team-a',
      name: teamAName,
      short: teamAShort,
      descriptor: 'Fixture side A',
    };
    this.away = {
      id: detail.match?.teamB?.id ?? 'team-b',
      name: teamBName,
      short: teamBShort,
      descriptor: 'Fixture side B',
    };
    this.status = `${this.toTitleCase(detail.match?.status ?? 'live')} · ${teamAShort} vs ${teamBShort}`;
    this.venue = `${oversLimit}-over match${detail.match?.tournamentId ? ' · tournament linked' : ' · standalone fixture'}`;
    this.currentScore = `${runs}/${wickets}`;
    this.currentOvers = `${overs} ov`;
    this.scoreContext = detail.commentary?.text ?? 'AI commentary will refresh as scoring events arrive.';
    this.recentOver = this.buildRecentOver(detail);
    this.recentOverLabel = detail.lastBall?.overNumber !== undefined
      ? `Over ${detail.lastBall.overNumber}`
      : 'Latest deliveries';
    this.summaryStats = [
      { label: 'Run Rate', value: runRate.toFixed(2) },
      { label: 'Spectators', value: `${spectators}` },
      { label: 'Last Event', value: detail.lastEventId ? `#${detail.lastEventId}` : '-' },
    ];
    this.matchFacts = [
      { label: 'Format', value: `${oversLimit} overs` },
      { label: 'Status', value: this.toTitleCase(detail.match?.status ?? 'live') },
      { label: 'Last ball', value: this.formatLastBall(detail) },
    ];
    this.signals = [
      {
        label: 'Current score',
        value: this.currentScore,
        detail: `${this.currentOvers} · live innings`,
      },
      {
        label: 'AI style',
        value: this.toTitleCase(detail.commentary?.style ?? 'basic'),
        detail: detail.commentary?.context ?? 'Rule-based live call',
      },
      {
        label: 'Latest outcome',
        value: this.formatBallOutcome(detail),
        detail: 'Most recent scoring event',
      },
    ];
    this.commentary = commentary.map(entry => ({
      over: this.formatCommentaryOver(entry),
      text: entry.text,
    }));
  }

  private buildRecentOver(detail: PublicLiveMatchDetail): BallChip[] {
    const recentEvents = detail.recentEvents ?? [];

    return recentEvents.slice(-6).map(event => {
      const ball = event.payload?.lastBall;

      if (!ball) {
        return { label: '-', kind: 'single' };
      }

      if (ball.isWicket) {
        return { label: 'W', kind: 'wicket' };
      }

      if (ball.extraType === 'wide') {
        return { label: 'Wd', kind: 'single' };
      }

      if (ball.extraType === 'no-ball') {
        return { label: 'Nb', kind: 'single' };
      }

      const totalRuns = (ball.runsOffBat ?? 0) + (ball.extras ?? 0);

      if (totalRuns >= 6) {
        return { label: `${totalRuns}`, kind: 'six' };
      }

      if (totalRuns === 4) {
        return { label: '4', kind: 'boundary' };
      }

      if (totalRuns === 2) {
        return { label: '2', kind: 'double' };
      }

      return {
        label: `${totalRuns}`,
        kind: 'single',
      };
    });
  }

  private formatCommentaryOver(entry: CommentaryEntry): string {
    if (entry.overNumber !== null && entry.overNumber !== undefined
      && entry.ballNumber !== null && entry.ballNumber !== undefined) {
      return `${entry.overNumber}.${entry.ballNumber}`;
    }

    return 'Update';
  }

  private formatLastBall(detail: PublicLiveMatchDetail): string {
    const lastBall = detail.lastBall;

    if (!lastBall) {
      return '-';
    }

    return `${lastBall.overNumber ?? 0}.${lastBall.ballNumber ?? 0} · ${this.formatBallOutcome(detail)}`;
  }

  private formatBallOutcome(detail: PublicLiveMatchDetail): string {
    const lastBall = detail.lastBall;

    if (!lastBall) {
      return 'Pending';
    }

    if (lastBall.isWicket) {
      return 'Wicket';
    }

    if (lastBall.extraType === 'wide') {
      return 'Wide';
    }

    if (lastBall.extraType === 'no-ball') {
      return 'No ball';
    }

    const totalRuns = (lastBall.runsOffBat ?? 0) + (lastBall.extras ?? 0);
    return `${totalRuns} run${totalRuns === 1 ? '' : 's'}`;
  }

  private applyEmptyState() {
    this.socket.disconnect();
    this.stopFallbackResync();
    this.currentDetail = null;
    this.currentSpectators = 0;
    this.currentCommentary = [];
    this.hasLiveMatch = false;
    this.matchId = null;
    this.status = 'Waiting for a live match';
    this.venue = 'Start a live match in the backend to populate this stadium feed.';
    this.currentScore = '0/0';
    this.currentOvers = '0.0 ov';
    this.scoreContext = 'Live innings data will appear here.';
    this.recentOverLabel = 'No over yet';
    this.recentOver = [];
    this.summaryStats = [
      { label: 'Run Rate', value: '0.00' },
      { label: 'Spectators', value: '0' },
      { label: 'Last Event', value: '-' },
    ];
    this.matchFacts = [
      { label: 'Format', value: 'Awaiting live data' },
      { label: 'Status', value: 'Offline' },
      { label: 'Last ball', value: '-' },
    ];
    this.signals = [];
    this.commentary = [];
  }

  private toInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  private toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private bindSocketListeners() {
    this.socketSubscriptions.add(
      this.socket.scoreUpdates$.subscribe(event => {
        this.applyLiveEvent(event);
      }),
    );

    this.socketSubscriptions.add(
      this.socket.resumeState$.subscribe(detail => {
        this.applyResumeState(detail);
      }),
    );

    this.socketSubscriptions.add(
      this.socket.spectatorCount$.subscribe(count => {
        this.currentSpectators = count;
        if (this.currentDetail) {
          this.bindLiveFeed(
            this.currentDetail,
            this.currentSpectators,
            this.currentCommentary,
          );
        }
      }),
    );

    this.socketSubscriptions.add(
      this.socket.connectionState$.subscribe(state => {
        this.socketState = state;
        if (state === 'connected') {
          this.stopFallbackResync();
          return;
        }

        if (
          state === 'connecting'
          || state === 'disconnected'
          || state === 'error'
        ) {
          this.startFallbackResync();
        }
      }),
    );
  }

  private connectLiveSocket(detail: PublicLiveMatchDetail) {
    if (!this.matchId) {
      return;
    }

    void this.socket.connectToMatch(
      this.matchId,
      detail.lastEventId ?? undefined,
    );
  }

  private startFallbackResync() {
    if (!this.matchId || this.fallbackTimerId) {
      return;
    }

    this.fallbackTimerId = setInterval(() => {
      this.refreshCurrentLiveMatch();
    }, 5000);
  }

  private stopFallbackResync() {
    if (!this.fallbackTimerId) {
      return;
    }

    clearInterval(this.fallbackTimerId);
    this.fallbackTimerId = null;
  }

  private refreshCurrentLiveMatch() {
    if (!this.matchId || this.isFallbackSyncing) {
      return;
    }

    this.isFallbackSyncing = true;

    forkJoin({
      detail: this.api.getLiveMatch(this.matchId),
      spectators: this.api.getLiveSpectators(this.matchId),
      commentary: this.api.getCommentary(this.matchId, 10),
    }).pipe(
      finalize(() => {
        this.isFallbackSyncing = false;
      }),
    ).subscribe({
      next: result => {
        this.bindLiveFeed(
          result.detail,
          result.spectators.spectators,
          result.commentary,
        );
        this.connectLiveSocket(result.detail);
      },
      error: err => {
        console.error('Failed to resync live feed', err);
      },
    });
  }

  private applyLiveEvent(event: LiveScoreEvent) {
    if (!this.currentDetail || event.matchId !== this.matchId) {
      return;
    }

    const commentary = event.commentary ?? event.payload?.commentary ?? null;

    if (
      commentary &&
      !this.currentCommentary.some(entry => entry.id === commentary.id)
    ) {
      this.currentCommentary = [
        commentary,
        ...this.currentCommentary,
      ].slice(0, 10);
    }

    const recentEvents = [
      ...(this.currentDetail.recentEvents ?? [])
        .filter(item => item.eventId !== event.eventId),
      event,
    ].slice(-50);

    const detail: PublicLiveMatchDetail = {
      ...this.currentDetail,
      score: event.score ?? event.payload?.score ?? this.currentDetail.score,
      state: event.state ?? event.payload?.state ?? this.currentDetail.state,
      lastBall:
        event.lastBall
        ?? event.payload?.lastBall
        ?? this.currentDetail.lastBall,
      commentary: commentary ?? this.currentDetail.commentary,
      recentEvents,
      lastEventId: event.eventId ?? this.currentDetail.lastEventId,
    };

    this.bindLiveFeed(
      detail,
      this.currentSpectators,
      this.currentCommentary,
    );
  }

  private applyResumeState(detail: PublicLiveMatchDetail) {
    if (!this.currentDetail || detail.matchId !== this.matchId) {
      return;
    }

    this.bindLiveFeed(
      {
        ...this.currentDetail,
        ...detail,
        match: detail.match ?? this.currentDetail.match,
        recentEvents:
          detail.recentEvents ?? this.currentDetail.recentEvents ?? [],
      },
      this.currentSpectators,
      this.currentCommentary,
    );
  }
}
