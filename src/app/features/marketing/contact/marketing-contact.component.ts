import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SeoService } from '../../../core/services/seo.service';
import { ContactSubmissionApiService } from '../../../core/services/contact-submission-api.service';
import { PLATFORM_BRANDING } from '../../../core/config/platform-branding.config';

@Component({
  selector: 'app-marketing-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './marketing-contact.component.html',
  styleUrl: './marketing-contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketingContactComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ContactSubmissionApiService);
  private readonly seo = inject(SeoService);

  readonly platformName = PLATFORM_BRANDING.name;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    phone: ['', [Validators.maxLength(50)]],
    company: ['', [Validators.maxLength(200)]],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]],
    // Honeypot: real visitors never see or fill this field - see the template and .scss.
    website: ['']
  });

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Captured on init for the backend's minimum-fill-time spam check. */
  private readonly formLoadedAt = new Date().toISOString();

  ngOnInit(): void {
    this.seo.setMarketingSeo({
      title: 'Contact',
      description: `Get in touch with the ${this.platformName} team.`
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { website, ...rest } = this.form.getRawValue();

    this.api
      .submit({
        ...rest,
        phone: rest.phone || undefined,
        company: rest.company || undefined,
        honeypot: website || undefined,
        formLoadedAt: this.formLoadedAt
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.submitted.set(true);
          this.form.reset();
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          this.errorMessage.set(this.describe(error));
        }
      });
  }

  private describe(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Could not reach the server. Please try again in a moment.';
    }
    if (error.status === 429) {
      return 'Too many attempts. Please wait a minute before trying again.';
    }
    return 'Something went wrong sending your message. Please try again.';
  }
}
