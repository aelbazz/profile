import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
    title: 'Profile'
  },
  {
    path: 'profile',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'experience',
    loadComponent: () => 
      import('./features/experience/experience.component').then(m => m.ExperienceComponent),
    title: 'Experience'
  },
  {
    path: 'projects',
    loadComponent: () => 
      import('./features/projects/projects.component').then(m => m.ProjectsComponent),
    title: 'Projects'
  },
  {
    path: 'achievements',
    loadComponent: () => 
      import('./features/achievements/achievements.component').then(m => m.AchievementsComponent),
    title: 'Achievements'
  },
  {
    path: 'courses',
    loadComponent: () => 
      import('./features/courses/courses.component').then(m => m.CoursesComponent),
    title: 'Courses & Trainings'
  },
  {
    path: 'skills',
    loadComponent: () => 
      import('./features/skills/skills.component').then(m => m.SkillsComponent),
    title: 'Skills'
  },
  {
    path: 'timeline',
    loadComponent: () =>
      import('./features/timeline/timeline.component').then(m => m.TimelineComponent),
    title: 'Career Timeline'
  },
  {
    path: 'management',
    loadComponent: () =>
      import('./features/management/management.component').then(m => m.ManagementComponent),
    title: 'Management Experience'
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact'
  },
  {
    // Route path is "client" (the person who owns a tenant's content), matching the
    // backend's /api/v1/tenant/* namespace. The component/file names underneath keep
    // saying "admin" internally - that renaming is cosmetic and left for a later pass.
    path: 'client',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
