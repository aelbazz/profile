/**
 * Production environment.
 *
 * Replace apiBaseUrl with the deployed backend origin before building for GitHub Pages.
 * It must be HTTPS, and its CORS_ORIGINS must include https://aelbazz.github.io
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://REPLACE-WITH-YOUR-BACKEND-DOMAIN/api/v1',
  /**
   * Which tenant this deployment shows. Every profile is a tenant, so one build serves
   * one person; the API exposes the others at /public/tenants/<their slug>/profile.
   */
  profileSlug: 'default',
};
