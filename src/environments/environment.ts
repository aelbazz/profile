/**
 * Development environment.
 *
 * The backend runs on 3333 locally because port 3000 is commonly occupied.
 * Change this if you start the API elsewhere - no component should ever know the URL.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3333/api/v1',
};
