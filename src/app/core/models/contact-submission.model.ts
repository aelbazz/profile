/**
 * A "contact us" inquiry sent to Portfolio itself from the marketing site - distinct from
 * Contact, which is a tenant's own published contact info on their profile page.
 */
export interface ContactSubmissionRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  /** Must stay empty. A hidden field real visitors never see or fill; a filled value marks
   *  a submission as spam without telling the submitter so. */
  honeypot?: string;
  /** ISO timestamp captured when the form first rendered, for a minimum-fill-time check. */
  formLoadedAt?: string;
}
