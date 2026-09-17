import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AuthService } from '../../../core/auth';

interface StatCard {
  readonly label: string;
  readonly count: number;
  readonly icon: string;
  readonly link: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {
  private readonly api = inject(AdminApiService);
  private readonly auth = inject(AuthService);

  readonly tenantSlug = this.auth.tenantSlug;

  readonly stats = signal<StatCard[] | null>(null);
  readonly loadFailed = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loadFailed.set(false);
    this.stats.set(null);

    forkJoin({
      experiences: this.api.getExperiences(),
      projects: this.api.getProjects(),
      technologies: this.api.getTechnologies(),
      achievements: this.api.getAchievements(),
      courses: this.api.getCourses(),
      timeline: this.api.getTimelineEvents(),
      management: this.api.getManagementRoles(),
      skills: this.api.getSkillCategories()
    }).subscribe({
      next: data => {
        const skillCount = data.skills.reduce((total, c) => total + c.skills.length, 0);
        this.stats.set([
          { label: 'Experience', count: data.experiences.length, icon: 'fas fa-briefcase', link: '/client/experiences' },
          { label: 'Projects', count: data.projects.length, icon: 'fas fa-folder-open', link: '/client/projects' },
          { label: 'Skills', count: skillCount, icon: 'fas fa-code', link: '/client/skills' },
          { label: 'Technologies', count: data.technologies.length, icon: 'fas fa-microchip', link: '/client/technologies' },
          { label: 'Achievements', count: data.achievements.length, icon: 'fas fa-trophy', link: '/client/achievements' },
          { label: 'Courses', count: data.courses.length, icon: 'fas fa-graduation-cap', link: '/client/courses' },
          { label: 'Timeline events', count: data.timeline.length, icon: 'fas fa-history', link: '/client/timeline' },
          { label: 'Management roles', count: data.management.length, icon: 'fas fa-users-cog', link: '/client/management' }
        ]);
      },
      error: () => this.loadFailed.set(true)
    });
  }
}
