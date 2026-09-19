/**
 * Portfolio's own platform-level branding - name, contact details, social links, SEO
 * defaults. Deliberately separate from any tenant's branding (TenantTheme/WebsiteSettings
 * on the backend): changing a tenant's theme must never change what Portfolio itself looks
 * like, and vice versa.
 *
 * A static config for now, not a database-backed model - nothing today lets an admin edit
 * this live, and no Admin/Coordinator Angular UI exists yet. Structured as one typed object
 * so a future "platform settings" backend model can replace this file without touching every
 * call site.
 */
export interface PlatformBranding {
  readonly name: string;
  readonly tagline: string;
  readonly contactEmail: string;
  readonly socialLinks: readonly { readonly platform: string; readonly url: string; readonly icon: string }[];
  readonly seo: {
    readonly defaultTitle: string;
    readonly defaultDescription: string;
    readonly titleSuffix: string;
  };
}

export const PLATFORM_BRANDING: PlatformBranding = {
  name: 'Portfolio',
  tagline: 'Professional portfolio websites for people who want a stronger online presence.',
  contactEmail: 'hello@portfolio.example',
  socialLinks: [
    { platform: 'LinkedIn', url: 'https://www.linkedin.com', icon: 'fab fa-linkedin' }
  ],
  seo: {
    defaultTitle: 'Portfolio — Professional Portfolio Platform',
    defaultDescription:
      'Portfolio gives professionals and businesses a polished, easy-to-manage online profile - without building or maintaining a website from scratch.',
    titleSuffix: ' — Portfolio'
  }
};
