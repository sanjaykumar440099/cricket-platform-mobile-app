import {
  HttpInterceptorFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  throwError,
  from,
  Observable,
} from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { TokenStorage } from '../storage/token.storage';

let refreshing = false;
let queue: Array<(token: string | null) => void> = [];

export const refreshInterceptor: HttpInterceptorFn = (
  req,
  next
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      return from(TokenStorage.getRefresh()).pipe(
        switchMap(refreshToken => {
          if (!refreshToken) {
            authService.logout();
            return throwError(() => err);
          }

          if (!refreshing) {
            refreshing = true;

            return authService.refreshToken(refreshToken).pipe(
              switchMap((res: any) => {
                queue.forEach(cb => cb(res.accessToken));
                queue = [];

                const cloned = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${res.accessToken}`,
                  },
                });

                return next(cloned);
              }),
              catchError(refreshErr => {
                authService.logout();
                return throwError(() => refreshErr);
              }),
              finalize(() => {
                refreshing = false;
              })
            );
          }

          return new Observable<HttpEvent<any>>(observer => {
            queue.push(token => {
              const cloned = token
                ? req.clone({
                    setHeaders: { Authorization: `Bearer ${token}` },
                  })
                : req;

              next(cloned).subscribe(observer);
            });
          });
        })
      );
    })
  );
};
