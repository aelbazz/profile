import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  TimelineEvent
} from '../models';

/**
 * The complete public profile, as returned by GET /api/v1/public/tenants/:slug/profile.
 *
 * Each member reuses the existing frontend model: the API was deliberately shaped to match
 * them, so nothing here needs a translation layer. `tenant`, `theme` and `settings` are new
 * with the SaaS backend and unused by any component yet - they're typed as optional so this
 * interface doesn't lie about what's actually consumed today.
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
  theme?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

/**
 * Sole owner of the public API URL. Components never reference it.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Fetches the entire profile in one request, replacing the nine separate JSON files.
   *
   * The slug selects the tenant. It comes from the build environment rather than the URL,
   * so this deployment always shows one person - the API serves every other profile at its
   * own slug for anyone who wants to host them.
   *
   * Caching is left to the browser: the response carries an ETag and Cache-Control, so a
   * repeat load costs a 304 with an empty body.
   */
  getPublicProfile(slug: string = environment.profileSlug): Observable<PublicProfileResponse> {
    return this.http.get<PublicProfileResponse>(`${this.baseUrl}/public/tenants/${slug}/profile`);
  }
}
