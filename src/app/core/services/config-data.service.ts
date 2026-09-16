import { Injectable, signal, computed, inject, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

/** Identifies a single JSON data file; also the cache key. */
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

@Injectable({
  providedIn: 'root'
})
export class ConfigDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'assets/data';

  // Signals for each data type
  private readonly profileSignal = signal<Profile | null>(null);
  private readonly experienceSignal = signal<ExperienceData | null>(null);
  private readonly projectsSignal = signal<ProjectData | null>(null);
  private readonly achievementsSignal = signal<AchievementData | null>(null);
  private readonly coursesSignal = signal<CourseData | null>(null);
  private readonly managementSignal = signal<ManagementData | null>(null);
  private readonly skillsSignal = signal<SkillData | null>(null);
  private readonly timelineSignal = signal<TimelineData | null>(null);
  private readonly contactSignal = signal<Contact | null>(null);

  // Readonly views
  readonly profile = this.profileSignal.asReadonly();
  readonly experience = this.experienceSignal.asReadonly();
  readonly projects = this.projectsSignal.asReadonly();
  readonly achievements = this.achievementsSignal.asReadonly();
  readonly courses = this.coursesSignal.asReadonly();
  readonly management = this.managementSignal.asReadonly();
  readonly skills = this.skillsSignal.asReadonly();
  readonly timeline = this.timelineSignal.asReadonly();
  readonly contact = this.contactSignal.asReadonly();

  /** Keys that have been fetched successfully - prevents refetching on every navigation. */
  private readonly loaded = new Set<DataKey>();
  /** Keys with a request currently in flight - prevents duplicate parallel requests. */
  private readonly pending = new Set<DataKey>();
  /** Keys whose last fetch failed, so templates can show a retry affordance. */
  private readonly errorsSignal = signal<ReadonlySet<DataKey>>(new Set());

  private readonly pendingCountSignal = signal<number>(0);
  readonly isLoading = computed(() => this.pendingCountSignal() > 0);

  /** True when the given data file failed to load and no data is available. */
  hasError(key: DataKey): boolean {
    return this.errorsSignal().has(key);
  }

  readonly profileError = computed(() => this.errorsSignal().has('profile'));
  readonly experienceError = computed(() => this.errorsSignal().has('experience'));
  readonly projectsError = computed(() => this.errorsSignal().has('projects'));
  readonly achievementsError = computed(() => this.errorsSignal().has('achievements'));
  readonly coursesError = computed(() => this.errorsSignal().has('courses'));
  readonly managementError = computed(() => this.errorsSignal().has('management'));
  readonly skillsError = computed(() => this.errorsSignal().has('skills'));
  readonly timelineError = computed(() => this.errorsSignal().has('timeline'));
  readonly contactError = computed(() => this.errorsSignal().has('contact'));

  loadProfile(force = false): void {
    this.load('profile', this.profileSignal, force);
  }

  loadExperience(force = false): void {
    this.load('experience', this.experienceSignal, force);
  }

  loadProjects(force = false): void {
    this.load('projects', this.projectsSignal, force);
  }

  loadAchievements(force = false): void {
    this.load('achievements', this.achievementsSignal, force);
  }

  loadCourses(force = false): void {
    this.load('courses', this.coursesSignal, force);
  }

  loadManagement(force = false): void {
    this.load('management', this.managementSignal, force);
  }

  loadSkills(force = false): void {
    this.load('skills', this.skillsSignal, force);
  }

  loadTimeline(force = false): void {
    this.load('timeline', this.timelineSignal, force);
  }

  loadContact(force = false): void {
    this.load('contact', this.contactSignal, force);
  }

  /** Load every data file. Cached keys are skipped unless `force` is set. */
  loadAllData(force = false): void {
    this.loadProfile(force);
    this.loadExperience(force);
    this.loadProjects(force);
    this.loadAchievements(force);
    this.loadCourses(force);
    this.loadManagement(force);
    this.loadSkills(force);
    this.loadTimeline(force);
    this.loadContact(force);
  }

  /** Discards the cache so the next load() call refetches from the network. */
  invalidate(key?: DataKey): void {
    if (key) {
      this.loaded.delete(key);
    } else {
      this.loaded.clear();
    }
  }

  /**
   * Fetches a data file once and caches the result. Repeat calls are no-ops while
   * the data is already present or a request is in flight, unless `force` is set.
   */
  private load<T>(key: DataKey, target: WritableSignal<T | null>, force: boolean): void {
    if (this.pending.has(key)) {
      return;
    }
    if (this.loaded.has(key) && !force) {
      return;
    }

    this.pending.add(key);
    this.pendingCountSignal.update(count => count + 1);
    this.clearError(key);

    this.http
      .get<T>(`${this.baseUrl}/${key}.json`)
      .pipe(
        tap(data => {
          target.set(data);
          this.loaded.add(key);
        }),
        catchError(error => {
          console.error(`Error loading ${key}:`, error);
          this.setError(key);
          return of(null);
        }),
        finalize(() => {
          this.pending.delete(key);
          this.pendingCountSignal.update(count => Math.max(0, count - 1));
        })
      )
      .subscribe();
  }

  private setError(key: DataKey): void {
    this.errorsSignal.update(current => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }

  private clearError(key: DataKey): void {
    this.errorsSignal.update(current => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }
}
