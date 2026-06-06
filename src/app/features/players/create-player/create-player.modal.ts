import { Component, Input } from '@angular/core';
import { finalize } from 'rxjs';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CricketApiService } from '../../../core/api/cricket-api.service';
import { getApiErrorMessage } from '../../../shared/utils/api-error.util';

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
  isSaving = false;
  errorMessage = '';

  constructor(
    private modalCtrl: ModalController,
    private readonly api: CricketApiService,
  ) {}

  create() {
    if (!this.name.trim() || this.isSaving) return;

    this.isSaving = true;
    this.errorMessage = '';

    this.api.createPlayer(
      this.teamId,
      {
        name: this.name.trim(),
        role: this.role.trim() || undefined,
      },
    ).pipe(finalize(() => {
      this.isSaving = false;
    })).subscribe({
      next: res => {
        this.modalCtrl.dismiss(res);
      },
      error: err => {
        this.errorMessage = getApiErrorMessage(
          err,
          'Unable to add the player right now.',
        );
      },
    });
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
