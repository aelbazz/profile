import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Attaches the admin bearer token to API requests, and ends the session on a 401.
 *
 * The token is only ever sent to environment.apiBaseUrl. Without that check, any third
 * party URL the app happened to request would receive the admin credential.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token;
  const isApiRequest = req.url.startsWith(environment.apiBaseUrl);

  const request =
    token && isApiRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // A 401 on an API call means the token expired or was revoked. Anything else - a
      // failed public read, a validation error - must not log the admin out.
      if (error.status === 401 && isApiRequest && token) {
        auth.logout();
        void router.navigate(['/admin/login'], {
          queryParams: { reason: 'expired', redirect: router.url }
        });
      }
      return throwError(() => error);
    })
  );
};
