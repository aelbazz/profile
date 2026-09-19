import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Achievement,
  Contact,
  Course,
  Experience,
  ManagementResponsibility,
  Profile,
  Project,
  SkillData,
  TenantTheme,
  TimelineEvent
} from '../models';

/**
 * The complete public profile, as returned by GET /api/v1/public/tenants/:slug/profile.
 *
 * Each member reuses the existing frontend model: the API was deliberately shaped to match
 * them, so nothing here needs a translation layer. `tenant` and `settings` are new with the
 * SaaS backend and unused by any component yet - `settings` stays typed as an optional
 * `Record` so this interface doesn't lie about what's consumed today; `theme` is now a real
 * type since TenantProfileShellComponent applies it.
 */
export interface PublicProfileResponse {
  tenant?: { slug: string; name: string };
  person: Profile;
  contact: Contact | null;
  experiences: Experience[];
  projects: Project[];
  achievements: Achievement[];
  courses: Course[];
  timelineEvents: TimelineEvent[];
  managementRoles: ManagementResponsibility[];
  skills: SkillData;
  theme?: TenantTheme;
  settings?: Record<string, unknown>;
}

/**
 * `getPublicProfile`'s result, plus the slug the backend actually served the data under.
 * The two differ only when the requested slug has been renamed and the backend redirected
 * via history - see PublicProfileService.resolveBySlug on the API side.
 */
export interface PublicProfileResult {
  profile: PublicProfileResponse;
  currentSlug: string | null;
}

/**
 * Sole owner of the public API URL. Components never reference it.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Fetches one tenant's entire profile in one request, replacing the nine separate JSON
   * files this app used to ship. The slug is the tenant's public URL segment - every tenant
   * is served by the same build now, so there is no build-time default: the caller (the
   * tenant-profile route resolver) always knows the slug from the URL.
   *
   * Caching is left to the browser: the response carries an ETag and Cache-Control, so a
   * repeat load costs a 304 with an empty body. `X-Tenant-Slug-Current` is read from the
   * response so a caller can detect a slug rename and update the URL accordingly.
   */
  getPublicProfile(slug: string): Observable<PublicProfileResult> {
    return this.http
      .get<PublicProfileResponse>(`${this.baseUrl}/public/tenants/${slug}/profile`, {
        observe: 'response'
      })
      .pipe(
        map(response => ({
          profile: response.body as PublicProfileResponse,
          currentSlug: response.headers.get('X-Tenant-Slug-Current')
        }))
      );
  }
}
