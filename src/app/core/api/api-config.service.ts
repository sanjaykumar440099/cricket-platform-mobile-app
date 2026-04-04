import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/$/, '');
  readonly socketUrl = environment.socketUrl.replace(/\/$/, '');

  url(path: string): string {
    return `${this.apiBaseUrl}/${path.replace(/^\/+/, '')}`;
  }
}
