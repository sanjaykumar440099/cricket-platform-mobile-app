import { Preferences } from '@capacitor/preferences';

const ACCESS = 'access_token';
const REFRESH = 'refresh_token';

export class TokenStorage {
  static async setTokens(access: string, refresh: string) {
    await Preferences.set({ key: ACCESS, value: access });
    await Preferences.set({ key: REFRESH, value: refresh });
  }

  static async getAccess() {
    return (await Preferences.get({ key: ACCESS })).value;
  }

  static async getRefresh() {
    return (await Preferences.get({ key: REFRESH })).value;
  }

  static async clear() {
    await Preferences.remove({ key: ACCESS });
    await Preferences.remove({ key: REFRESH });
  }
}
