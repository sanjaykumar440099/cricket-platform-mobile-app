import { Component } from '@angular/core';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonItem, IonIcon, IonRouterOutlet, IonToggle, IonHeader, IonToolbar, IonLabel, IonTitle } from '@ionic/angular/standalone';
import { AuthService } from './core/auth/auth.service';
import { Preferences } from '@capacitor/preferences';
import { ThemeService } from './core/theme/theme.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonRouterOutlet, IonToggle, IonHeader, IonToolbar, IonLabel, IonTitle],
})
export class AppComponent {
  constructor(private auth: AuthService, public theme: ThemeService) {
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
