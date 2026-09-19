import { Injectable, signal, computed, inject } from '@angular/core';
import {
  Profile,
  ExperienceData,
  ProjectData,
  AchievementData,
  CourseData,
  ManagementData,
  SkillData,
  TimelineData,
  Contact,
  TenantTheme
} from '../models';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { ProfileApiService } from './profile-api.service';

/** Mirrors the backend's own fallback (public.service.ts) so a tenant with no customised
 *  theme - or a response that omits it entirely - never leaves the page unstyled. */
const DEFAULT_THEME: TenantTheme = {
  primaryColor: '#6366f1',
  secondaryColor: '#64748b',
  accentColor: '#06b6d4',
  backgroundColor: '#ffffff',
  textColor: '#334155',
  headingColor: '#0f172a',
  fontFamily: 'Inter, sans-serif',
  borderRadius: '0.5rem',
  layout: 'classic',
  designSystem: 'modern',
  darkMode: false,
  customCss: null
};

/** Identifies a section of the profile. Kept for the per-section error API. */
export type DataKey =
  | 'profile'
  | 'experience'
  | 'projects'
  | 'achievements'
  | 'courses'
  | 'management'
  | 'skills'
  | 'timeline'
  | 'contact';

/** Result of a load attempt, for the caller (the tenant-profile resolver) to act on. */
export interface LoadProfileResult {
  success: boolean;
  /** Set only when the backend served the data under a different, canonical slug - a
   *  rename redirect. Null on every ordinary load, successful or not. */
  redirectSlug: string | null;
}

