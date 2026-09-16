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
 * The complete public profile, as returned by GET /api/v1/public/profile.
 *
 * Each member reuses the existing frontend model: the API was deliberately shaped to match
 * them, so nothing here needs a translation layer.
 */
export interface PublicProfileResponse {
  person: Profile;
  contact: Contact | null;
  experiences: Experience[];
  projects: Project[];
  achievements: Achievement[];
  courses: Course[];
  timelineEvents: TimelineEvent[];
  managementRoles: ManagementResponsibility[];
  skills: SkillData;
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
   * Caching is left to the browser: the response carries an ETag and Cache-Control, so a
   * repeat load costs a 304 with an empty body.
   */
  getPublicProfile(): Observable<PublicProfileResponse> {
    return this.http.get<PublicProfileResponse>(`${this.baseUrl}/public/profile`);
  }
}
