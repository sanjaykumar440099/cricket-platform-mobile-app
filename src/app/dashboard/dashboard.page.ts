import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { CricketApiService } from '../core/api/cricket-api.service';
import {
  DashboardSnapshot,
  MatchSummary,
  SubscriptionPlan,
  SubscriptionSummary,
} from '../shared/models/api.models';

interface DashboardStat {
  label: string;
  value: string;
  note: string;
}

interface DashboardFixture {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  statusTone: 'scheduled' | 'live' | 'completed';
  startLabel: string;
  scoringWindowLabel: string;
  countdownLabel: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class DashboardPage implements OnInit, OnDestroy {
  stats: DashboardStat[] = [];
  insights: string[] = [];
  todayMatches: DashboardFixture[] = [];
  upcomingMatch: DashboardFixture | null = null;
  plans: SubscriptionPlan[] = [];
  subscription: SubscriptionSummary | null = null;
  isLoading = false;
  isUpdatingPlan = false;
  errorMessage = '';
  billingMessage = '';
  billingError = '';

  private matches: MatchSummary[] = [];
  private countdownTimerId: ReturnType<typeof setInterval> | null = null;

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
      copy: 'Open the live scorer matchdesk with innings setup, ball entry, and result control.',
      icon: 'flash-outline',
      route: '/scorer/matchdesk',
      cta: 'Open scorer desk',
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly api: CricketApiService,
  ) {}

  ngOnInit() {
    this.loadDashboard();
    this.startCountdownTicker();
  }

