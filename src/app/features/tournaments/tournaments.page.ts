import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tournaments',
  templateUrl: './tournaments.page.html',
  styleUrls: ['./tournaments.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class TournamentsPage implements OnInit {
  tournaments: any[] = [];
  name = '';
  format: 'T20' | 'ODI' | 'TEST' = 'T20';

  private API = 'http://localhost:3000/api/admin/tournaments';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) { }

  ngOnInit() {
    this.load();
  }

  load() {
    this.http.get<any[]>(this.API).subscribe(res => {
      this.tournaments = res;
    });
  }

  create() {
    this.http.post(this.API, {
      name: this.name,
      format: this.format,
    }).subscribe(() => {
      this.name = '';
      this.format = 'T20';
      this.load();
    });
  }

  open(t: any) {
    this.router.navigate(['/admin/teams', t.id]);
  }
}
