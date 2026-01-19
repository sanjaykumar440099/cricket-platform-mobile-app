import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../core/auth/auth.service';

interface Team {
  id: string;
  name: string;
  short: string;
  score: string;
  logo?: string;
}

@Component({
  selector: 'app-stadium',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './stadium.page.html',
  styleUrls: ['./stadium.page.scss'],
})
export class StadiumPage {
  home: Team = { id: '1', name: 'Home XI', short: 'HOM', score: '155/8 (20)' };
  away: Team = { id: '2', name: 'Away Squad', short: 'AWY', score: '150/9 (20)' };
  status = 'LIVE — 2 balls left';
  venue = 'Stadium • Day 1';
  highlights = [
    { id: 'p1', name: 'A. Sharma', stat: '32', img: '' },
    { id: 'p2', name: 'R. Singh', stat: '28', img: '' },
  ];

  constructor(public auth: AuthService) {}
}
