import { Observable } from 'rxjs';
import { AdminApiService } from '../../../core/services/admin-api.service';

/**
 * Achievements, courses, timeline events and management roles are all "a flat record with a
 * few optional fields and maybe a list or two". Four near-identical components would be four
 * places to fix every bug, so they share one config-driven page instead.
 *
 * Anything with genuinely distinct editing behaviour - experiences, projects, skills,
 * technologies, the two singletons - has its own component rather than being forced in here.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'url'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'stringArray';

export interface FieldConfig {
  readonly key: string;
  readonly label: string;
  readonly type: FieldType;
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly maxLength?: number;
  readonly rows?: number;
  readonly options?: ReadonlyArray<{ value: string; label: string }>;
  /** Lays the field out beside the previous one on wide screens. */
  readonly half?: boolean;
}

export interface ColumnConfig {
  readonly key: string;
  readonly label: string;
  /** Renders as a muted second line under the primary column. */
  readonly secondaryKey?: string;
  readonly isCount?: boolean;
}

export interface EntityConfig {
  readonly title: string;
  readonly subtitle: string;
  readonly singular: string;
  readonly fields: readonly FieldConfig[];
  readonly columns: readonly ColumnConfig[];
  readonly hasPublishToggle: boolean;
  readonly list: (api: AdminApiService) => Observable<Record<string, unknown>[]>;
  readonly create: (api: AdminApiService, body: unknown) => Observable<unknown>;
  readonly update: (api: AdminApiService, id: string, body: unknown) => Observable<unknown>;
  readonly remove: (api: AdminApiService, id: string) => Observable<void>;
}

type ListFn = EntityConfig['list'];

