import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  teams: any[] = [];

  private API = 'http://localhost:3000/api/admin/tournaments';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private modalCtrl: ModalController,
    private router: Router
  ) { }

  ngOnInit() {
    this.tournamentId = this.route.snapshot.paramMap.get('id')!;
    this.loadTeams();
  }

  loadTeams() {
    this.http
      .get<any[]>(`${this.API}/${this.tournamentId}/teams`)
      .subscribe(res => {
        this.teams = res;
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

}
