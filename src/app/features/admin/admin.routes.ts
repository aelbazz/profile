import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth';

/**
 * Admin area. Everything except the login page sits behind authGuard, which only decides
 * which screen to show - the API is what actually enforces authorisation.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/admin-login.component').then(m => m.AdminLoginComponent),
    title: 'Admin sign in'
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Admin dashboard'
      },
      {
        path: 'person',
        loadComponent: () =>
          import('./person/admin-person.component').then(m => m.AdminPersonComponent),
        title: 'Admin · Profile'
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./contact/admin-contact.component').then(m => m.AdminContactComponent),
        title: 'Admin · Contact'
      },
      {
        path: 'experiences',
        loadComponent: () =>
          import('./experiences/admin-experiences.component').then(m => m.AdminExperiencesComponent),
        title: 'Admin · Experience'
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./projects/admin-projects.component').then(m => m.AdminProjectsComponent),
        title: 'Admin · Projects'
      },
      {
        path: 'skills',
        loadComponent: () =>
          import('./skills/admin-skills.component').then(m => m.AdminSkillsComponent),
        title: 'Admin · Skills'
      },
      {
        path: 'technologies',
        loadComponent: () =>
          import('./technologies/admin-technologies.component').then(
            m => m.AdminTechnologiesComponent
          ),
        title: 'Admin · Technologies'
      },
      // These four share one config-driven component; `entity` selects the config.
      {
        path: 'achievements',
        loadComponent: () =>
          import('./simple-list/admin-entity.component').then(m => m.AdminEntityComponent),
        data: { entity: 'achievements' },
        title: 'Admin · Achievements'
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./simple-list/admin-entity.component').then(m => m.AdminEntityComponent),
        data: { entity: 'courses' },
        title: 'Admin · Courses'
      },
      {
        path: 'timeline',
        loadComponent: () =>
          import('./simple-list/admin-entity.component').then(m => m.AdminEntityComponent),
        data: { entity: 'timeline' },
        title: 'Admin · Timeline'
      },
      {
        path: 'management',
        loadComponent: () =>
          import('./simple-list/admin-entity.component').then(m => m.AdminEntityComponent),
        data: { entity: 'management' },
        title: 'Admin · Management'
      }
    ]
  }
];
