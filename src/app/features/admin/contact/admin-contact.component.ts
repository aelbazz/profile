import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ConfigDataService } from '../../../core/services';
import { describeApiError } from '../admin-error';

@Component({
  selector: 'app-admin-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-contact.component.html',
  styleUrls: ['./admin-contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly configData = inject(ConfigDataService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    whatsapp: ['', Validators.required],
    linkedin: ['', Validators.required],
    location: [''],
    birthday: [''],
    muchskills: [''],
    socialLinks: this.fb.array<ReturnType<AdminContactComponent['createLink']>>([])
  });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  get socialLinks(): FormArray {
    return this.form.controls.socialLinks as unknown as FormArray;
  }

  constructor() {
    this.load();
  }

  private createLink(platform = '', url = '', icon = '') {
    return this.fb.nonNullable.group({
      platform: [platform, Validators.required],
      url: [url, Validators.required],
      icon: [icon]
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getContact().subscribe({
      next: contact => {
        this.form.patchValue({
          email: contact.email,
          phone: contact.phone,
          whatsapp: contact.whatsapp,
          linkedin: contact.linkedin,
          location: contact.location ?? '',
          birthday: contact.birthday ?? '',
          muchskills: contact.muchskills ?? ''
        });

        this.socialLinks.clear();
        for (const link of contact.socialLinks) {
          this.socialLinks.push(this.createLink(link.platform, link.url, link.icon ?? ''));
        }
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.loading.set(false);
      }
    });
  }

  addLink(): void {
    this.socialLinks.push(this.createLink());
  }

  removeLink(index: number): void {
    this.socialLinks.removeAt(index);
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
    const body: Record<string, unknown> = {
      email: raw.email,
      phone: raw.phone,
      whatsapp: raw.whatsapp,
      linkedin: raw.linkedin,
      // Array position becomes sortOrder on the server, so display order follows the form.
      socialLinks: raw.socialLinks.map((link, index) => {
        const entry: Record<string, unknown> = {
          platform: link.platform,
          url: link.url,
          sortOrder: index
        };
        if (link.icon?.trim()) entry['icon'] = link.icon.trim();
        return entry;
      })
    };
    if (raw.location.trim()) body['location'] = raw.location.trim();
    if (raw.birthday.trim()) body['birthday'] = raw.birthday.trim();
    if (raw.muchskills.trim()) body['muchskills'] = raw.muchskills.trim();

    this.api.updateContact(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        this.configData.invalidate();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(describeApiError(e));
      }
    });
  }
}
