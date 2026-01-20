import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/profile/login/login.page')
        .then(m => m.LoginPage),
  },
  {
    path: 'live/stadium',
    loadChildren: () =>
      import('./features/live/stadium/stadium.module')
        .then(m => m.StadiumPageModule),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
