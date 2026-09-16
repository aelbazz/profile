import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ConfigDataService } from '../../../core/services';
import { describeApiError } from '../admin-error';

@Component({
  selector: 'app-admin-person',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-person.component.html',
  styleUrls: ['./admin-person.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPersonComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly configData = inject(ConfigDataService);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    title: ['', [Validators.required, Validators.maxLength(300)]],
    summary: ['', [Validators.required, Validators.maxLength(5000)]],
    location: ['', [Validators.required, Validators.maxLength(200)]],
    yearsOfExperience: [0, [Validators.required, Validators.min(0), Validators.max(80)]],
    avatar: ['', [Validators.required, Validators.maxLength(500)]],
    tagline: ['', [Validators.required, Validators.maxLength(500)]],
    linkedin: [''],
    birthday: ['']
  });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getPerson().subscribe({
      next: person => {
        this.form.patchValue({
          name: person.name,
          title: person.title,
          summary: person.summary,
          location: person.location,
          yearsOfExperience: person.yearsOfExperience,
          avatar: person.avatar,
          tagline: person.tagline,
          linkedin: person.linkedin ?? '',
          birthday: person.birthday ?? ''
        });
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.loading.set(false);
      }
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.saved.set(false);

    const raw = this.form.getRawValue();
    // The API rejects unknown and empty-string URLs, so optional blanks are omitted
    // entirely rather than sent as ''.
    const body: Record<string, unknown> = {
      name: raw.name,
      title: raw.title,
      summary: raw.summary,
      location: raw.location,
      yearsOfExperience: raw.yearsOfExperience,
      avatar: raw.avatar,
      tagline: raw.tagline
    };
    if (raw.linkedin.trim()) body['linkedin'] = raw.linkedin.trim();
    if (raw.birthday.trim()) body['birthday'] = raw.birthday.trim();

    this.api.updatePerson(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        // The public site caches the profile in memory; drop it so the change shows.
        this.configData.invalidate();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(describeApiError(e));
      }
    });
  }
}
