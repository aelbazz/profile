import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs';
import { ConfigDataService } from '../../core/services/config-data.service';
import { SeoService } from '../../core/services/seo.service';

/**
 * Loads the tenant named by the :tenantSlug route param before the tenant-profile route
 * tree activates, and redirects to the canonical slug if the backend reports a rename.
 *
 * Resolving here rather than in each section component's ngOnInit gets two things for
 * free from the Router: an in-flight request is cancelled automatically if a newer
 * navigation supersedes it (no race between two tenants' HTTP responses - whichever
 * resolves last no longer wins), and the previously-rendered page stays mounted until the
 * new tenant's data is ready, so there is no flash of an empty/loading state mid-navigation.
 *
 * Always resolves true: a failed load is a data problem the section components' own error
 * state already renders (ConfigDataService.hasFailed), not a reason to block navigation.
 */
export const tenantProfileResolver: ResolveFn<boolean> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const configData = inject(ConfigDataService);
  const seo = inject(SeoService);
  const router = inject(Router);

  const slug = route.paramMap.get('tenantSlug');
  if (!slug) {
    return true;
  }

  return configData.loadProfile$(slug).pipe(
    map(result => {
      if (result.redirectSlug) {
        const remainder = state.url.split('/').slice(2);
        void router.navigate(['/', result.redirectSlug, ...remainder], { replaceUrl: true });
      }

      const profile = configData.profile();
      if (profile) {
        seo.setTenantSeo(profile.name, profile.summary);
      }

      return true;
    })
  );
};
