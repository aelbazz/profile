/**
 * Development environment.
 *
 * The backend runs on 3333 locally because port 3000 is commonly occupied.
 * Change this if you start the API elsewhere - no component should ever know the URL.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3333/api/v1',
  /**
   * Which tenant this deployment shows. Every profile is a tenant, so one build serves
   * one person; the API exposes the others at /public/tenants/<their slug>/profile.
   */
  profileSlug: 'default',
};
