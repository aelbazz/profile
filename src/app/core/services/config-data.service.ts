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
  Contact
} from '../models';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProfileApiService } from './profile-api.service';

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

/**
 * Backing store for every profile section.
 *
 * Data now comes from the backend rather than nine static JSON files: one call to
 * GET /api/v1/public/tenants/:slug/profile populates all nine signals. The public surface is unchanged -
 * same signals, same loadX() methods, same error signals - so no component needed editing.
 *
 * Because a single request feeds everything, the per-section error signals all reflect that
 * one request. That is deliberate: a partial failure is no longer possible.
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

  readonly profile = this.profileSignal.asReadonly();
  readonly experience = this.experienceSignal.asReadonly();
  readonly projects = this.projectsSignal.asReadonly();
  readonly achievements = this.achievementsSignal.asReadonly();
  readonly courses = this.coursesSignal.asReadonly();
  readonly management = this.managementSignal.asReadonly();
  readonly skills = this.skillsSignal.asReadonly();
  readonly timeline = this.timelineSignal.asReadonly();
  readonly contact = this.contactSignal.asReadonly();

  /** True once the profile has been fetched successfully. */
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

  // Every loadX() delegates to the same request, so components keep calling exactly what
  // they called when each section had its own JSON file.
  loadProfile(force = false): void {
    this.load(force);
  }

  loadExperience(force = false): void {
    this.load(force);
  }

  loadProjects(force = false): void {
    this.load(force);
  }

  loadAchievements(force = false): void {
    this.load(force);
  }

  loadCourses(force = false): void {
    this.load(force);
  }

  loadManagement(force = false): void {
    this.load(force);
  }

  loadSkills(force = false): void {
    this.load(force);
  }

  loadTimeline(force = false): void {
    this.load(force);
  }

  loadContact(force = false): void {
    this.load(force);
  }

  loadAllData(force = false): void {
    this.load(force);
  }

  /** Discards the cache so the next load() refetches. Used after an admin edit. */
  invalidate(): void {
    this.loaded = false;
  }

  /**
   * Fetches the whole profile once and fans it out into the nine signals.
   * Repeat calls are no-ops while data is present or a request is in flight.
   */
  private load(force: boolean): void {
    if (this.pending) {
      return;
    }
    if (this.loaded && !force) {
      return;
    }

    this.pending = true;
    this.loadingSignal.set(true);
    this.errorSignal.set(false);

    this.api
      .getPublicProfile()
      .pipe(
        tap(data => {
          this.profileSignal.set(data.person);
          this.contactSignal.set(data.contact);
          // The API returns bare arrays; the frontend models wrap them. Wrapping happens
          // here, in one place, so the component-facing shapes are unchanged.
          this.experienceSignal.set({ experiences: data.experiences });
          this.projectsSignal.set({ projects: data.projects });
          this.achievementsSignal.set({ achievements: data.achievements });
          this.coursesSignal.set({ courses: data.courses });
          this.timelineSignal.set({ events: data.timelineEvents });
          this.managementSignal.set({ responsibilities: data.managementRoles });
          // skills already arrives as { categories: [...] }, matching SkillData.
          this.skillsSignal.set(data.skills);
          this.loaded = true;
        }),
        catchError(error => {
          console.error('Error loading profile:', error);
          this.errorSignal.set(true);
          return of(null);
        }),
        finalize(() => {
          this.pending = false;
          this.loadingSignal.set(false);
        })
      )
      .subscribe();
  }
}
