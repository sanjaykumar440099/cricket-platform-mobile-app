import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthUser } from './auth-user.model';
import { UserRole } from './roles.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  user$ = this.userSubject.asObservable();

  get currentUser() {
    return this.userSubject.value;
  }

  init() {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      this.userSubject.next(JSON.parse(stored));
    }
  }

  loginAs(role: UserRole) {
    const user: AuthUser = {
      id: crypto.randomUUID(),
      name: role.toLowerCase(),
      role,
    };
    localStorage.setItem('auth_user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  logout() {
    localStorage.removeItem('auth_user');
    this.userSubject.next(null);
  }
}
