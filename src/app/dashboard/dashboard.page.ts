import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { CricketApiService } from '../core/api/cricket-api.service';
import {
  DashboardSnapshot,
  SubscriptionSummary,
} from '../shared/models/api.models';

interface DashboardStat {
  label: string;
  value: string;
  note: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class DashboardPage implements OnInit {
  stats: DashboardStat[] = [];
  insights: string[] = [];
  isLoading = false;
  errorMessage = '';

  readonly actionCards = [
    {
      title: 'Tournament Desk',
      copy: 'Create tournaments, then drill into teams and players from one workflow.',
      icon: 'trophy-outline',
      route: '/admin/tournaments',
      cta: 'Manage tournaments',
    },
    {
      title: 'Live Centre',
      copy: 'Open the spectator-ready stadium screen and preview your live match presentation.',
      icon: 'radio-outline',
      route: '/live/stadium',
      cta: 'Open live centre',
    },
    {
      title: 'Scorer Access',
      copy: 'Test the scorer sign-in flow and mobile-first match control experience.',
      icon: 'log-in-outline',
      route: '/login',
      cta: 'Go to login',
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly api: CricketApiService,
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  go(path: string) {
    this.router.navigate([path]);
  }

  loadDashboard() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      snapshot: this.api.getDashboardSnapshot(),
      subscription: this.api.getMySubscription().pipe(
        catchError(() => of(null)),
      ),
    }).pipe(
      finalize(() => {
        this.isLoading = false;
      }),
    ).subscribe({
      next: ({ snapshot, subscription }) => {
        this.stats = this.buildStats(snapshot, subscription);
        this.insights = this.buildInsights(snapshot, subscription);
      },
      error: err => {
        console.error('Failed to load dashboard', err);
        this.stats = [];
        this.insights = [];
        this.errorMessage = 'Dashboard data could not be loaded from the API.';
      },
    });
  }

  private buildStats(
    snapshot: DashboardSnapshot,
    subscription: SubscriptionSummary | null,
  ): DashboardStat[] {
    const currentPlan = subscription?.plan
      ? this.toTitleCase(subscription.plan)
      : 'Free';
    const planNote = subscription?.currentPeriodEnd
      ? `Active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
      : 'Self-serve free plan';

    return [
      {
        label: 'Active Tournaments',
        value: `${snapshot.tournaments.length}`,
        note: `${snapshot.totalTeams} teams configured across your tournaments`,
      },
      {
        label: 'Live Matches',
        value: `${snapshot.liveMatches.total}`,
        note: `${snapshot.totalMatches} total matches stored in the platform`,
      },
      {
        label: 'Current Plan',
        value: currentPlan,
        note: planNote,
      },
    ];
  }

  private buildInsights(
    snapshot: DashboardSnapshot,
    subscription: SubscriptionSummary | null,
  ): string[] {
    const insights: string[] = [];

    if (snapshot.tournaments.length === 0) {
      insights.push('Create your first tournament to unlock the teams and players workflow.');
    } else {
      insights.push(`${snapshot.tournaments.length} tournaments are ready for ops, with ${snapshot.totalTeams} total teams linked.`);
    }

    if (snapshot.liveMatches.total === 0) {
      insights.push('No match is live right now, so the stadium screen will stay in its ready-state until scoring starts.');
    } else {
      insights.push(`${snapshot.liveMatches.total} live match feed${snapshot.liveMatches.total > 1 ? 's are' : ' is'} currently available on the public API.`);
    }

    insights.push(`The current admin account is on the ${this.toTitleCase(subscription?.plan ?? 'free')} plan.`);

    return insights;
  }

  private toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
