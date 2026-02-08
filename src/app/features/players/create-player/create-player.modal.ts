import { Component, Input } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-create-player-modal',
  templateUrl: './create-player.modal.html',
    imports: [CommonModule, FormsModule, IonicModule]
})
export class CreatePlayerModalComponent {

  @Input() teamId!: string;

  name = '';
  role = '';

  private API = 'http://localhost:3000/api/admin';

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
  ) {}

  create() {
    if (!this.name) return;

    this.http.post(
      `${this.API}/teams/${this.teamId}/players`,
      {
        name: this.name,
        role: this.role,
      },
    ).subscribe(res => {
      this.modalCtrl.dismiss(res);
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
