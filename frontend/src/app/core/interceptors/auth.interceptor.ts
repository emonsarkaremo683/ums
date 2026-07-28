import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, switchMap, throwError, catchError, Subject, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new Subject<string>();

function resetRefreshState(): void {
  isRefreshing = false;
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        if (isRefreshing) {
          return refreshTokenSubject.pipe(
            take(1),
            switchMap((newToken) => {
              const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(newReq);
            }),
          );
        }

        isRefreshing = true;
        return auth.refreshToken().pipe(
          switchMap((res) => {
            resetRefreshState();
            if (res.success) {
              const newToken = res.data.accessToken;
              refreshTokenSubject.next(newToken);
              const newReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
              return next(newReq);
            }
            refreshTokenSubject.error(new Error('Refresh failed'));
            auth.logout();
            return throwError(() => error);
          }),
          catchError((refreshError) => {
            resetRefreshState();
            refreshTokenSubject.error(refreshError);
            auth.logout();
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
