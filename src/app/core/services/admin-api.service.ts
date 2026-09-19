import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Admin-side representations. These carry the database id and the administrative fields
 * (sortOrder, isPublished) that the public payload deliberately omits.
 */

export interface AdminChildItem {
  id: string;
  description: string;
  sortOrder: number;
}

export interface AdminPerson {
  id: string;
  name: string;
  title: string;
  summary: string;
  location: string;
  yearsOfExperience: number;
  avatar: string;
  tagline: string;
  linkedin: string | null;
  birthday: string | null;
}

export interface AdminSocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  sortOrder: number;
}

export interface AdminContact {
  id: string;
  email: string;
  phone: string;
  whatsapp: string;
  linkedin: string;
  location: string | null;
  birthday: string | null;
  muchskills: string | null;
  socialLinks: AdminSocialLink[];
}

export interface AdminTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  fontFamily: string;
  borderRadius: string;
  layout: string;
  designSystem: string;
  darkMode: boolean;
  customCss: string | null;
}

export interface DesignSystemOption {
  id: string;
  label: string;
  description: string;
  /** Layout ids this design system supports - filters the layout picker in the UI. */
  layouts: string[];
}

export interface LayoutOption {
  id: string;
  label: string;
}

export interface DesignRegistry {
  designSystems: DesignSystemOption[];
  layouts: LayoutOption[];
}

export interface AdminExperience {
  id: string;
  legacyId: string;
  company: string;
  companyFullName: string | null;
  companyLogo: string | null;
  companyWebsite: string | null;
  companyDescription: string | null;
  position: string;
  location: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  responsibilities: AdminChildItem[];
  achievements: AdminChildItem[];
  technologies: string[];
  sortOrder: number;
  isPublished: boolean;
}

export interface AdminProject {
  id: string;
  legacyId: string;
  name: string;
  description: string;
  role: string;
  startDate: string;
  endDate: string | null;
  type: string | null;
  company: string | null;
  highlights: AdminChildItem[];
  technologies: string[];
  imageUrl: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  isStrategicInitiative: boolean;
  isCurrent: boolean;
  sortOrder: number;
  isPublished: boolean;
}

