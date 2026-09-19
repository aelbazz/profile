import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  VERSION,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ConfigDataService } from '../../core/services/config-data.service';
import { PLATFORM_BRANDING } from '../../core/config/platform-branding.config';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

/** Scroll offset (px) past which the back-to-top button appears. */
const SCROLL_TOP_THRESHOLD = 300;

/**
 * Chrome for one tenant's public profile: navbar, footer and scroll-to-top, all built
 * relative to the current :tenantSlug rather than hardcoded paths - a tenant renaming
 * (default -> albaz, say) or switching to a different tenant entirely both just work,
 * since every link here is derived from the resolved route param, not typed literally.
 *
 * Deliberately independent from AppComponent's own navbar/footer (the Portfolio marketing
 * chrome) and from AdminShellComponent (the client portal) - each of the three layouts owns
 * its own chrome outright, matching the pattern AdminShellComponent already established.
 */
@Component({
  selector: 'app-tenant-profile-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './tenant-profile-shell.component.html',
  styleUrl: './tenant-profile-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantProfileShellComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly configData = inject(ConfigDataService);

  readonly platformName = PLATFORM_BRANDING.name;
  readonly currentYear = new Date().getFullYear();
  readonly angularVersion = VERSION.full;

  /** Tracks the route param reactively - two tenants in a row can reuse this component
   *  instance, so this cannot be read once in a constructor. */
  readonly slug = toSignal(
    this.route.paramMap.pipe(map(params => params.get('tenantSlug') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('tenantSlug') ?? '' }
  );

  readonly profile = this.configData.profile;
  readonly isLoading = this.configData.isLoading;
  readonly hasFailed = this.configData.hasFailed;

  readonly authorName = computed(() => this.profile()?.name || this.slug());
  readonly linkedinUrl = computed(() => this.profile()?.linkedin || null);

  readonly navItems = computed<readonly NavItem[]>(() => {
    const base = `/${this.slug()}`;
    return [
      { path: base, label: 'Home', icon: 'fas fa-user' },
      { path: `${base}/experience`, label: 'Experience', icon: 'fas fa-briefcase' },
      { path: `${base}/projects`, label: 'Projects', icon: 'fas fa-folder-open' },
      { path: `${base}/skills`, label: 'Skills', icon: 'fas fa-code' },
      { path: `${base}/contact`, label: 'Contact', icon: 'fas fa-envelope' }
    ];
  });

  readonly secondaryNavItems = computed<readonly NavItem[]>(() => {
    const base = `/${this.slug()}`;
    return [
      { path: `${base}/achievements`, label: 'Achievements', icon: 'fas fa-trophy' },
      { path: `${base}/courses`, label: 'Courses', icon: 'fas fa-graduation-cap' },
      { path: `${base}/timeline`, label: 'Timeline', icon: 'fas fa-history' },
      { path: `${base}/management`, label: 'Management', icon: 'fas fa-users-cog' }
    ];
  });

  readonly showScrollTop = signal(false);
  readonly isNavbarCollapsed = signal(true);
  private scrollFrameQueued = false;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.scrollFrameQueued) {
      return;
    }
    this.scrollFrameQueued = true;
    requestAnimationFrame(() => {
      this.scrollFrameQueued = false;
      this.showScrollTop.set(window.scrollY > SCROLL_TOP_THRESHOLD);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isNavbarCollapsed()) {
      return;
    }
    const navbar = this.host.nativeElement.querySelector('.navbar');
    if (navbar && !navbar.contains(event.target as Node)) {
      this.collapseNavbar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.isNavbarCollapsed()) {
      this.collapseNavbar();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.collapseNavbar();
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed.update(collapsed => !collapsed);
  }

  collapseNavbar(): void {
    this.isNavbarCollapsed.set(true);
  }
}
