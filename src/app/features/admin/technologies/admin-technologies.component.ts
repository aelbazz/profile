import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, AdminTechnology } from '../../../core/services/admin-api.service';
import { ConfigDataService } from '../../../core/services';
import { describeApiError } from '../admin-error';

@Component({
  selector: 'app-admin-technologies',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-technologies.component.html',
  styleUrls: ['./admin-technologies.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminTechnologiesComponent {
  private readonly api = inject(AdminApiService);
  private readonly configData = inject(ConfigDataService);

  readonly items = signal<AdminTechnology[] | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly search = signal('');

  readonly newName = signal('');
  readonly editingId = signal<string | null>(null);
  readonly editingName = signal('');
  readonly confirmDeleteId = signal<string | null>(null);

  readonly filtered = computed(() => {
    const rows = this.items();
    if (!rows) return null;

    const term = this.search().trim().toLowerCase();
    return term ? rows.filter(t => t.name.toLowerCase().includes(term)) : rows;
  });

  /** Technologies attached to nothing - usually left behind after deleting a project. */
  readonly orphanCount = computed(
    () => this.items()?.filter(t => !t.experienceCount && !t.projectCount).length ?? 0
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getTechnologies().subscribe({
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

  create(): void {
    const name = this.newName().trim();
    if (!name || this.busy()) return;

    this.busy.set(true);
    this.error.set(null);

    this.api.createTechnology(name).subscribe({
      next: tech => {
        this.busy.set(false);
        this.newName.set('');
        // The API upserts, so an existing name returns the existing row rather than adding one.
        this.notice.set(`Saved "${tech.name}".`);
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(describeApiError(e));
      }
    });
  }

  startEdit(item: AdminTechnology): void {
    this.editingId.set(item.id);
    this.editingName.set(item.name);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editingName.set('');
  }

  saveEdit(id: string): void {
    const name = this.editingName().trim();
    if (!name || this.busy()) return;

    this.busy.set(true);

    this.api.updateTechnology(id, name).subscribe({
      next: () => {
        this.busy.set(false);
        this.cancelEdit();
        this.notice.set('Technology renamed.');
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
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
    this.busy.set(true);

    this.api.deleteTechnology(id).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirmDeleteId.set(null);
        this.notice.set('Technology deleted and detached everywhere.');
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.confirmDeleteId.set(null);
        this.error.set(describeApiError(e));
      }
    });
  }
}
