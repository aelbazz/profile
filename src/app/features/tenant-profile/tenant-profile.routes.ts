import { Routes } from '@angular/router';
import { tenantProfileResolver } from './tenant-profile.resolver';

/**
 * One tenant's public profile, mounted at /:tenantSlug/**. Every child here is the same,
 * unchanged component that used to sit at the application root (/experience, /projects,
 * ...) before every profile became reachable from the same build - only the parenting
 * changed, not the components themselves.
 */
export const TENANT_PROFILE_ROUTES: Routes = [
  {
    path: '',
    resolve: { profileLoaded: tenantProfileResolver },
    loadComponent: () =>
      import('./tenant-profile-shell.component').then(m => m.TenantProfileShellComponent),
    children: [
      {
        // No static title here, deliberately: TenantProfileResolver already sets a
        // tenant-specific title via SeoService before this route activates (e.g. "Ahmed
        // Mohsen Albaz - Professional Portfolio"), and Angular's default title strategy
        // would otherwise overwrite it with a fixed string on every navigation.
        path: '',
        loadComponent: () =>
          import('../profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'experience',
        loadComponent: () =>
          import('../experience/experience.component').then(m => m.ExperienceComponent),
        title: 'Experience'
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('../projects/projects.component').then(m => m.ProjectsComponent),
        title: 'Projects'
      },
      {
        path: 'achievements',
        loadComponent: () =>
          import('../achievements/achievements.component').then(m => m.AchievementsComponent),
        title: 'Achievements'
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('../courses/courses.component').then(m => m.CoursesComponent),
        title: 'Courses & Trainings'
      },
      {
        path: 'skills',
        loadComponent: () => import('../skills/skills.component').then(m => m.SkillsComponent),
        title: 'Skills'
      },
      {
        path: 'timeline',
        loadComponent: () =>
          import('../timeline/timeline.component').then(m => m.TimelineComponent),
        title: 'Career Timeline'
      },
      {
        path: 'management',
        loadComponent: () =>
          import('../management/management.component').then(m => m.ManagementComponent),
        title: 'Management Experience'
      },
      {
        path: 'contact',
        loadComponent: () => import('../contact/contact.component').then(m => m.ContactComponent),
        title: 'Contact'
      }
    ]
  }
];
