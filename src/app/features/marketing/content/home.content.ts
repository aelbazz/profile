/**
 * Static content for the Portfolio home page, kept as structured data rather than inline
 * template strings so it can move to a backend-driven model later without touching the
 * component - see docs/SAAS-ARCHITECTURE.md. Not a CMS: there is exactly one home page, so
 * there is exactly one export.
 */

export interface Benefit {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export interface HowItWorksStep {
  readonly step: number;
  readonly title: string;
  readonly description: string;
}

export interface Feature {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

export interface Audience {
  readonly icon: string;
  readonly label: string;
}

export const HERO = {
  eyebrow: 'Professional portfolio platform',
  title: 'A polished online profile, without building a website from scratch',
  subtitle:
    'Portfolio gives professionals and businesses a modern, easy-to-manage public profile - experience, projects, skills and achievements, presented well and kept up to date from one control panel.',
  primaryCta: { label: 'Get Started', link: '/contact' },
  secondaryCta: { label: 'See an example', link: '/albaz' }
};

export const BENEFITS: readonly Benefit[] = [
  {
    icon: 'fas fa-globe',
    title: 'Professional online presence',
    description:
      'A polished, modern profile at your own address - no design work, hosting, or maintenance required.'
  },
  {
    icon: 'fas fa-palette',
    title: 'Easy customization',
    description:
      'Colors, theme, and every section of your content - experience, projects, skills, achievements - are yours to control.'
  },
  {
    icon: 'fas fa-link',
    title: 'A dedicated URL',
    description: 'Every client gets a memorable, human-readable address based on their own name.'
  },
  {
    icon: 'fas fa-sliders',
    title: 'Centralized management',
    description: 'Update your content from your own control panel - never by editing code.'
  },
  {
    icon: 'fas fa-shield-halved',
    title: 'Isolated by design',
    description:
      "Every client's data, branding, and configuration is fully separate from every other client's."
  },
  {
    icon: 'fas fa-headset',
    title: 'A managed experience',
    description:
      'Our team can help with onboarding, configuration, and content whenever you need a hand.'
  }
];

export const HOW_IT_WORKS: readonly HowItWorksStep[] = [
  {
    step: 1,
    title: 'Get in touch',
    description: 'Tell us a little about yourself or your business through the contact form.'
  },
  {
    step: 2,
    title: 'We set up your profile',
    description: 'Your own tenant is created with a dedicated address and starter theme.'
  },
  {
    step: 3,
    title: 'You take it from there',
    description:
      'Sign in to your control panel to add your experience, projects, skills and more.'
  },
  {
    step: 4,
    title: 'Share your profile',
    description: 'Your profile is live at your own address, ready to share with anyone.'
  }
];

export const FEATURES: readonly Feature[] = [
  { icon: 'fas fa-briefcase', title: 'Experience', description: 'A detailed work history, presented clearly.' },
  { icon: 'fas fa-folder-open', title: 'Projects', description: 'Showcase what you have built and shipped.' },
  { icon: 'fas fa-code', title: 'Skills & technologies', description: 'Show your strengths at a glance.' },
  { icon: 'fas fa-trophy', title: 'Achievements', description: 'Awards, recognitions, and milestones.' },
  { icon: 'fas fa-graduation-cap', title: 'Courses & training', description: 'Ongoing learning and certifications.' },
  { icon: 'fas fa-address-card', title: 'Contact', description: 'A clear, professional way for people to reach you.' }
];

export const AUDIENCES: readonly Audience[] = [
  { icon: 'fas fa-user-tie', label: 'Individual professionals' },
  { icon: 'fas fa-building', label: 'Consultancies & agencies' },
  { icon: 'fas fa-user-graduate', label: 'Job seekers' },
  { icon: 'fas fa-briefcase', label: 'Freelancers & contractors' }
];

/** Kept generic and data-driven so a second real example needs no code change - Albaz is
 *  the first tenant here, not a special case in how this section works. */
export const FIRST_CLIENT_EXAMPLE = {
  intro: 'Built for professionals who want a stronger online presence.',
  name: 'Albaz',
  description: 'is the first client using Portfolio to manage and present a professional digital profile.',
  link: '/albaz'
};
