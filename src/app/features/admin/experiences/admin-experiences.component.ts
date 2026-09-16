import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, AdminExperience } from '../../../core/services/admin-api.service';
import { ConfigDataService } from '../../../core/services';
import { describeApiError } from '../admin-error';

@Component({
  selector: 'app-admin-experiences',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-experiences.component.html',
  styleUrls: ['./admin-experiences.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminExperiencesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly configData = inject(ConfigDataService);

  readonly items = signal<AdminExperience[] | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  /** null = list view, '' = creating, otherwise the id being edited. */
  readonly editingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    company: ['', [Validators.required, Validators.maxLength(200)]],
    companyFullName: [''],
    companyLogo: [''],
    companyWebsite: [''],
    companyDescription: [''],
    position: ['', [Validators.required, Validators.maxLength(300)]],
    location: ['', [Validators.required, Validators.maxLength(200)]],
    startDate: ['', [Validators.required, Validators.maxLength(50)]],
    endDate: [''],
    isCurrent: [false],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    isPublished: [true],
    responsibilities: this.fb.array<ReturnType<FormBuilder['control']>>([]),
    achievements: this.fb.array<ReturnType<FormBuilder['control']>>([]),
    technologies: this.fb.array<ReturnType<FormBuilder['control']>>([])
  });

  constructor() {
    this.load();
  }

  get responsibilities(): FormArray {
    return this.form.controls.responsibilities as unknown as FormArray;
  }

  get achievements(): FormArray {
    return this.form.controls.achievements as unknown as FormArray;
  }

  get technologies(): FormArray {
    return this.form.controls.technologies as unknown as FormArray;
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getExperiences().subscribe({
      next: rows => {
        this.items.set(rows);
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.loading.set(false);
      }
    });
  }

  startCreate(): void {
    this.resetForm();
    this.editingId.set('');
    this.notice.set(null);
  }

  startEdit(item: AdminExperience): void {
    this.resetForm();

    this.form.patchValue({
      company: item.company,
      companyFullName: item.companyFullName ?? '',
      companyLogo: item.companyLogo ?? '',
      companyWebsite: item.companyWebsite ?? '',
      companyDescription: item.companyDescription ?? '',
      position: item.position,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate ?? '',
      isCurrent: item.isCurrent,
      description: item.description,
      isPublished: item.isPublished
    });

    for (const r of item.responsibilities) {
      this.responsibilities.push(this.fb.nonNullable.control(r.description, Validators.required));
    }
    for (const a of item.achievements) {
      this.achievements.push(this.fb.nonNullable.control(a.description, Validators.required));
    }
    for (const t of item.technologies) {
      this.technologies.push(this.fb.nonNullable.control(t, Validators.required));
    }

    this.editingId.set(item.id);
    this.notice.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.error.set(null);
  }

  addResponsibility(): void {
    this.responsibilities.push(this.fb.nonNullable.control('', Validators.required));
  }

  addAchievement(): void {
    this.achievements.push(this.fb.nonNullable.control('', Validators.required));
  }

  addTechnology(): void {
    this.technologies.push(this.fb.nonNullable.control('', Validators.required));
  }

  removeAt(array: FormArray, index: number): void {
    array.removeAt(index);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const body: Record<string, unknown> = {
      company: raw.company,
      position: raw.position,
      location: raw.location,
      startDate: raw.startDate,
      isCurrent: raw.isCurrent,
      description: raw.description,
      isPublished: raw.isPublished,
      // Sent explicitly so the arrays are replaced, with array position as sortOrder.
      responsibilities: (raw.responsibilities as string[]).map(v => v.trim()).filter(Boolean),
      achievements: (raw.achievements as string[]).map(v => v.trim()).filter(Boolean),
      technologies: (raw.technologies as string[]).map(v => v.trim()).filter(Boolean)
    };

    // Optional strings are omitted when blank: the API validates URLs and would reject ''.
    if (raw.companyFullName.trim()) body['companyFullName'] = raw.companyFullName.trim();
    if (raw.companyLogo.trim()) body['companyLogo'] = raw.companyLogo.trim();
    if (raw.companyWebsite.trim()) body['companyWebsite'] = raw.companyWebsite.trim();
    if (raw.companyDescription.trim()) body['companyDescription'] = raw.companyDescription.trim();
    if (raw.endDate.trim()) body['endDate'] = raw.endDate.trim();

    const id = this.editingId();
    const request = id
      ? this.api.updateExperience(id, body)
      : this.api.createExperience(body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notice.set(id ? 'Experience updated.' : 'Experience created.');
        this.editingId.set(null);
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(describeApiError(e));
      }
    });
  }

  askDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(id: string): void {
    this.saving.set(true);

    this.api.deleteExperience(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.confirmDeleteId.set(null);
        this.notice.set('Experience deleted.');
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.confirmDeleteId.set(null);
        this.error.set(describeApiError(e));
      }
    });
  }

  /** Publish/unpublish without opening the full form. */
  togglePublished(item: AdminExperience): void {
    this.api.updateExperience(item.id, { isPublished: !item.isPublished }).subscribe({
      next: () => {
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => this.error.set(describeApiError(e))
    });
  }

  private resetForm(): void {
    this.form.reset({
      company: '', companyFullName: '', companyLogo: '', companyWebsite: '',
      companyDescription: '', position: '', location: '', startDate: '', endDate: '',
      isCurrent: false, description: '', isPublished: true
    });
    this.responsibilities.clear();
    this.achievements.clear();
    this.technologies.clear();
  }
}
