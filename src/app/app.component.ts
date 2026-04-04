import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonItem, IonIcon, IonRouterOutlet, IonToggle, IonLabel, IonMenuToggle } from '@ionic/angular/standalone';
import { Preferences } from '@capacitor/preferences';
import { ThemeService } from './core/theme/theme.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule,
    RouterLink,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonRouterOutlet,
    IonToggle,
    IonLabel,
    IonMenuToggle],
})
export class AppComponent {
  readonly navItems = [
    {
      label: 'Home',
      note: 'Overview, plans, and live product preview.',
      icon: 'home-outline',
      route: '/home',
    },
    {
      label: 'Admin Dashboard',
      note: 'Quick launchpad for tournaments and ops.',
      icon: 'grid-outline',
      route: '/admin/dashboard',
    },
    {
      label: 'Tournaments',
      note: 'Create tournaments and enter the team workflow.',
      icon: 'trophy-outline',
      route: '/admin/tournaments',
    },
    {
      label: 'Live Centre',
      note: 'Preview the stadium-style live match screen.',
      icon: 'radio-outline',
      route: '/live/stadium',
    },
    {
      label: 'Login',
      note: 'Admin and scorer sign-in for backend actions.',
      icon: 'log-in-outline',
      route: '/login',
    },
  ];

  constructor(public theme: ThemeService) {
    this.loadTheme();
  }

  async loadTheme() {
    const { value } = await Preferences.get({ key: 'theme' });
    if (value === 'dark') {
      document.body.classList.add('dark');
    }
  }

  toggleTheme(ev: any) {
    ev.detail.checked
      ? this.theme.setDark()
      : this.theme.setLight();
  }
}
