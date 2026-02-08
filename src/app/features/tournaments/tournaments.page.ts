import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CreateTournamentModalPage } from './create-tournament-modal/create-tournament-modal.page';

@Component({
  selector: 'app-tournaments',
  templateUrl: './tournaments.page.html',
  styleUrls: ['./tournaments.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class TournamentsPage implements OnInit {

  tournaments: any[] = [];
  private API = 'http://localhost:3000/api/admin/tournaments';

  constructor(
    private http: HttpClient,
    private router: Router,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.load();
  }

  /* -------------------- LOAD -------------------- */

  load() {
    this.http.get<any[]>(this.API).subscribe({
      next: res => this.tournaments = res,
      error: err => console.error('Failed to load tournaments', err)
    });
  }

  /* -------------------- OPEN -------------------- */

  open(t: any) {
    this.router.navigate(['/admin/teams', t.id]);
  }

  /* -------------------- CREATE -------------------- */

  async openCreateModal() {
    const modal = await this.modalCtrl.create({
      component: CreateTournamentModalPage,
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.5
    });

    modal.onDidDismiss().then(res => {
      if (res.data) {
        this.load(); // reload after create
      }
    });

    await modal.present();
  }

  /* -------------------- EDIT -------------------- */

  async edit(tournament: any) {
    const modal = await this.modalCtrl.create({
      component: CreateTournamentModalPage,
      componentProps: { tournament },
      breakpoints: [0, 0.5, 0.9],
      initialBreakpoint: 0.5
    });

    modal.onDidDismiss().then(res => {
      if (res.data) {
        this.load();
      }
    });

    await modal.present();
  }

  /* -------------------- DELETE -------------------- */

  async confirmDelete(tournament: any) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Tournament',
      message: `Are you sure you want to delete <b>${tournament.name}</b>?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.deleteTournament(tournament.id)
        }
      ]
    });

    await alert.present();
  }

  deleteTournament(id: string) {
    this.http.delete(`${this.API}/${id}`).subscribe({
      next: () => {
        this.tournaments = this.tournaments.filter(t => t.id !== id);
        this.load();
      },
      error: err => console.error('Delete failed', err)
    });
  }

  // got to teams page
  goToTeams(tournament: any) {
    this.router.navigate([
      '/admin/teams',
      tournament.id,
    ]);
  }
}
