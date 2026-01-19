import { Routes } from '@angular/router';
import { scorerGuard } from './core/guards/scorer.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/profile/login/login.page')
        .then(m => m.LoginPage),
  },
  {
    path: 'scoring',
    canActivate: [scorerGuard],
    loadComponent: () =>
      import('./features/scoring/scoring.page')
        .then(m => m.ScoringPage),
  },
  {
    path: 'live/stadium',
    loadChildren: () =>
      import('./features/live/stadium/stadium.module')
        .then(m => m.StadiumPageModule),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
