import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Gate for every /admin route except the login page.
 *
 * This is a UX guard, not a security boundary - it only decides which screen to show.
 * Authorisation is enforced by the API, which rejects every mutation without a valid token
 * regardless of what the browser believes.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/admin/login'], {
    queryParams: { redirect: state.url }
  });
};
