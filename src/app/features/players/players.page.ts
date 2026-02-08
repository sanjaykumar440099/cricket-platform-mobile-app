import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CreatePlayerModalComponent } from './create-player/create-player.modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-players',
  templateUrl: './players.page.html',
  styleUrls: ['./players.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class PlayersPage implements OnInit {

  teamId!: string;
  players: any[] = [];

  private API = 'http://localhost:3000/api/admin';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {
    this.teamId = this.route.snapshot.paramMap.get('teamId')!;
    this.loadPlayers();
  }

  loadPlayers() {
    this.http
      .get<any[]>(`${this.API}/teams/${this.teamId}/players`)
      .subscribe(res => {
        this.players = res;
      });
  }

  async openCreatePlayerModal() {
    const modal = await this.modalCtrl.create({
      component: CreatePlayerModalComponent,
      componentProps: {
        teamId: this.teamId,
      },
    });

    modal.onDidDismiss().then(res => {
      if (res.data) {
        this.loadPlayers();
      }
    });

    await modal.present();
  }

  deletePlayer(playerId: string) {
    this.http
      .delete(`${this.API}/players/${playerId}`)
      .subscribe(() => {
        this.loadPlayers();
      });
  }

}
