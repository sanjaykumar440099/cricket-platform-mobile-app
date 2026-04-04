import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CricketApiService } from '../../../core/api/cricket-api.service';
import {
  CommentaryEntry,
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
export class StadiumPage implements OnInit {
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

  constructor(
    public auth: AuthService,
    private readonly api: CricketApiService,
  ) {}

  ngOnInit() {
    this.loadLiveFeed();
  }

  ballClass(kind: string) {
    return `ball-${kind}`;
  }

  reload() {
    this.loadLiveFeed();
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
        },
        error: err => {
          console.error('Failed to load live feed', err);
          this.applyEmptyState();
          this.errorMessage = 'Unable to load the live feed from the API right now.';
        },
      });
  }

  private bindLiveFeed(
    detail: PublicLiveMatchDetail,
    spectators: number,
    commentaryFeed: CommentaryEntry[],
  ) {
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
}