/**
 * Backing store for one tenant's profile sections at a time.
 *
 * Data comes from the backend: one call to GET /api/v1/public/tenants/:slug/profile
 * populates all nine signals. The frontend serves every tenant from the same build now, so
 * this service is keyed by slug - switching tenants (a real navigation between two profiles,
 * not just a page reload) discards the previous tenant's data before fetching the new one,
 * so a stale response can never be mistaken for the newly-requested tenant's data.
 *
 * Actual loading is driven by TenantProfileResolver, once per tenant-slug navigation - not
 * by these components' own ngOnInit calls. The loadX() methods below stay only as
 * backward-compatible replays of whatever tenant is already loaded, since every profile
 * section component still calls one on init.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigDataService {
  private readonly api = inject(ProfileApiService);

  private readonly profileSignal = signal<Profile | null>(null);
  private readonly experienceSignal = signal<ExperienceData | null>(null);
  private readonly projectsSignal = signal<ProjectData | null>(null);
  private readonly achievementsSignal = signal<AchievementData | null>(null);
  private readonly coursesSignal = signal<CourseData | null>(null);
  private readonly managementSignal = signal<ManagementData | null>(null);
  private readonly skillsSignal = signal<SkillData | null>(null);
  private readonly timelineSignal = signal<TimelineData | null>(null);
  private readonly contactSignal = signal<Contact | null>(null);
  private readonly themeSignal = signal<TenantTheme>(DEFAULT_THEME);

  readonly profile = this.profileSignal.asReadonly();
  readonly experience = this.experienceSignal.asReadonly();
  readonly projects = this.projectsSignal.asReadonly();
  readonly achievements = this.achievementsSignal.asReadonly();
  readonly courses = this.coursesSignal.asReadonly();
  readonly management = this.managementSignal.asReadonly();
  readonly skills = this.skillsSignal.asReadonly();
  readonly timeline = this.timelineSignal.asReadonly();
  readonly contact = this.contactSignal.asReadonly();
  /** Always populated (falls back to DEFAULT_THEME) - never null, so consumers don't need
   *  an extra "no theme yet" branch alongside the loading/error states. */
  readonly theme = this.themeSignal.asReadonly();

  /** Slug the currently-held data belongs to. Null before the first successful load. */
  private currentSlug: string | null = null;
  /** True once a profile has been fetched successfully for `currentSlug`. */
  private loaded = false;
  /** True while a request is in flight - collapses concurrent callers into one request. */
  private pending = false;

  private readonly errorSignal = signal<boolean>(false);
  private readonly loadingSignal = signal<boolean>(false);

  readonly isLoading = computed(() => this.loadingSignal());
  readonly hasFailed = computed(() => this.errorSignal());

  /** True when the profile failed to load and no data is available. */
  hasError(_key?: DataKey): boolean {
    return this.errorSignal();
  }

  readonly profileError = computed(() => this.errorSignal());
  readonly experienceError = computed(() => this.errorSignal());
  readonly projectsError = computed(() => this.errorSignal());
  readonly achievementsError = computed(() => this.errorSignal());
  readonly coursesError = computed(() => this.errorSignal());
  readonly managementError = computed(() => this.errorSignal());
  readonly skillsError = computed(() => this.errorSignal());
  readonly timelineError = computed(() => this.errorSignal());
  readonly contactError = computed(() => this.errorSignal());

  /**
   * Fetches one tenant's whole profile and fans it out into the nine signals. A no-op if
   * that exact slug is already loaded (unless `force`); a genuine tenant switch resets every
   * signal before the new request lands, so nothing renders tenant A's data under tenant B's
   * URL even momentarily.
   *
   * Callers that supersede an in-flight call (rapid navigation between two tenants) should
   * subscribe via a Router `ResolveFn`, whose subscription Angular cancels automatically
   * when a newer navigation starts - see TenantProfileResolver.
   */
  loadProfile$(slug: string, force = false): Observable<LoadProfileResult> {
    if (this.pending) {
      return of({ success: this.loaded, redirectSlug: null });
    }
    if (this.loaded && this.currentSlug === slug && !force) {
      return of({ success: true, redirectSlug: null });
    }

    if (this.currentSlug !== slug) {
      this.resetSignals();
    }

    this.currentSlug = slug;
    this.pending = true;
    this.loadingSignal.set(true);
    this.errorSignal.set(false);

    return this.api.getPublicProfile(slug).pipe(
      tap(({ profile, currentSlug }) => {
        this.profileSignal.set(profile.person);
        this.contactSignal.set(profile.contact);
        // The API returns bare arrays; the frontend models wrap them. Wrapping happens
        // here, in one place, so the component-facing shapes are unchanged.
        this.experienceSignal.set({ experiences: profile.experiences });
        this.projectsSignal.set({ projects: profile.projects });
        this.achievementsSignal.set({ achievements: profile.achievements });
        this.coursesSignal.set({ courses: profile.courses });
        this.timelineSignal.set({ events: profile.timelineEvents });
        this.managementSignal.set({ responsibilities: profile.managementRoles });
        // skills already arrives as { categories: [...] }, matching SkillData.
        this.skillsSignal.set(profile.skills);
        this.themeSignal.set(profile.theme ?? DEFAULT_THEME);
        this.loaded = true;
        // A renamed slug: keep tracking under the canonical one, so a later request for the
        // retired slug is treated as a genuine switch rather than a false cache hit.
        if (currentSlug && currentSlug !== slug) {
          this.currentSlug = currentSlug;
        }
      }),
      map(({ currentSlug }) => ({
        success: true,
        redirectSlug: currentSlug && currentSlug !== slug ? currentSlug : null
      })),
      catchError(error => {
        console.error('Error loading profile:', error);
        this.errorSignal.set(true);
        this.loaded = false;
        return of({ success: false, redirectSlug: null });
      }),
      finalize(() => {
        this.pending = false;
        this.loadingSignal.set(false);
      })
    );
  }

  /** Discards the cache so the next load() refetches. Used after an admin edit. */
  invalidate(): void {
    this.loaded = false;
  }

  private resetSignals(): void {
    this.profileSignal.set(null);
    this.experienceSignal.set(null);
    this.projectsSignal.set(null);
    this.achievementsSignal.set(null);
    this.coursesSignal.set(null);
    this.managementSignal.set(null);
    this.skillsSignal.set(null);
    this.timelineSignal.set(null);
    this.contactSignal.set(null);
    this.themeSignal.set(DEFAULT_THEME);
    this.loaded = false;
  }

  // Back-compat: every profile-section component still calls one of these from ngOnInit.
  // By the time they mount, TenantProfileResolver has already loaded the right tenant, so
  // these just replay that same load (a no-op unless `force` or nothing has loaded yet).
  private replay(force: boolean): void {
    if (this.currentSlug) {
      this.loadProfile$(this.currentSlug, force).subscribe();
    }
  }

  loadProfile(force = false): void {
    this.replay(force);
  }

  loadExperience(force = false): void {
    this.replay(force);
  }

  loadProjects(force = false): void {
    this.replay(force);
  }

  loadAchievements(force = false): void {
    this.replay(force);
  }

  loadCourses(force = false): void {
    this.replay(force);
  }

  loadManagement(force = false): void {
    this.replay(force);
  }

  loadSkills(force = false): void {
    this.replay(force);
  }

  loadTimeline(force = false): void {
    this.replay(force);
  }

  loadContact(force = false): void {
    this.replay(force);
  }

  loadAllData(force = false): void {
    this.replay(force);
  }
}