  ngOnDestroy() {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
    }
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
      plans: this.api.getSubscriptionPlans().pipe(
        catchError(() => of([])),
      ),
      matches: this.api.getMatches().pipe(
        catchError(() => of([])),
      ),
    }).pipe(
      finalize(() => {
        this.isLoading = false;
      }),
    ).subscribe({
      next: ({ snapshot, subscription, plans, matches }) => {
        this.subscription = subscription;
        this.plans = plans;
        this.stats = this.buildStats(snapshot, subscription);
        this.insights = this.buildInsights(snapshot, subscription);
        this.matches = matches;
        this.refreshMatchHighlights();
      },
      error: err => {
        console.error('Failed to load dashboard', err);
        this.stats = [];
        this.insights = [];
        this.plans = [];
        this.subscription = null;
        this.todayMatches = [];
        this.upcomingMatch = null;
        this.errorMessage = 'Dashboard data could not be loaded from the API.';
      },
    });
  }

  openScorerDesk() {
    this.router.navigate(['/scorer/matchdesk']);
  }

  checkoutPlan(plan: SubscriptionPlan) {
    if (this.isUpdatingPlan || this.isCurrentPlan(plan)) {
      return;
    }

    this.isUpdatingPlan = true;
    this.billingMessage = '';
    this.billingError = '';

    this.api.checkoutMonthlyPlan(plan.plan)
      .pipe(finalize(() => {
        this.isUpdatingPlan = false;
      }))
      .subscribe({
        next: result => {
          this.subscription = result.subscription;
          this.billingMessage =
            `${plan.name ?? this.toTitleCase(plan.plan)} monthly billing is active.`;
          this.loadDashboard();
        },
        error: err => {
          console.error('Failed to update subscription', err);
          this.billingError =
            err?.error?.message ?? 'Unable to update the monthly plan.';
        },
      });
  }

  cancelPlan() {
    if (this.isUpdatingPlan || !this.subscription) {
      return;
    }

    this.isUpdatingPlan = true;
    this.billingMessage = '';
    this.billingError = '';

    this.api.cancelSubscription()
      .pipe(finalize(() => {
        this.isUpdatingPlan = false;
      }))
      .subscribe({
        next: subscription => {
          this.subscription = subscription;
          this.billingMessage = subscription.cancelAtPeriodEnd
            ? 'Plan will cancel at the end of the current billing period.'
            : 'Subscription has been cancelled.';
          this.loadDashboard();
        },
        error: err => {
          console.error('Failed to cancel subscription', err);
          this.billingError =
            err?.error?.message ?? 'Unable to cancel the subscription.';
        },
      });
  }

  isCurrentPlan(plan: SubscriptionPlan) {
    return this.subscription?.plan === plan.plan
      && this.subscription?.status === 'active';
  }

  planPrice(plan: SubscriptionPlan) {
    if (plan.price === 0) {
      return 'Free';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: plan.currency ?? 'USD',
      maximumFractionDigits: 0,
    }).format(plan.price);
  }

  planLimit(plan: SubscriptionPlan) {
    if (plan.monthlyMatchLimit === null) {
      return 'Unlimited matches';
    }

    return `${plan.monthlyMatchLimit} matches/month`;
  }

  private buildStats(
    snapshot: DashboardSnapshot,
    subscription: SubscriptionSummary | null,
  ): DashboardStat[] {
    const currentPlan = subscription?.plan
      ? this.toTitleCase(subscription.plan)
      : 'Free';
    const planNote = subscription?.currentPeriodEnd
      ? subscription.cancelAtPeriodEnd
        ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
        : `Active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
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

  private startCountdownTicker() {
    this.countdownTimerId = setInterval(() => {
      this.refreshMatchHighlights();
    }, 60_000);
  }

  private refreshMatchHighlights() {
    const now = new Date();

    this.todayMatches = this.matches
      .filter(match => this.isToday(match.startTime, now))
      .sort((left, right) => this.sortByStartTime(left, right))
      .map(match => this.toFixture(match, now));

    this.upcomingMatch = this.matches
      .filter(match => this.isUpcoming(match.startTime, now))
      .sort((left, right) => this.sortByStartTime(left, right))[0]
      ? this.toFixture(
          this.matches
            .filter(match => this.isUpcoming(match.startTime, now))
            .sort((left, right) => this.sortByStartTime(left, right))[0],
          now,
        )
      : null;
  }

  private toFixture(match: MatchSummary, now: Date): DashboardFixture {
    const start = match.startTime ? new Date(match.startTime) : null;
    const scoringWindow = start
      ? new Date(start.getTime() - 60 * 60 * 1000)
      : null;

    return {
      id: match.id,
      title: `${match.teamA?.name || 'Team A'} vs ${match.teamB?.name || 'Team B'}`,
      subtitle: `${this.teamShort(match)} · ${match.oversLimit} overs`,
      status: this.toTitleCase(match.status),
      statusTone: match.status,
      startLabel: start ? this.formatDateTime(start) : 'Start time not set',
      scoringWindowLabel: scoringWindow
        ? `Scoring opens ${this.formatDateTime(scoringWindow)}`
        : 'Scoring can start anytime',
      countdownLabel: this.countdownForMatch(match, now),
    };
  }

  private countdownForMatch(match: MatchSummary, now: Date) {
    if (!match.startTime) {
      return 'No countdown available';
    }

    const start = new Date(match.startTime);
    const diffMs = start.getTime() - now.getTime();

    if (match.status === 'live') {
      return 'Live now';
    }

    if (match.status === 'completed') {
      return 'Completed';
    }

    if (diffMs <= 0) {
      return 'Scheduled time reached';
    }

    const totalMinutes = Math.floor(diffMs / 60_000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `Starts in ${days}d ${hours}h`;
    }

    if (hours > 0) {
      return `Starts in ${hours}h ${minutes}m`;
    }

    return `Starts in ${minutes}m`;
  }

  private teamShort(match: MatchSummary) {
    const teamAShort = match.teamA?.shortName
      ?? this.toInitials(match.teamA?.name ?? 'Team A');
    const teamBShort = match.teamB?.shortName
      ?? this.toInitials(match.teamB?.name ?? 'Team B');

    return `${teamAShort} vs ${teamBShort}`;
  }

  private toInitials(value: string) {
    return value
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  }

  private isToday(startTime: string | null | undefined, now: Date) {
    if (!startTime) {
      return false;
    }

    const start = new Date(startTime);

    return start.getFullYear() === now.getFullYear()
      && start.getMonth() === now.getMonth()
      && start.getDate() === now.getDate();
  }

  private isUpcoming(startTime: string | null | undefined, now: Date) {
    if (!startTime) {
      return false;
    }

    return new Date(startTime).getTime() > now.getTime();
  }

  private sortByStartTime(left: MatchSummary, right: MatchSummary) {
    const leftTime = left.startTime ? new Date(left.startTime).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.startTime ? new Date(right.startTime).getTime() : Number.MAX_SAFE_INTEGER;

    return leftTime - rightTime;
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

  private toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
