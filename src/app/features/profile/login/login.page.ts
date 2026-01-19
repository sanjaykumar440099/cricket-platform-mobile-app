import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [IonicModule],
  templateUrl: './login.page.html',
})
export class LoginPage {
  constructor(private auth: AuthService, private router: Router) {}

  login(role: 'ADMIN' | 'SCORER' | 'VIEWER') {
    this.auth.loginAs(role);
    this.router.navigateByUrl('/scoring');
  }
}
