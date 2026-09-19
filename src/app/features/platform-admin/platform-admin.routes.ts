import { Routes } from '@angular/router';
import { platformAdminGuard } from '../../core/auth';

/**
 * The Portfolio platform's own admin portal (Role.ADMIN only) - tenants, plans, billing,
 * and the marketing site's contact inbox. A sibling to ADMIN_ROUTES (the client portal at
 * /client), not nested under it: they authorize against different roles and call different
 * API namespaces (/admin/* here vs. /tenant/* there).
 */
export const PLATFORM_ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/platform-admin-login.component').then(m => m.PlatformAdminLoginComponent),
    title: 'Platform admin sign in'
  },
  {
    path: '',
    canActivate: [platformAdminGuard],
    loadComponent: () =>
      import('./shell/platform-admin-shell.component').then(m => m.PlatformAdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/platform-admin-dashboard.component').then(
            m => m.PlatformAdminDashboardComponent
          ),
        title: 'Admin · Dashboard'
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./tenants/platform-admin-tenants.component').then(
            m => m.PlatformAdminTenantsComponent
          ),
        title: 'Admin · Tenants'
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./plans/platform-admin-plans.component').then(m => m.PlatformAdminPlansComponent),
        title: 'Admin · Plans'
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/platform-admin-payments.component').then(
            m => m.PlatformAdminPaymentsComponent
          ),
        title: 'Admin · Payments'
      },
      {
        path: 'contact-submissions',
        loadComponent: () =>
          import('./contact-submissions/platform-admin-contact-submissions.component').then(
            m => m.PlatformAdminContactSubmissionsComponent
          ),
        title: 'Admin · Contact Inbox'
      }
    ]
  }
];
