import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ConfigDataService } from '../../../core/services';
import { describeApiError } from '../admin-error';
import { ColumnConfig, ENTITY_CONFIGS, EntityConfig, FieldConfig } from './entity-configs';

/** A child item as the API returns it: `{ id, description, sortOrder }`. */
interface ChildRow {
  description?: string;
  name?: string;
}

/**
 * One page driving four entities, selected by the `entity` value on the route.
 * See entity-configs.ts for why these four share a component and the others do not.
 */
@Component({
  selector: 'app-admin-entity',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-entity.component.html',
  styleUrls: ['./admin-entity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEntityComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly configData = inject(ConfigDataService);
  private readonly route = inject(ActivatedRoute);

  readonly config: EntityConfig;

  readonly items = signal<Record<string, unknown>[] | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

  form: FormGroup;

  /** Fields that take a repeatable list of strings, rendered separately from scalars. */
  readonly arrayFields = computed(() => this.config.fields.filter(f => f.type === 'stringArray'));
  readonly scalarFields = computed(() => this.config.fields.filter(f => f.type !== 'stringArray'));

  constructor() {
    const key = this.route.snapshot.data['entity'] as string;
    const config = ENTITY_CONFIGS[key];

    if (!config) {
      // A routing mistake, not a user error - fail loudly rather than rendering a blank page.
      throw new Error(`No admin entity config registered for "${key}"`);
    }

    this.config = config;
    this.form = this.buildForm();
    this.load();
  }

  private buildForm(): FormGroup {
    const controls: Record<string, unknown> = {};

    for (const field of this.config.fields) {
      if (field.type === 'stringArray') {
        controls[field.key] = this.fb.array([]);
      } else if (field.type === 'checkbox') {
        controls[field.key] = this.fb.nonNullable.control(false);
      } else if (field.type === 'number') {
        controls[field.key] = this.fb.control<number | null>(null);
      } else {
        const validators = field.required ? [Validators.required] : [];
        if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));
        controls[field.key] = this.fb.nonNullable.control('', validators);
      }
    }

    if (this.config.hasPublishToggle) {
      controls['isPublished'] = this.fb.nonNullable.control(true);
    }

    return this.fb.group(controls);
  }

  arrayFor(key: string): FormArray {
    return this.form.get(key) as FormArray;
  }

  controlInvalid(key: string): boolean {
    const control = this.form.get(key);
    return !!control && control.touched && control.invalid;
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.config.list(this.api).subscribe({
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

  startEdit(item: Record<string, unknown>): void {
    this.resetForm();

    for (const field of this.config.fields) {
      const value = item[field.key];

      if (field.type === 'stringArray') {
        const array = this.arrayFor(field.key);
        for (const entry of this.toStringList(value)) {
          array.push(this.fb.nonNullable.control(entry, Validators.required));
        }
      } else if (field.type === 'checkbox') {
        this.form.get(field.key)?.setValue(value === true);
      } else if (field.type === 'number') {
        this.form.get(field.key)?.setValue(value ?? null);
      } else {
        this.form.get(field.key)?.setValue(value == null ? '' : String(value));
      }
    }

    if (this.config.hasPublishToggle) {
      this.form.get('isPublished')?.setValue(item['isPublished'] !== false);
    }

    this.editingId.set(String(item['id']));
    this.notice.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.error.set(null);
  }

  addArrayItem(key: string): void {
    this.arrayFor(key).push(this.fb.nonNullable.control('', Validators.required));
  }

  removeArrayItem(key: string, index: number): void {
    this.arrayFor(key).removeAt(index);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue() as Record<string, unknown>;
    const body: Record<string, unknown> = {};

    for (const field of this.config.fields) {
      const value = raw[field.key];

      if (field.type === 'stringArray') {
        // Always sent, so the server replaces the collection and array order becomes sortOrder.
        body[field.key] = (value as string[]).map(v => v.trim()).filter(Boolean);
      } else if (field.type === 'checkbox') {
        body[field.key] = value === true;
      } else if (field.type === 'number') {
        if (value !== null && value !== '') body[field.key] = Number(value);
      } else {
        const text = String(value ?? '').trim();
        // Blank optionals are omitted: the API validates URLs and would reject ''.
        if (text) body[field.key] = text;
        else if (field.required) body[field.key] = text;
      }
    }

    if (this.config.hasPublishToggle) {
      body['isPublished'] = raw['isPublished'] === true;
    }

    const id = this.editingId();
    const request = id
      ? this.config.update(this.api, id, body)
      : this.config.create(this.api, body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notice.set(id ? `Updated ${this.config.singular}.` : `Created ${this.config.singular}.`);
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

    this.config.remove(this.api, id).subscribe({
      next: () => {
        this.saving.set(false);
        this.confirmDeleteId.set(null);
        this.notice.set(`Deleted ${this.config.singular}.`);
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

  togglePublished(item: Record<string, unknown>): void {
    const id = String(item['id']);

    this.config.update(this.api, id, { isPublished: item['isPublished'] === false }).subscribe({
      next: () => {
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => this.error.set(describeApiError(e))
    });
  }

  /** Renders a cell: counts for list columns, plain text otherwise. */
  cellValue(item: Record<string, unknown>, column: ColumnConfig): string {
    const value = item[column.key];

    if (column.isCount) {
      return Array.isArray(value) ? `${value.length}` : '0';
    }
    return value == null || value === '' ? '—' : String(value);
  }

  secondaryValue(item: Record<string, unknown>, column: ColumnConfig): string | null {
    if (!column.secondaryKey) return null;
    const value = item[column.secondaryKey];
    return value == null || value === '' ? null : String(value);
  }

  isPublished(item: Record<string, unknown>): boolean {
    return item['isPublished'] !== false;
  }

  trackField(_index: number, field: FieldConfig): string {
    return field.key;
  }

  /**
   * Child collections arrive either as plain strings (course topics) or as
   * `{ description }` rows (management responsibilities). Both flatten to strings here.
   */
  private toStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value
      .map(entry => {
        if (typeof entry === 'string') return entry;
        const row = entry as ChildRow;
        return row.description ?? row.name ?? '';
      })
      .filter(Boolean);
  }

  private resetForm(): void {
    for (const field of this.config.fields) {
      if (field.type === 'stringArray') {
        this.arrayFor(field.key).clear();
      } else if (field.type === 'checkbox') {
        this.form.get(field.key)?.setValue(false);
      } else if (field.type === 'number') {
        this.form.get(field.key)?.setValue(null);
      } else {
        this.form.get(field.key)?.setValue('');
      }
    }

    if (this.config.hasPublishToggle) {
      this.form.get('isPublished')?.setValue(true);
    }

    this.form.markAsUntouched();
  }
}
