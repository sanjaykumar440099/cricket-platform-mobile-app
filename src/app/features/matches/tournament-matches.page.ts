import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize, forkJoin } from 'rxjs';
import { CricketApiService } from '../../core/api/cricket-api.service';
import {
  MatchSummary,
  TeamSummary,
  TournamentSummary,
} from '../../shared/models/api.models';

@Component({
  selector: 'app-tournament-matches',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './tournament-matches.page.html',
  styleUrls: ['./tournament-matches.page.scss'],
})
export class TournamentMatchesPage implements OnInit {
  tournamentId = '';
  tournament: TournamentSummary | null = null;
  teams: TeamSummary[] = [];
  matches: MatchSummary[] = [];

  form = {
    teamAId: '',
    teamBId: '',
    oversLimit: 20,
    startAt: '',
  };

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  saveError = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: CricketApiService,
  ) {}

  ngOnInit() {
    this.tournamentId = this.route.snapshot.paramMap.get('tournamentId') ?? '';
    this.loadScheduler();
  }

  loadScheduler() {
    if (!this.tournamentId) {
      this.errorMessage = 'Tournament id is missing for the scheduler.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      tournaments: this.api.getTournaments(),
      teams: this.api.getTournamentTeams(this.tournamentId),
      matches: this.api.getTournamentMatches(this.tournamentId),
    }).pipe(
      finalize(() => {
        this.isLoading = false;
      }),
    ).subscribe({
      next: ({ tournaments, teams, matches }) => {
        this.tournament =
          tournaments.find(item => item.id === this.tournamentId) ?? null;
        this.teams = teams;
        this.matches = this.sortMatches(matches);
        this.bootstrapForm();
      },
      error: err => {
        console.error('Failed to load scheduler', err);
        this.errorMessage = 'Unable to load teams and matches for this tournament.';
      },
    });
  }

  scheduleMatch() {
    if (!this.canSchedule() || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    this.api.scheduleMatch({
      tournamentId: this.tournamentId,
      teamAId: this.form.teamAId,
      teamBId: this.form.teamBId,
      oversLimit: Number(this.form.oversLimit),
      startTime: new Date(this.form.startAt).toISOString(),
    }).pipe(
      finalize(() => {
        this.isSaving = false;
      }),
    ).subscribe({
      next: () => {
        this.loadScheduler();
      },
      error: err => {
        console.error('Failed to schedule match', err);
        this.saveError = err?.error?.message ?? 'Unable to schedule the match right now.';
      },
    });
  }

  goToScorerDesk() {
    this.router.navigate(['/scorer/matchdesk']);
  }

  goToTeams() {
    this.router.navigate(['/admin/teams', this.tournamentId]);
  }

  canSchedule() {
    return !!this.form.teamAId
      && !!this.form.teamBId
      && this.form.teamAId !== this.form.teamBId
      && !!this.form.startAt
      && Number(this.form.oversLimit) > 0;
  }

  formatMatchTime(match: MatchSummary) {
    if (!match.startTime) {
      return 'Start time not set';
    }

    return this.formatDateTime(match.startTime);
  }

  scoringOpensLabel(match: MatchSummary) {
    if (!match.startTime) {
      return 'Scoring can start anytime';
    }

    const openTime = new Date(
      new Date(match.startTime).getTime() - 60 * 60 * 1000,
    );

    return this.formatDateTime(openTime);
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

  private bootstrapForm() {
    if (this.teams.length >= 2) {
      this.form.teamAId = this.form.teamAId || this.teams[0].id;
      this.form.teamBId =
        this.form.teamBId && this.form.teamBId !== this.form.teamAId
          ? this.form.teamBId
          : (this.teams.find(team => team.id !== this.form.teamAId)?.id ?? '');
    } else {
      this.form.teamAId = '';
      this.form.teamBId = '';
    }

    this.form.oversLimit = this.form.oversLimit || this.defaultOvers();
    this.form.startAt = this.form.startAt || this.defaultStartAt();
  }

  private defaultOvers() {
    if (this.tournament?.format === 'ODI') {
      return 50;
    }

    if (this.tournament?.format === 'TEST') {
      return 90;
    }

    return 20;
  }

  private defaultStartAt() {
    const nextHour = new Date();
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 2);
    const pad = (value: number) => `${value}`.padStart(2, '0');

    return `${nextHour.getFullYear()}-${pad(nextHour.getMonth() + 1)}-${pad(nextHour.getDate())}T${pad(nextHour.getHours())}:${pad(nextHour.getMinutes())}`;
  }

  private sortMatches(matches: MatchSummary[]) {
    return [...matches].sort((left, right) => {
      const leftTime = left.startTime ? new Date(left.startTime).getTime() : 0;
      const rightTime = right.startTime ? new Date(right.startTime).getTime() : 0;
      return leftTime - rightTime;
    });
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
}
