import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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

    private API = 'http://localhost:3000/api/admin/tournaments';

    constructor(
        private modalCtrl: ModalController,
        private http: HttpClient,
    ) { }

    create() {
        if (!this.name) return;

        this.http.post(
            `${this.API}/${this.tournamentId}/teams`,
            {
                name: this.name,
                shortName: this.shortName,
            },
        ).subscribe(res => {
            this.modalCtrl.dismiss(res);
        });
    }

    close() {
        this.modalCtrl.dismiss();
    }
}
