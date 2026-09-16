import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, AdminProject } from '../../../core/services/admin-api.service';
import { ConfigDataService } from '../../../core/services';
import { describeApiError } from '../admin-error';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-projects.component.html',
  styleUrls: ['./admin-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProjectsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly configData = inject(ConfigDataService);

  readonly items = signal<AdminProject[] | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(300)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    role: ['', [Validators.required, Validators.maxLength(300)]],
    startDate: ['', [Validators.required, Validators.maxLength(50)]],
    endDate: [''],
    type: [''],
    company: [''],
    githubUrl: [''],
    liveUrl: [''],
    imageUrl: [''],
    isStrategicInitiative: [false],
    isCurrent: [false],
    isPublished: [true],
    highlights: this.fb.array<ReturnType<FormBuilder['control']>>([]),
    technologies: this.fb.array<ReturnType<FormBuilder['control']>>([])
  });

  constructor() {
    this.load();
  }

  get highlights(): FormArray {
    return this.form.controls.highlights as unknown as FormArray;
  }

  get technologies(): FormArray {
    return this.form.controls.technologies as unknown as FormArray;
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getProjects().subscribe({
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

  startEdit(item: AdminProject): void {
    this.resetForm();

    this.form.patchValue({
      name: item.name,
      description: item.description,
      role: item.role,
      startDate: item.startDate,
      endDate: item.endDate ?? '',
      type: item.type ?? '',
      company: item.company ?? '',
      githubUrl: item.githubUrl ?? '',
      liveUrl: item.liveUrl ?? '',
      imageUrl: item.imageUrl ?? '',
      isStrategicInitiative: item.isStrategicInitiative,
      isCurrent: item.isCurrent,
      isPublished: item.isPublished
    });

    for (const h of item.highlights) {
      this.highlights.push(this.fb.nonNullable.control(h.description, Validators.required));
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

  addHighlight(): void {
    this.highlights.push(this.fb.nonNullable.control('', Validators.required));
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
      name: raw.name,
      description: raw.description,
      role: raw.role,
      startDate: raw.startDate,
      isStrategicInitiative: raw.isStrategicInitiative,
      isCurrent: raw.isCurrent,
      isPublished: raw.isPublished,
      highlights: (raw.highlights as string[]).map(v => v.trim()).filter(Boolean),
      technologies: (raw.technologies as string[]).map(v => v.trim()).filter(Boolean)
    };

    // Blank optionals are omitted - the API validates URLs and rejects ''.
    if (raw.endDate.trim()) body['endDate'] = raw.endDate.trim();
    if (raw.type.trim()) body['type'] = raw.type.trim();
    if (raw.company.trim()) body['company'] = raw.company.trim();
    if (raw.githubUrl.trim()) body['githubUrl'] = raw.githubUrl.trim();
    if (raw.liveUrl.trim()) body['liveUrl'] = raw.liveUrl.trim();
    if (raw.imageUrl.trim()) body['imageUrl'] = raw.imageUrl.trim();

    const id = this.editingId();
    const request = id ? this.api.updateProject(id, body) : this.api.createProject(body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notice.set(id ? 'Project updated.' : 'Project created.');
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

    this.api.deleteProject(id).subscribe({
      next: () => {
        this.saving.set(false);
        this.confirmDeleteId.set(null);
        this.notice.set('Project deleted.');
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

  togglePublished(item: AdminProject): void {
    this.api.updateProject(item.id, { isPublished: !item.isPublished }).subscribe({
      next: () => {
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => this.error.set(describeApiError(e))
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '', description: '', role: '', startDate: '', endDate: '', type: '', company: '',
      githubUrl: '', liveUrl: '', imageUrl: '',
      isStrategicInitiative: false, isCurrent: false, isPublished: true
    });
    this.highlights.clear();
    this.technologies.clear();
  }
}
