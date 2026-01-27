import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.page.html',
  imports: [IonicModule, CommonModule, FormsModule],
})
export class LoginPage {
  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) { }

  login() {
    this.auth.login(this.email, this.password).subscribe(async () => {
      const user = await this.auth.getUserFromToken();

      if (!user) return;

      if (user.role === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      } else if (user.role === 'scorer') {
        this.router.navigate(['/matches/assigned']);
      } else {
        this.router.navigate(['/live']);
      }
    });
  }
}