export interface AdminAchievement {
  id: string;
  legacyId: string;
  title: string;
  description: string;
  date: string;
  category: 'award' | 'certification' | 'recognition' | 'milestone';
  organization: string | null;
  icon: string | null;
  articleUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface AdminCourse {
  id: string;
  legacyId: string;
  title: string;
  provider: string;
  completionDate: string;
  level: string | null;
  description: string | null;
  skills: string[];
  duration: string | null;
  instructor: string | null;
  courseUrl: string | null;
  certificateUrl: string | null;
  startDate: string | null;
  grade: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface AdminTimelineEvent {
  id: string;
  legacyId: string;
  date: string;
  title: string;
  subtitle: string | null;
  description: string;
  type: 'work' | 'education' | 'achievement' | 'project' | 'certification';
  icon: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface AdminManagementRole {
  id: string;
  legacyId: string;
  /** The API models all three; the source data uses high and medium. */
  level: 'high' | 'medium' | 'low';
  title: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
  teamSize: number | null;
  keyResponsibilities: AdminChildItem[];
  achievements: AdminChildItem[];
  sortOrder: number;
  isPublished: boolean;
}

export interface AdminTechnology {
  id: string;
  name: string;
  slug: string;
  experienceCount?: number;
  projectCount?: number;
}

export interface AdminSkill {
  id: string;
  name: string;
  /** 0-9. 0 means unranked and renders as a grey no-rank tag. */
  level: number;
  category: string;
  since: number | null;
  icon: string | null;
  yearsOfExperience: number | null;
  endorsements: number | null;
  sortOrder: number;
}

export interface AdminSkillCategory {
  id: string;
  name: string;
  skills: AdminSkill[];
  sortOrder: number;
  isPublished: boolean;
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

/**
 * Every admin write goes through here. Components never build a URL or touch HttpClient.
 * The bearer token is attached by authInterceptor, not by this service.
 */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // -- person (singleton) -----------------------------------------------------

  getPerson(): Observable<AdminPerson> {
    return this.http.get<AdminPerson>(`${this.base}/tenant/profile`);
  }

  updatePerson(body: Partial<AdminPerson>): Observable<AdminPerson> {
    return this.http.patch<AdminPerson>(`${this.base}/tenant/profile`, body);
  }

  // -- contact (singleton) ----------------------------------------------------

  getContact(): Observable<AdminContact> {
    return this.http.get<AdminContact>(`${this.base}/tenant/contact`);
  }

  updateContact(body: unknown): Observable<AdminContact> {
    return this.http.patch<AdminContact>(`${this.base}/tenant/contact`, body);
  }

  // -- theme / branding (singleton) --------------------------------------------

  getTheme(): Observable<AdminTheme> {
    return this.http.get<AdminTheme>(`${this.base}/tenant/theme`);
  }

  updateTheme(body: Partial<AdminTheme>): Observable<AdminTheme> {
    return this.http.patch<AdminTheme>(`${this.base}/tenant/theme`, body);
  }

  /** Public, platform-wide config (not tenant-scoped) - co-located here since this admin
   *  page is its only consumer today. */
  getDesignRegistry(): Observable<DesignRegistry> {
    return this.http.get<DesignRegistry>(`${this.base}/design-registry`);
  }

  // -- experiences ------------------------------------------------------------

  getExperiences(): Observable<AdminExperience[]> {
    return this.http.get<AdminExperience[]>(`${this.base}/tenant/experiences`);
  }

  getExperience(id: string): Observable<AdminExperience> {
    return this.http.get<AdminExperience>(`${this.base}/tenant/experiences/${id}`);
  }

  createExperience(body: unknown): Observable<AdminExperience> {
    return this.http.post<AdminExperience>(`${this.base}/tenant/experiences`, body);
  }

  updateExperience(id: string, body: unknown): Observable<AdminExperience> {
    return this.http.patch<AdminExperience>(`${this.base}/tenant/experiences/${id}`, body);
  }

  deleteExperience(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tenant/experiences/${id}`);
  }

  reorderExperiences(items: ReorderItem[]): Observable<void> {
    return this.http.patch<void>(`${this.base}/tenant/experiences/reorder`, { items });
  }

  // -- projects ---------------------------------------------------------------

  getProjects(): Observable<AdminProject[]> {
    return this.http.get<AdminProject[]>(`${this.base}/tenant/projects`);
  }

  getProject(id: string): Observable<AdminProject> {
    return this.http.get<AdminProject>(`${this.base}/tenant/projects/${id}`);
  }

  createProject(body: unknown): Observable<AdminProject> {
    return this.http.post<AdminProject>(`${this.base}/tenant/projects`, body);
  }

  updateProject(id: string, body: unknown): Observable<AdminProject> {
    return this.http.patch<AdminProject>(`${this.base}/tenant/projects/${id}`, body);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tenant/projects/${id}`);
  }

  reorderProjects(items: ReorderItem[]): Observable<void> {
    return this.http.patch<void>(`${this.base}/tenant/projects/reorder`, { items });
  }

  // -- achievements -----------------------------------------------------------

  getAchievements(): Observable<AdminAchievement[]> {
    return this.http.get<AdminAchievement[]>(`${this.base}/tenant/achievements`);
  }

  createAchievement(body: unknown): Observable<AdminAchievement> {
    return this.http.post<AdminAchievement>(`${this.base}/tenant/achievements`, body);
  }

  updateAchievement(id: string, body: unknown): Observable<AdminAchievement> {
    return this.http.patch<AdminAchievement>(`${this.base}/tenant/achievements/${id}`, body);
  }

  deleteAchievement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tenant/achievements/${id}`);
  }

  // -- courses ----------------------------------------------------------------

  getCourses(): Observable<AdminCourse[]> {
    return this.http.get<AdminCourse[]>(`${this.base}/tenant/courses`);
  }

  createCourse(body: unknown): Observable<AdminCourse> {
    return this.http.post<AdminCourse>(`${this.base}/tenant/courses`, body);
  }

  updateCourse(id: string, body: unknown): Observable<AdminCourse> {
    return this.http.patch<AdminCourse>(`${this.base}/tenant/courses/${id}`, body);
  }

  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tenant/courses/${id}`);
  }

