import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  Renderer2,
  VERSION,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { DOCUMENT, NgStyle } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ConfigDataService } from '../../core/services/config-data.service';
import { PLATFORM_BRANDING } from '../../core/config/platform-branding.config';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  /** Matches a ClientSection.sectionKey on the backend - see section-registry.ts. Drives
   *  whether this link shows at all, and in what order, from the public profile response. */
  readonly sectionKey: string;
}

/** Scroll offset (px) past which the back-to-top button appears. */
const SCROLL_TOP_THRESHOLD = 300;

/**
 * Chrome for one tenant's public profile: navbar, footer and scroll-to-top, all built
 * relative to the current :tenantSlug rather than hardcoded paths - a tenant renaming
 * (default -> albaz, say) or switching to a different tenant entirely both just work,
 * since every link here is derived from the resolved route param, not typed literally.
 *
 * Also where a tenant's chosen design system, layout and branding colors actually take
 * effect: `data-design-system` is a real host attribute (so `:host-context(...)` in shared
 * components like CardComponent can key off it), and the tenant's colors are applied as
 * inline `--bs-*` custom properties on the template root - the same variables every shared
 * component already reads, so they take effect everywhere inside this shell's
 * <router-outlet> without those components needing any changes.
 *
 * Deliberately independent from AppComponent's own navbar/footer (the Portfolio marketing
 * chrome) and from AdminShellComponent (the client portal) - each of the three layouts owns
 * its own chrome outright, matching the pattern AdminShellComponent already established.
 */
@Component({
  selector: 'app-tenant-profile-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgStyle],
  templateUrl: './tenant-profile-shell.component.html',
  styleUrl: './tenant-profile-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantProfileShellComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly configData = inject(ConfigDataService);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

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
  readonly theme = this.configData.theme;

  readonly layout = computed(() => this.theme().layout);
  readonly designSystem = computed(() => this.theme().designSystem);

  /** A real DOM attribute on this component's host element, so
   *  `:host-context([data-design-system="creative"])` in shared components (Card, Badge,
   *  SectionHeader) matches - those components render inside this shell's <router-outlet>,
   *  which is a real descendant of this host regardless of Angular's view encapsulation. */
  @HostBinding('attr.data-design-system') get designSystemAttr(): string {
    return this.designSystem();
  }

  readonly cssVariables = computed(() => {
    const t = this.theme();
    return {
      '--bs-primary': t.primaryColor,
      '--bs-secondary': t.secondaryColor,
      '--bs-info': t.accentColor,
      '--bs-body-bg': t.backgroundColor,
      '--bs-body-color': t.textColor,
      '--bs-heading-color': t.headingColor,
      '--bs-font-sans-serif': t.fontFamily,
      '--tenant-accent': t.accentColor,
      '--tenant-radius': t.borderRadius
    };
  });

  /**
   * Tenant-authored CSS, injected as a real <style> element rather than bound in the
   * template: Angular's compiler intercepts a literal <style> tag found in a .html template
   * file and tries to compile it as this component's own stylesheet at build time, so a
   * live `{{ }}` binding inside one is never evaluated at runtime. Renderer2 sidesteps the
   * template compiler entirely - this creates a plain DOM node the browser treats exactly
   * like any other <style> tag: it can change appearance, and cannot execute script.
   */
  private customStyleEl: HTMLStyleElement | null = null;

  constructor() {
    effect(() => this.applyCustomCss(this.theme().customCss));
  }

  ngOnDestroy(): void {
    this.applyCustomCss(null);
  }

  private applyCustomCss(css: string | null): void {
    if (this.customStyleEl) {
      this.renderer.removeChild(this.document.head, this.customStyleEl);
      this.customStyleEl = null;
    }
    if (css) {
      const style = this.renderer.createElement('style') as HTMLStyleElement;
      this.renderer.appendChild(style, this.renderer.createText(css));
      this.renderer.appendChild(this.document.head, style);
      this.customStyleEl = style;
    }
  }

  readonly authorName = computed(() => this.profile()?.name || this.slug());
  readonly linkedinUrl = computed(() => this.profile()?.linkedin || null);

  /** sectionKey -> shown publicly. Backend also empties a disabled section's own content
   *  (see PublicProfileService), so a direct URL to a hidden section's route still renders
   *  cleanly empty rather than stale data - hiding the nav link is presentation only. */
  private readonly sections = this.configData.sections;

  /** A key absent from the map (profile not loaded yet, or an older cached response before
   *  this field existed) is treated as shown, never hidden. */
  private isSectionShown(key: string): boolean {
    const map = this.sections();
    return key in map ? map[key] : true;
  }

  /** Preserves the client's own display order (ClientSection.displayOrder, as returned) for
   *  whichever items pass the shown-filter, rather than a fixed hardcoded order. */
  private orderBySection(items: readonly NavItem[]): readonly NavItem[] {
    const order = Object.keys(this.sections());
    return [...items]
      .filter(item => this.isSectionShown(item.sectionKey))
      .sort((a, b) => order.indexOf(a.sectionKey) - order.indexOf(b.sectionKey));
  }

  readonly navItems = computed<readonly NavItem[]>(() => {
    const base = `/${this.slug()}`;
    return this.orderBySection([
      { path: base, label: 'Home', icon: 'fas fa-user', sectionKey: 'profile' },
      { path: `${base}/experience`, label: 'Experience', icon: 'fas fa-briefcase', sectionKey: 'experience' },
      { path: `${base}/projects`, label: 'Projects', icon: 'fas fa-folder-open', sectionKey: 'projects' },
      { path: `${base}/skills`, label: 'Skills', icon: 'fas fa-code', sectionKey: 'skills' },
      { path: `${base}/contact`, label: 'Contact', icon: 'fas fa-envelope', sectionKey: 'contact' }
    ]);
  });

  readonly secondaryNavItems = computed<readonly NavItem[]>(() => {
    const base = `/${this.slug()}`;
    return this.orderBySection([
      { path: `${base}/achievements`, label: 'Achievements', icon: 'fas fa-trophy', sectionKey: 'achievements' },
      { path: `${base}/courses`, label: 'Courses', icon: 'fas fa-graduation-cap', sectionKey: 'courses' },
      { path: `${base}/timeline`, label: 'Timeline', icon: 'fas fa-history', sectionKey: 'timeline' },
      { path: `${base}/management`, label: 'Management', icon: 'fas fa-users-cog', sectionKey: 'management' }
    ]);
  });

  readonly showScrollTop = signal(false);
  /** Mobile menu open/closed - shared between the classic navbar-collapse and the sidebar's
   *  own off-canvas toggle, since only one layout is ever rendered at a time. */
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
    const target = event.target as Node;
    const navbar = this.host.nativeElement.querySelector('.navbar, .tenant-sidebar');
    // The sidebar's own toggle button is a sibling of .tenant-sidebar, not a child of it
    // (unlike the classic layout's .navbar-toggler, which is inside .navbar) - without this,
    // its own (click) handler opens the sidebar and this same click's document-level bubble
    // immediately closes it again.
    const toggle = this.host.nativeElement.querySelector('.tenant-sidebar-toggle');
    if (navbar?.contains(target) || toggle?.contains(target)) {
      return;
    }
    this.collapseNavbar();
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
