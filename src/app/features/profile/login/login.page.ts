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
  styleUrls: ['./login.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class LoginPage {
  email = '';
  password = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) { }

  login() {
    if (!this.email || !this.password || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.auth.login(this.email, this.password).subscribe({
      next: async () => {
        const user = await this.auth.getUserFromToken();
        this.isSubmitting = false;

        if (!user) {
          this.errorMessage = 'Session created, but user details could not be read.';
          return;
        }

        if (user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else if (user.role === 'scorer') {
          this.router.navigate(['/scorer/matchdesk']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'Login failed. Please check your email and password.';
      },
    });
  }

  go(path: string) {
    this.router.navigate([path]);
  }
}
