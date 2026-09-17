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
  /** Which profile this session edits. Every profile is a separate tenant. */
  readonly tenantSlug = this.auth.tenantSlug;
  readonly sidebarOpen = signal(false);

  readonly navItems: readonly AdminNavItem[] = [
    { path: '/client', label: 'Dashboard', icon: 'fas fa-gauge-high' },
    { path: '/client/person', label: 'Profile', icon: 'fas fa-user' },
    { path: '/client/contact', label: 'Contact', icon: 'fas fa-address-card' },
    { path: '/client/experiences', label: 'Experience', icon: 'fas fa-briefcase' },
    { path: '/client/projects', label: 'Projects', icon: 'fas fa-folder-open' },
    { path: '/client/skills', label: 'Skills', icon: 'fas fa-code' },
    { path: '/client/technologies', label: 'Technologies', icon: 'fas fa-microchip' },
    { path: '/client/achievements', label: 'Achievements', icon: 'fas fa-trophy' },
    { path: '/client/courses', label: 'Courses', icon: 'fas fa-graduation-cap' },
    { path: '/client/timeline', label: 'Timeline', icon: 'fas fa-history' },
    { path: '/client/management', label: 'Management', icon: 'fas fa-users-cog' }
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/client/login']);
  }
}
