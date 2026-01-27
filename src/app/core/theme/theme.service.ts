import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  async setDark() {
    document.body.classList.add('dark');
    await Preferences.set({ key: 'theme', value: 'dark' });
  }

  async setLight() {
    document.body.classList.remove('dark');
    await Preferences.set({ key: 'theme', value: 'light' });
  }

  isDark(): boolean {
    return document.body.classList.contains('dark');
  }
}
