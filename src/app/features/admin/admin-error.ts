import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns an API error into something an admin can act on.
 *
 * The API returns validation failures as a string array in `message`; surfacing them
 * verbatim is what tells the admin which field was rejected and why.
 */
export function describeApiError(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the API. Is the backend running?';
  }

  const body = error.error as { message?: string | string[] } | undefined;

  if (Array.isArray(body?.message)) {
    return body.message.join(' · ');
  }
  if (typeof body?.message === 'string') {
    return body.message;
  }

  if (error.status === 401) return 'Your session has expired. Please sign in again.';
  if (error.status === 403) return 'You do not have permission to do that.';
  if (error.status === 404) return 'That record no longer exists.';
  if (error.status === 409) return 'A record with those values already exists.';
  if (error.status === 429) return 'Too many requests. Wait a moment and try again.';

  return 'Something went wrong. Please try again.';
}
