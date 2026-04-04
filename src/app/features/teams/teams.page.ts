import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { CricketApiService } from '../../core/api/cricket-api.service';
import { TeamSummary } from '../../shared/models/api.models';
import { CreateTeamModalComponent } from './create-teams/create-team.modal';
@Component({
  selector: 'app-teams',
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class TeamsPage implements OnInit {
  tournamentId!: string;
  teams: TeamSummary[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private readonly api: CricketApiService,
    private modalCtrl: ModalController,
    private router: Router
  ) { }

  ngOnInit() {
    this.tournamentId = this.route.snapshot.paramMap.get('id')!;
    this.loadTeams();
  }

  loadTeams() {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.getTournamentTeams(this.tournamentId)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: res => {
          this.teams = res;
        },
        error: err => {
          console.error('Failed to load teams', err);
          this.errorMessage = 'Unable to load teams for this tournament right now.';
        },
      });
  }

  async openCreateTeamModal() {
    const modal = await this.modalCtrl.create({
      component: CreateTeamModalComponent,
      componentProps: {
        tournamentId: this.tournamentId,
      },
    });

    modal.onDidDismiss().then(res => {
      if (res.data) {
        this.loadTeams();
      }
    });

    await modal.present();
  }

  goToPlayers(team: any) {
    this.router.navigate([
      '/admin/teams',
      team.id,
      'players',
    ]);
  }

  goToScheduler() {
    this.router.navigate([
      '/admin/tournaments',
      this.tournamentId,
      'matches',
    ]);
  }

}
