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
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'admin/tournaments',
    loadComponent: () => import('./features/tournaments/tournaments.page').then( m => m.TournamentsPage)
  },
  {
    path: 'admin/teams/:id',
    loadComponent: () => import('./features/teams/teams.page').then( m => m.TeamsPage)
  },
  {
    path: 'admin/teams/:teamId/players',
    loadComponent: () => import('./features/players/players.page').then( m => m.PlayersPage)
  },
];
