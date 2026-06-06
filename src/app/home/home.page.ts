import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize, of, switchMap } from 'rxjs';
import { CricketApiService } from '../core/api/cricket-api.service';
import {
  PublicLiveMatchDetail,
  SubscriptionPlan,
} from '../shared/models/api.models';

interface PlanCard {
  name: string;
  price: string;
  period: string;
  accent: string;
  description: string;
  features: string[];
}

interface QuickStat {
  label: string;
  value: string;
}

interface LivePreview {
  matchup: string;
  status: string;
  venue: string;
  scoreLine: string;
  overs: string;
  runRate: string;
  oversLimit: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class HomePage implements OnInit {
  readonly pillars = [
    'AI commentary and live summaries',
    'Fast scorer workflow for mobile operators',
    'Free, paid, and enterprise monthly plans',
  ];

  plans: PlanCard[] = [];
  quickStats: QuickStat[] = [];
  preview: LivePreview | null = null;
  isLoadingPlans = false;
  isLoadingPreview = false;
  plansError = '';
  previewError = '';

  private liveMatchCount = 0;
  private freeTierLabel = '3/mo';

  constructor(
    private readonly router: Router,
    private readonly api: CricketApiService,
  ) {
    this.updateQuickStats();
  }

  ngOnInit() {
    this.loadPlans();
    this.loadPreview();
  }

  go(path: string) {
    this.router.navigate([path]);
  }

  private loadPlans() {
    this.isLoadingPlans = true;
    this.plansError = '';

    this.api.getSubscriptionPlans()
      .pipe(finalize(() => {
        this.isLoadingPlans = false;
      }))
      .subscribe({
        next: plans => {
          this.plans = plans.map(plan => this.toPlanCard(plan));
          this.freeTierLabel = this.getFreeTierLabel(plans);
          this.updateQuickStats();
        },
        error: err => {
          console.error('Failed to load plans', err);
          this.plans = [];
          this.plansError = 'Plan details are unavailable right now.';
          this.updateQuickStats();
        },
      });
  }

  private loadPreview() {
    this.isLoadingPreview = true;
    this.previewError = '';

    this.api.getLiveMatches()
      .pipe(
        switchMap(index => {
          this.liveMatchCount = index.total;
          this.updateQuickStats();

          if (!index.matches.length) {
            return of(null);
          }

          return this.api.getLiveMatch(index.matches[0]);
        }),
        finalize(() => {
          this.isLoadingPreview = false;
        }),
      )
      .subscribe({
        next: detail => {
          this.preview = detail ? this.buildPreview(detail) : null;
        },
        error: err => {
          console.error('Failed to load live preview', err);
          this.preview = null;
          this.previewError = 'Live match preview is temporarily unavailable.';
        },
      });
  }

  private toPlanCard(plan: SubscriptionPlan): PlanCard {
    return {
      name: plan.name ?? this.toTitleCase(plan.plan),
      price: this.formatPlanPrice(plan),
      period: plan.interval === 'month' ? '/mo' : '',
      accent: this.planAccent(plan.plan),
      description:
        plan.description
        ?? `${plan.monthlyMatchLimit ?? 'Unlimited'} matches per month`,
      features: plan.features,
    };
  }

  private getFreeTierLabel(plans: SubscriptionPlan[]): string {
    const freePlan = plans.find(plan => plan.plan === 'free');

    if (!freePlan) {
      return '0/mo';
    }

    return freePlan.monthlyMatchLimit === null
      ? 'Unlimited'
      : `${freePlan.monthlyMatchLimit}/mo`;
  }

  private buildPreview(detail: PublicLiveMatchDetail): LivePreview {
    const teamA = detail.match?.teamA?.name ?? 'Team A';
    const teamB = detail.match?.teamB?.name ?? 'Team B';
    const runs = detail.score?.runs ?? detail.state?.totalRuns ?? 0;
    const wickets = detail.score?.wickets ?? detail.state?.wickets ?? 0;
    const overs = detail.score?.overs
      ?? `${detail.state?.completedOvers ?? 0}.${detail.state?.ballsInOver ?? 0}`;
    const runRate = detail.score?.runRate ?? 0;
    const matchStatus = this.toTitleCase(detail.match?.status ?? 'live');
    const oversLimit = detail.match?.oversLimit ?? 20;

    return {
      matchup: `${teamA} vs ${teamB}`,
      status: `${matchStatus} database feed`,
      venue: `${oversLimit}-over match${detail.match?.tournamentId ? ' · Tournament fixture' : ''}`,
      scoreLine: `${runs}/${wickets}`,
      overs: `${overs} ov`,
      runRate: `RR ${runRate.toFixed(2)}`,
      oversLimit: `${oversLimit} overs`,
    };
  }

  private updateQuickStats() {
    this.quickStats = [
      { label: 'Live now', value: `${this.liveMatchCount}` },
      { label: 'Free tier', value: this.freeTierLabel },
      { label: 'Plans', value: `${this.plans.length || 0}` },
    ];
  }

  private planAccent(plan: SubscriptionPlan['plan']): string {
    if (plan === 'premium') {
      return 'gold';
    }

    if (plan === 'enterprise') {
      return 'enterprise';
    }

    if (plan === 'basic') {
      return 'navy';
    }

    return 'soft-green';
  }

  private toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private formatPlanPrice(plan: SubscriptionPlan) {
    if (plan.price === 0) {
      return 'Free';
    }

    const currency = plan.currency ?? 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(plan.price);
  }
}
