/**
 * Structured so this list can move to a backend-managed catalog later without changing the
 * component - see docs/SAAS-ARCHITECTURE.md. One flat list for now, not a CMS.
 */
export interface ServiceItem {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export const SERVICES: readonly ServiceItem[] = [
  {
    icon: 'fas fa-globe',
    title: 'Professional portfolio websites',
    description: 'A complete, ready-to-share public profile at your own dedicated address.'
  },
  {
    icon: 'fas fa-id-badge',
    title: 'Personal branding',
    description: 'Present your experience and work under a coherent, professional identity.'
  },
  {
    icon: 'fas fa-file-lines',
    title: 'Custom profile pages',
    description: 'Every section of your profile - experience, projects, skills - is yours to shape.'
  },
  {
    icon: 'fas fa-palette',
    title: 'Theme & visual customization',
    description: 'Colors and layout that fit how you want to be presented.'
  },
  {
    icon: 'fas fa-pen-to-square',
    title: 'Content management',
    description: 'Add, edit, and reorder your content from your own control panel.'
  },
  {
    icon: 'fas fa-briefcase',
    title: 'Professional experience management',
    description: 'Keep your work history, responsibilities, and achievements current.'
  },
  {
    icon: 'fas fa-folder-open',
    title: 'Projects & achievements',
    description: 'Showcase what you have built, shipped, and been recognized for.'
  },
  {
    icon: 'fas fa-code',
    title: 'Skills & technologies',
    description: 'A clear picture of your strengths, at a glance.'
  },
  {
    icon: 'fas fa-address-card',
    title: 'Contact & profile management',
    description: 'A professional, always-current way for people to reach you.'
  },
  {
    icon: 'fas fa-building',
    title: 'Tenant-specific customization',
    description: 'Every client operates independently, with configuration suited to them.'
  },
  {
    icon: 'fas fa-arrows-rotate',
    title: 'Ongoing profile updates',
    description: 'Your profile evolves as your career or business does.'
  },
  {
    icon: 'fas fa-headset',
    title: 'Technical support',
    description: 'Help with onboarding, configuration, and anything in between.'
  }
];
