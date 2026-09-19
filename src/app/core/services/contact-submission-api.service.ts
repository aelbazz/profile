import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContactSubmissionRequest } from '../models/contact-submission.model';

/**
 * Client for the Portfolio marketing site's contact form. Deliberately separate from
 * ProfileApiService/ConfigDataService - unrelated data, unrelated lifecycle, and it's the
 * one write a completely anonymous visitor can make.
 */
@Injectable({ providedIn: 'root' })
export class ContactSubmissionApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  submit(payload: ContactSubmissionRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/contact-submissions`, payload);
  }
}
