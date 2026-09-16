import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../../core/services/admin-api.service';

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
          { label: 'Experience', count: data.experiences.length, icon: 'fas fa-briefcase', link: '/admin/experiences' },
          { label: 'Projects', count: data.projects.length, icon: 'fas fa-folder-open', link: '/admin/projects' },
          { label: 'Skills', count: skillCount, icon: 'fas fa-code', link: '/admin/skills' },
          { label: 'Technologies', count: data.technologies.length, icon: 'fas fa-microchip', link: '/admin/technologies' },
          { label: 'Achievements', count: data.achievements.length, icon: 'fas fa-trophy', link: '/admin/achievements' },
          { label: 'Courses', count: data.courses.length, icon: 'fas fa-graduation-cap', link: '/admin/courses' },
          { label: 'Timeline events', count: data.timeline.length, icon: 'fas fa-history', link: '/admin/timeline' },
          { label: 'Management roles', count: data.management.length, icon: 'fas fa-users-cog', link: '/admin/management' }
        ]);
      },
      error: () => this.loadFailed.set(true)
    });
  }
}
