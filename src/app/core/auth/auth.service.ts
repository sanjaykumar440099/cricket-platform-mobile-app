import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenStorage } from '../storage/token.storage';
import { Observable, tap } from 'rxjs';
import { decodeJwt, JwtPayload } from './jwt.util';
import { ApiConfigService } from '../api/api-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService,
  ) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiConfig.url('auth/login'), {
      email,
      password,
    })
      .pipe(
        tap(async res => {
          await TokenStorage.setTokens(res.accessToken, res.refreshToken);
        })
      );
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post<any>(this.apiConfig.url('auth/refresh'), {
      refreshToken,
    })
      .pipe(
        tap(async res => {
          await TokenStorage.setTokens(res.accessToken, res.refreshToken);
        })
      );
  }

  logout() {
    TokenStorage.clear();
  }

  getAccessToken(): Promise<string | null> {
    return TokenStorage.getAccess();
  }

  getRefreshToken(): Promise<string | null> {
    return TokenStorage.getRefresh();
  }

  storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    return TokenStorage.setTokens(accessToken, refreshToken);
  }

  async getUserFromToken(): Promise<JwtPayload | null> {
    const token = await TokenStorage.getAccess();
    if (!token) return null;

    try {
      return decodeJwt(token);
    } catch {
      return null;
    }
  }

}
