import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  VERSION,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ConfigDataService } from './core/services';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
}

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
export class AppComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private static readonly IN_PROGRESS_BANNER_KEY = 'hideInProgressBanner';

  readonly title = 'Albaz Portfolio';
  readonly currentYear = new Date().getFullYear();
  readonly angularVersion = VERSION.full;

  readonly showScrollTop = signal(false);
  readonly isNavbarCollapsed = signal(true);
  readonly showInProgressBanner = signal(true);

  /** Guards the scroll handler so state updates at most once per animation frame. */
  private scrollFrameQueued = false;

  // Main navigation items - streamlined for better UX
  readonly navItems: readonly NavItem[] = [
    { path: '/profile', label: 'Home', icon: 'fas fa-user' },
    { path: '/experience', label: 'Experience', icon: 'fas fa-briefcase' },
    { path: '/projects', label: 'Projects', icon: 'fas fa-folder-open' },
    { path: '/skills', label: 'Skills', icon: 'fas fa-code' },
    { path: '/contact', label: 'Contact', icon: 'fas fa-envelope' }
  ];

  // Secondary navigation items (shown in the footer)
  readonly secondaryNavItems: readonly NavItem[] = [
    { path: '/achievements', label: 'Achievements', icon: 'fas fa-trophy' },
    { path: '/courses', label: 'Courses', icon: 'fas fa-graduation-cap' },
    { path: '/timeline', label: 'Timeline', icon: 'fas fa-history' },
    { path: '/management', label: 'Management', icon: 'fas fa-users-cog' }
  ];

  readonly profile = this.configService.profile;
  readonly authorName = computed(() => this.profile()?.name || 'Author');
  readonly linkedinUrl = computed(() => this.profile()?.linkedin || '#');

  ngOnInit(): void {
    this.configService.loadProfile();
    this.restoreInProgressBannerState();
  }

  /** Restores the dismissed state of the in-progress banner from a previous visit. */
  private restoreInProgressBannerState(): void {
    try {
      if (localStorage.getItem(AppComponent.IN_PROGRESS_BANNER_KEY) === 'true') {
        this.showInProgressBanner.set(false);
      }
    } catch {
      // Storage unavailable (private browsing, blocked cookies) - keep the banner visible.
    }
  }

  /** Dismisses the in-progress banner and remembers the choice. */
  dismissInProgressBanner(): void {
    this.showInProgressBanner.set(false);
    try {
      localStorage.setItem(AppComponent.IN_PROGRESS_BANNER_KEY, 'true');
    } catch {
      // Storage unavailable - the banner simply reappears on the next visit.
    }
  }

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
