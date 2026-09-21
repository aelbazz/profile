import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ThemeMode, ThemeService } from '../../../core/services/theme.service';

interface PlatformAdminNavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

/**
 * Chrome for the platform-admin portal (/admin/*) - a sibling to AdminShellComponent (the
 * client portal, /client/*), not a variant of it. Kept as its own component with its own
 * template/styles rather than a shared one with conditional branches: the nav items, the
 * "who am I" display, and eventually the permitted actions differ enough between a tenant
 * owner and a platform administrator that a shared component would mostly be `@if`s.
 */
@Component({
  selector: 'app-platform-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './platform-admin-shell.component.html',
  styleUrl: './platform-admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformAdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly api = inject(AdminApiService);
  private readonly themeService = inject(ThemeService);

  readonly user = this.auth.user;
  readonly displayName = computed(() => this.user()?.name || this.user()?.email || 'Administrator');
  readonly sidebarOpen = signal(false);

  constructor() {
    // No switcher here (out of this portal's current scope), but this shell shares
    // _portal-shell.scss's tokens with the client portal, so it still needs to resolve this
    // admin's own saved preference rather than being stuck on a stale bootstrap guess left
    // over from a different user's session in the same browser - see ThemeService.
    this.api.getPreferences().subscribe({
      next: prefs => this.themeService.applyTheme((prefs.themeMode as ThemeMode) || 'light')
    });
  }

  readonly navItems: readonly PlatformAdminNavItem[] = [
    { path: '/admin', label: 'Dashboard', icon: 'fas fa-gauge-high' },
    { path: '/admin/tenants', label: 'Tenants', icon: 'fas fa-building' },
    { path: '/admin/plans', label: 'Plans', icon: 'fas fa-layer-group' },
    { path: '/admin/payments', label: 'Payments', icon: 'fas fa-sack-dollar' },
    { path: '/admin/contact-submissions', label: 'Contact Inbox', icon: 'fas fa-inbox' }
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
