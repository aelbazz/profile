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
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { PLATFORM_BRANDING } from './core/config/platform-branding.config';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

/** Which chrome this component should render around the routed content. */
type LayoutMode = 'marketing' | 'tenant' | 'portal';

/** Scroll offset (px) past which the back-to-top button appears. */
const SCROLL_TOP_THRESHOLD = 300;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  /**
   * This component renders the Portfolio marketing chrome (navbar/footer) only for the
   * marketing routes. A tenant's own profile gets its own chrome from
   * TenantProfileShellComponent, the client control panel from AdminShellComponent, and the
   * platform-admin portal from PlatformAdminShellComponent - this component renders none of
   * those, just a bare <router-outlet> for all three.
   */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  private static readonly MARKETING_PATHS = new Set(['', 'about', 'services', 'contact']);
  private static readonly PORTAL_PATHS = new Set(['client', 'admin']);

  readonly layoutMode = computed<LayoutMode>(() => {
    const firstSegment = this.currentUrl().split('/')[1]?.split(/[?#]/)[0] ?? '';
    if (AppComponent.PORTAL_PATHS.has(firstSegment)) {
      return 'portal';
    }
    return AppComponent.MARKETING_PATHS.has(firstSegment) ? 'marketing' : 'tenant';
  });

  /** Drives the bare, chrome-free layout in app.html/app.scss - kept under its original
   *  name (".admin-content") to avoid an unrelated CSS rename, even though it now also
   *  covers the platform-admin portal, not just the client one. */
  readonly isAdminArea = computed(() => this.layoutMode() === 'portal');

  readonly title = PLATFORM_BRANDING.name;
  readonly tagline = PLATFORM_BRANDING.tagline;
  readonly socialLinks = PLATFORM_BRANDING.socialLinks;
  readonly currentYear = new Date().getFullYear();
  readonly angularVersion = VERSION.full;

  readonly showScrollTop = signal(false);
  readonly isNavbarCollapsed = signal(true);

  /** Guards the scroll handler so state updates at most once per animation frame. */
  private scrollFrameQueued = false;

  readonly navItems: readonly NavItem[] = [
    { path: '/', label: 'Home', icon: 'fas fa-house' },
    { path: '/about', label: 'About', icon: 'fas fa-circle-info' },
    { path: '/services', label: 'Services', icon: 'fas fa-layer-group' },
    { path: '/contact', label: 'Contact', icon: 'fas fa-envelope' }
  ];

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.scrollFrameQueued) {
      return;
    }
    this.scrollFrameQueued = true;
    requestAnimationFrame(() => {
      this.scrollFrameQueued = false;
      // Setting the same value is a no-op, so quiet scrolling costs no change detection.
      this.showScrollTop.set(window.scrollY > SCROLL_TOP_THRESHOLD);
    });
  }

  /** Closes the mobile menu when a click lands outside the navbar. */
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

  /** Closes the mobile menu on Escape. */
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

  /**
   * Collapses the navbar menu, e.g. after a navigation link is clicked in responsive mode.
   * The component owns this state outright - Bootstrap's collapse plugin is not involved.
   */
  collapseNavbar(): void {
    this.isNavbarCollapsed.set(true);
  }
}