/** Narrows the typed admin responses to the generic record shape the page works with. */
const asRecords =
  <T>(fn: (api: AdminApiService) => Observable<T[]>): ListFn =>
  api =>
    fn(api) as unknown as Observable<Record<string, unknown>[]>;

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  achievements: {
    title: 'Achievements',
    subtitle: 'Awards, certifications and recognitions.',
    singular: 'achievement',
    hasPublishToggle: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, maxLength: 300 },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        half: true,
        options: [
          { value: 'award', label: 'Award' },
          { value: 'certification', label: 'Certification' },
          { value: 'recognition', label: 'Recognition' },
          { value: 'milestone', label: 'Milestone' }
        ]
      },
      {
        key: 'date',
        label: 'Date',
        type: 'text',
        required: true,
        half: true,
        placeholder: '2025',
        hint: 'Free text, matching the existing format.'
      },
      { key: 'description', label: 'Description', type: 'textarea', required: true, rows: 4 },
      { key: 'organization', label: 'Organization', type: 'text', half: true },
      { key: 'icon', label: 'Icon class', type: 'text', half: true },
      { key: 'articleUrl', label: 'Article URL', type: 'url', placeholder: 'https://…' }
    ],
    columns: [
      { key: 'title', label: 'Title', secondaryKey: 'legacyId' },
      { key: 'category', label: 'Category' },
      { key: 'date', label: 'Date' },
      { key: 'organization', label: 'Organization' }
    ],
    list: asRecords(api => api.getAchievements()),
    create: (api, body) => api.createAchievement(body),
    update: (api, id, body) => api.updateAchievement(id, body),
    remove: (api, id) => api.deleteAchievement(id)
  },

  courses: {
    title: 'Courses & training',
    subtitle: 'Education, certifications and continuous learning.',
    singular: 'course',
    hasPublishToggle: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, maxLength: 300 },
      { key: 'provider', label: 'Provider', type: 'text', required: true, half: true },
      {
        key: 'completionDate',
        label: 'Completion date',
        type: 'text',
        required: true,
        half: true,
        placeholder: '2025'
      },
      {
        key: 'level',
        label: 'Level',
        type: 'text',
        half: true,
        placeholder: 'Beginner',
        hint: 'Free text — degree level or difficulty.'
      },
      { key: 'duration', label: 'Duration', type: 'text', half: true, placeholder: '9 Months' },
      { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
      { key: 'skills', label: 'Topics covered', type: 'stringArray', hint: 'Course topics, not technologies.' },
      { key: 'instructor', label: 'Instructor', type: 'text', half: true },
      { key: 'grade', label: 'Grade', type: 'text', half: true },
      { key: 'startDate', label: 'Start date', type: 'text', half: true },
      { key: 'courseUrl', label: 'Course URL', type: 'url', half: true, placeholder: 'https://…' },
      { key: 'certificateUrl', label: 'Certificate URL', type: 'url', placeholder: 'https://…' }
    ],
    columns: [
      { key: 'title', label: 'Title', secondaryKey: 'provider' },
      { key: 'completionDate', label: 'Completed' },
      { key: 'level', label: 'Level' },
      { key: 'skills', label: 'Topics', isCount: true }
    ],
    list: asRecords(api => api.getCourses()),
    create: (api, body) => api.createCourse(body),
    update: (api, id, body) => api.updateCourse(id, body),
    remove: (api, id) => api.deleteCourse(id)
  },

  timeline: {
    title: 'Timeline',
    subtitle: 'Career milestones, shown in the order listed here.',
    singular: 'timeline event',
    hasPublishToggle: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, maxLength: 300 },
      { key: 'subtitle', label: 'Subtitle', type: 'text', half: true },
      {
        key: 'date',
        label: 'Date',
        type: 'text',
        required: true,
        half: true,
        placeholder: 'Feb 2025'
      },
      {
        key: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: [
          { value: 'work', label: 'Work' },
          { value: 'education', label: 'Education' },
          { value: 'achievement', label: 'Achievement' },
          { value: 'project', label: 'Project' },
          { value: 'certification', label: 'Certification' }
        ]
      },
      { key: 'description', label: 'Description', type: 'textarea', required: true, rows: 4 },
      { key: 'icon', label: 'Icon class', type: 'text' }
    ],
    columns: [
      { key: 'title', label: 'Title', secondaryKey: 'subtitle' },
      { key: 'date', label: 'Date' },
      { key: 'type', label: 'Type' }
    ],
    list: asRecords(api => api.getTimelineEvents()),
    create: (api, body) => api.createTimelineEvent(body),
    update: (api, id, body) => api.updateTimelineEvent(id, body),
    remove: (api, id) => api.deleteTimelineEvent(id)
  },

  management: {
    title: 'Management roles',
    subtitle: 'Leadership positions, kept separate from work experience.',
    singular: 'management role',
    hasPublishToggle: true,
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, maxLength: 300 },
      { key: 'organization', label: 'Organization', type: 'text', required: true, half: true },
      {
        key: 'level',
        label: 'Level',
        type: 'select',
        required: true,
        half: true,
        options: [
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' }
        ]
      },
      { key: 'startDate', label: 'Start date', type: 'text', required: true, half: true, placeholder: 'Jan 2024' },
      { key: 'endDate', label: 'End date', type: 'text', half: true, hint: 'Leave blank if current.' },
      { key: 'isCurrent', label: 'This is a current role', type: 'checkbox' },
      { key: 'description', label: 'Description', type: 'textarea', required: true, rows: 3 },
      { key: 'teamSize', label: 'Team size', type: 'number' },
      { key: 'keyResponsibilities', label: 'Key responsibilities', type: 'stringArray' },
      { key: 'achievements', label: 'Achievements', type: 'stringArray' }
    ],
    columns: [
      { key: 'title', label: 'Title', secondaryKey: 'organization' },
      { key: 'level', label: 'Level' },
      { key: 'startDate', label: 'From' },
      { key: 'keyResponsibilities', label: 'Responsibilities', isCount: true }
    ],
    list: asRecords(api => api.getManagementRoles()),
    create: (api, body) => api.createManagementRole(body),
    update: (api, id, body) => api.updateManagementRole(id, body),
    remove: (api, id) => api.deleteManagementRole(id)
  }
};
