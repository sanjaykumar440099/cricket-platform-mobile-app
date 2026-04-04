import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { IonicModule, ModalController } from '@ionic/angular';
import { CreatePlayerModalComponent } from './create-player/create-player.modal';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CricketApiService } from '../../core/api/cricket-api.service';
import { PlayerSummary } from '../../shared/models/api.models';

@Component({
  selector: 'app-players',
  templateUrl: './players.page.html',
  styleUrls: ['./players.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class PlayersPage implements OnInit {
  teamId!: string;
  players: PlayerSummary[] = [];
  isLoading = false;
  errorMessage = '';
  deletingPlayerId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private readonly api: CricketApiService,
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {
    this.teamId = this.route.snapshot.paramMap.get('teamId')!;
    this.loadPlayers();
  }

  loadPlayers() {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.getTeamPlayers(this.teamId)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: res => {
          this.players = res;
        },
        error: err => {
          console.error('Failed to load players', err);
          this.errorMessage = 'Unable to load players for this team right now.';
        },
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
    this.deletingPlayerId = playerId;

    this.api.deletePlayer(playerId)
      .pipe(finalize(() => {
        this.deletingPlayerId = null;
      }))
      .subscribe({
        next: () => {
          this.loadPlayers();
        },
        error: err => {
          console.error('Delete failed', err);
          this.errorMessage = 'Unable to delete the player right now.';
        },
      });
  }

}
