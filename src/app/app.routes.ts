import { Routes } from '@angular/router';

// Route order matters: the Router matches these top-to-bottom, not by specificity. Every
// literal path (the four marketing routes, 'profile', 'client', 'admin') must be registered
// before the ':tenantSlug' param route, or a marketing route would be swallowed as a tenant
// slug.
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/marketing/home/marketing-home.component').then(
        m => m.MarketingHomeComponent
      ),
    title: 'Portfolio'
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/marketing/about/marketing-about.component').then(
        m => m.MarketingAboutComponent
      ),
    title: 'About — Portfolio'
  },
  {
    path: 'services',
    loadComponent: () =>
      import('./features/marketing/services/marketing-services.component').then(
        m => m.MarketingServicesComponent
      ),
    title: 'Services — Portfolio'
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/marketing/contact/marketing-contact.component').then(
        m => m.MarketingContactComponent
      ),
    title: 'Contact — Portfolio'
  },
  {
    // Legacy redirect: this repo's very first single-tenant build used /profile for its one
    // tenant's home page. /albaz is that same tenant now that every profile is reachable at
    // its own slug - see docs/SAAS-ARCHITECTURE.md.
    path: 'profile',
    redirectTo: '/albaz',
    pathMatch: 'full'
  },
  {
    // Route path is "client" (the person who owns a tenant's content), matching the
    // backend's /api/v1/tenant/* namespace. The component/file names underneath keep
    // saying "admin" internally - that renaming is cosmetic and left for a later pass.
    path: 'client',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    // The Portfolio platform's own admin portal (Role.ADMIN) - tenants, plans, billing,
    // contact inbox. A sibling of 'client', not nested under it - see
    // features/platform-admin/platform-admin.routes.ts.
    path: 'admin',
    loadChildren: () =>
      import('./features/platform-admin/platform-admin.routes').then(
        m => m.PLATFORM_ADMIN_ROUTES
      )
  },
  {
    // Every tenant's public profile, resolved at runtime from this segment - see
    // TenantProfileResolver. Must stay last among non-wildcard routes: anything not matched
    // above (an actual tenant slug, or a typo) falls through to here.
    path: ':tenantSlug',
    loadChildren: () =>
      import('./features/tenant-profile/tenant-profile.routes').then(
        m => m.TENANT_PROFILE_ROUTES
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];