  // -- timeline ---------------------------------------------------------------

  getTimelineEvents(): Observable<AdminTimelineEvent[]> {
    return this.http.get<AdminTimelineEvent[]>(`${this.base}/tenant/timeline-events`);
  }

  createTimelineEvent(body: unknown): Observable<AdminTimelineEvent> {
    return this.http.post<AdminTimelineEvent>(`${this.base}/tenant/timeline-events`, body);
  }

  updateTimelineEvent(id: string, body: unknown): Observable<AdminTimelineEvent> {
    return this.http.patch<AdminTimelineEvent>(`${this.base}/tenant/timeline-events/${id}`, body);
  }

  deleteTimelineEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tenant/timeline-events/${id}`);
  }

  // -- management roles -------------------------------------------------------

  getManagementRoles(): Observable<AdminManagementRole[]> {
    return this.http.get<AdminManagementRole[]>(`${this.base}/tenant/management-roles`);
  }

  createManagementRole(body: unknown): Observable<AdminManagementRole> {
    return this.http.post<AdminManagementRole>(`${this.base}/tenant/management-roles`, body);
  }

  updateManagementRole(id: string, body: unknown): Observable<AdminManagementRole> {
    return this.http.patch<AdminManagementRole>(`${this.base}/tenant/management-roles/${id}`, body);
  }

  deleteManagementRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tenant/management-roles/${id}`);
  }

  // -- technologies -----------------------------------------------------------

  getTechnologies(): Observable<AdminTechnology[]> {
    return this.http.get<AdminTechnology[]>(`${this.base}/tenant/technologies`);
  }

  createTechnology(name: string): Observable<AdminTechnology> {
    return this.http.post<AdminTechnology>(`${this.base}/tenant/technologies`, { name });
  }

  updateTechnology(id: string, name: string): Observable<AdminTechnology> {
    return this.http.patch<AdminTechnology>(`${this.base}/tenant/technologies/${id}`, { name });
  }

  deleteTechnology(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tenant/technologies/${id}`);
  }

  // -- skills -----------------------------------------------------------------

  getSkillCategories(): Observable<AdminSkillCategory[]> {
    return this.http.get<AdminSkillCategory[]>(`${this.base}/tenant/skill-categories`);
  }

  createSkillCategory(body: unknown): Observable<AdminSkillCategory> {
    return this.http.post<AdminSkillCategory>(`${this.base}/tenant/skill-categories`, body);
  }

  updateSkillCategory(id: string, body: unknown): Observable<AdminSkillCategory> {
    return this.http.patch<AdminSkillCategory>(`${this.base}/tenant/skill-categories/${id}`, body);
  }

  deleteSkillCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tenant/skill-categories/${id}`);
  }

  addSkill(categoryId: string, body: unknown): Observable<AdminSkill> {
    return this.http.post<AdminSkill>(`${this.base}/tenant/skill-categories/${categoryId}/skills`, body);
  }

  updateSkill(skillId: string, body: unknown): Observable<AdminSkill> {
    return this.http.patch<AdminSkill>(`${this.base}/tenant/skill-categories/skills/${skillId}`, body);
  }

  deleteSkill(skillId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tenant/skill-categories/skills/${skillId}`);
  }
}
