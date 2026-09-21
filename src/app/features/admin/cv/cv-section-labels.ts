/**
 * Mirrors the backend's cv-section-registry.ts CV_SECTIONS - the fixed set of ATS headings a
 * CV version's sectionConfig can toggle and reorder. Kept here rather than fetched, since
 * Phase 1 has no dedicated registry endpoint for it (see design-registry for that pattern
 * applied elsewhere).
 */
export const CV_SECTION_LABELS: Record<string, string> = {
  experience: 'Professional Experience',
  skills: 'Technical Skills',
  projects: 'Projects',
  education: 'Education',
  courses: 'Certifications',
  achievements: 'Achievements'
};

export const CV_SECTION_KEYS: readonly string[] = Object.keys(CV_SECTION_LABELS);

export function cvSectionLabel(key: string): string {
  return CV_SECTION_LABELS[key] ?? key;
}
