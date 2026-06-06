import { Component, Input } from '@angular/core';
import { finalize } from 'rxjs';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CricketApiService } from '../../../core/api/cricket-api.service';
import { getApiErrorMessage } from '../../../shared/utils/api-error.util';

@Component({
    standalone: true,
    selector: 'app-create-team-modal',
    templateUrl: './create-team.modal.html',
    imports: [CommonModule, FormsModule, IonicModule],

})
export class CreateTeamModalComponent {
    @Input() tournamentId!: string;

    name = '';
    shortName = '';
    isSaving = false;
    errorMessage = '';

    constructor(
        private modalCtrl: ModalController,
        private readonly api: CricketApiService,
    ) { }

    create() {
        if (!this.name.trim() || this.isSaving) return;

        this.isSaving = true;
        this.errorMessage = '';

        this.api.createTeam(
            this.tournamentId,
            {
                name: this.name.trim(),
                shortName: this.shortName.trim() || undefined,
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
                    'Unable to create the team right now.',
                );
            },
        });
    }

    close() {
        this.modalCtrl.dismiss();
    }
}
