import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth';

interface AdminNavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly displayName = computed(() => this.user()?.name || this.user()?.email || 'Administrator');
  readonly sidebarOpen = signal(false);

  readonly navItems: readonly AdminNavItem[] = [
    { path: '/admin', label: 'Dashboard', icon: 'fas fa-gauge-high' },
    { path: '/admin/person', label: 'Profile', icon: 'fas fa-user' },
    { path: '/admin/contact', label: 'Contact', icon: 'fas fa-address-card' },
    { path: '/admin/experiences', label: 'Experience', icon: 'fas fa-briefcase' },
    { path: '/admin/projects', label: 'Projects', icon: 'fas fa-folder-open' },
    { path: '/admin/skills', label: 'Skills', icon: 'fas fa-code' },
    { path: '/admin/technologies', label: 'Technologies', icon: 'fas fa-microchip' },
    { path: '/admin/achievements', label: 'Achievements', icon: 'fas fa-trophy' },
    { path: '/admin/courses', label: 'Courses', icon: 'fas fa-graduation-cap' },
    { path: '/admin/timeline', label: 'Timeline', icon: 'fas fa-history' },
    { path: '/admin/management', label: 'Management', icon: 'fas fa-users-cog' }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }
}
