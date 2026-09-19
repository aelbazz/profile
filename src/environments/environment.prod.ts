/**
 * Production environment.
 *
 * Replace apiBaseUrl with the deployed backend origin before building for GitHub Pages.
 * It must be HTTPS, and its CORS_ORIGINS must include https://aelbazz.github.io
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://REPLACE-WITH-YOUR-BACKEND-DOMAIN/api/v1',
};
