import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { finalize } from 'rxjs';
import { CricketApiService } from '../../../core/api/cricket-api.service';
import { TournamentSummary } from '../../../shared/models/api.models';
import { getApiErrorMessage } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-create-tournament-modal',
  templateUrl: './create-tournament-modal.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class CreateTournamentModalPage implements OnInit {

  @Input() tournament?: TournamentSummary;

  name = '';
  format: 'T20' | 'ODI' | 'TEST' = 'T20';
  isSaving = false;
  errorMessage = '';

  constructor(
    private modalCtrl: ModalController,
    private readonly api: CricketApiService,
  ) { }

  ngOnInit() {
    if (this.tournament) {
      this.name = this.tournament.name;
      this.format = this.tournament.format;
    }
  }

  close() {
    this.modalCtrl.dismiss();
  }

  save() {
    if (this.isSaving) {
      return;
    }

    if (this.tournament) {
      this.update();
    } else {
      this.create();
    }
  }

  /* -------------------- CREATE -------------------- */

  private create() {
    this.isSaving = true;
    this.errorMessage = '';

    this.api.createTournament({
      name: this.name.trim(),
      format: this.format,
    })
      .pipe(finalize(() => {
        this.isSaving = false;
      }))
      .subscribe({
        next: res => {
          this.modalCtrl.dismiss(res);
        },
        error: err => {
          this.errorMessage = getApiErrorMessage(
            err,
            'Unable to save the tournament right now.',
          );
        },
      });
  }

  /* -------------------- UPDATE -------------------- */

  private update() {
    const payload: any = {};
    if (this.name.trim()) payload.name = this.name.trim();
    if (this.format) payload.format = this.format;

    this.isSaving = true;
    this.errorMessage = '';

    this.api.updateTournament(this.tournament!.id, payload)
      .pipe(finalize(() => {
        this.isSaving = false;
      }))
      .subscribe({
        next: res => {
          this.modalCtrl.dismiss(res);
        },
        error: err => {
          this.errorMessage = getApiErrorMessage(
            err,
            'Unable to update the tournament right now.',
          );
        },
      });
  }
}
