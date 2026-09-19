import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { PLATFORM_BRANDING } from '../config/platform-branding.config';

/**
 * Thin wrapper over Angular's Title/Meta services - the only two SEO primitives this app
 * uses. Updates the DOM after bootstrap, which is enough for the browser tab and for
 * Googlebot (which executes JS); it does nothing for link-preview bots (Slack, Twitter,
 * LinkedIn), which read the raw index.html and never run Angular. Fixing that needs
 * SSR/prerendering, a separate, much larger change - see docs/ANGULAR-INTEGRATION.md.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  /** Sets tags for a Portfolio marketing page. */
  setMarketingSeo(page: { title: string; description: string }): void {
    const fullTitle =
      page.title === PLATFORM_BRANDING.name
        ? PLATFORM_BRANDING.seo.defaultTitle
        : `${page.title}${PLATFORM_BRANDING.seo.titleSuffix}`;

    this.apply(fullTitle, page.description);
  }

  /** Sets tags for a tenant's own public profile - never the platform's own title/description. */
  setTenantSeo(tenantName: string, summary: string | null): void {
    this.apply(
      `${tenantName} — Professional Portfolio`,
      summary?.trim() || `${tenantName}'s professional portfolio, built on ${PLATFORM_BRANDING.name}.`
    );
  }

  private apply(title: string, description: string): void {
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
  }
}
