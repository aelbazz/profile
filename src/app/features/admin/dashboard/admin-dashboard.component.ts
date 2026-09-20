import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, DashboardSummary } from '../../../core/services/admin-api.service';
import { describeApiError } from '../admin-error';

interface StatCard {
  readonly label: string;
  readonly count: number;
  readonly icon: string;
  readonly link: string;
}

/**
 * One aggregated call (GET tenant/dashboard) replaces what used to be eight separate
 * content-count requests. `publicSite.url` comes from the backend (built from
 * FRONTEND_PUBLIC_URL + the tenant's slug) rather than being constructed here - see
 * docs/SAAS-ARCHITECTURE.md §14.
 */
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

  readonly dashboard = signal<DashboardSummary | null>(null);
  readonly loadFailed = signal(false);
  readonly publishBusy = signal(false);
  readonly publishError = signal<string | null>(null);

  readonly stats = signal<StatCard[] | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loadFailed.set(false);
    this.dashboard.set(null);
    this.stats.set(null);

    this.api.getDashboard().subscribe({
      next: data => {
        this.dashboard.set(data);
        this.stats.set([
          { label: 'Experience', count: data.statistics.experience, icon: 'fas fa-briefcase', link: '/client/experiences' },
          { label: 'Projects', count: data.statistics.projects, icon: 'fas fa-folder-open', link: '/client/projects' },
          { label: 'Skills', count: data.statistics.skills, icon: 'fas fa-code', link: '/client/skills' },
          { label: 'Achievements', count: data.statistics.achievements, icon: 'fas fa-trophy', link: '/client/achievements' },
          { label: 'Courses', count: data.statistics.courses, icon: 'fas fa-graduation-cap', link: '/client/courses' },
          { label: 'Timeline events', count: data.statistics.timeline, icon: 'fas fa-history', link: '/client/timeline' },
          { label: 'Management roles', count: data.statistics.management, icon: 'fas fa-users-cog', link: '/client/management' }
        ]);
      },
      error: () => this.loadFailed.set(true)
    });
  }

  togglePublish(): void {
    const current = this.dashboard();
    if (!current || this.publishBusy()) return;

    this.publishBusy.set(true);
    this.publishError.set(null);

    this.api.updatePublishStatus(!current.publicSite.isPublished).subscribe({
      next: status => {
        this.dashboard.update(d => (d ? { ...d, publicSite: { ...d.publicSite, isPublished: status.isPublished } } : d));
        this.publishBusy.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.publishError.set(describeApiError(e));
        this.publishBusy.set(false);
      }
    });
  }
}
