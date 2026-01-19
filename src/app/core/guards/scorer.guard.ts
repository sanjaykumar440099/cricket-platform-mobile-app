import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const scorerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.currentUser || auth.currentUser.role === 'VIEWER') {
    router.navigateByUrl('/login');
    return false;
  }
  return true;
};
