import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-create-tournament-modal',
  templateUrl: './create-tournament-modal.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class CreateTournamentModalPage implements OnInit {

  @Input() tournament?: any;

  name = '';
  format: 'T20' | 'ODI' | 'TEST' = 'T20';

  private API = 'http://localhost:3000/api/admin/tournaments';

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient
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
    if (this.tournament) {
      this.update();
    } else {
      this.create();
    }
  }

  /* -------------------- CREATE -------------------- */

  private create() {
    this.http.post(this.API, {
      name: this.name,
      format: this.format,
    }).subscribe(res => {
      this.modalCtrl.dismiss(res);
    });
  }

  /* -------------------- UPDATE -------------------- */

  private update() {
    const payload: any = {};
    if (this.name) payload.name = this.name;
    if (this.format) payload.format = this.format;
    this.http.patch(
      `${this.API}/${this.tournament!.id}`,
      payload
    ).subscribe(res => {
      this.modalCtrl.dismiss(res);
    });
  }


}
