import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Gate for every /admin route except the login page.
 *
 * Unlike authGuard (client portal - any authenticated session may pass, since only CLIENT
 * accounts are ever meant to sign in there), this checks the role itself: the platform-admin
 * portal calls endpoints only Role.ADMIN can reach, so a CLIENT or COORDINATOR session must
 * not be shown these screens only to have every request 403. Still a UX guard, not a
 * security boundary - the API enforces the role check regardless of what the browser shows.
 */
export const platformAdminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated() && auth.user()?.role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/admin/login'], {
    queryParams: { redirect: state.url }
  });
};
