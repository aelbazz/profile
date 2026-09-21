import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AdminApiService,
  AdminExperience,
  AdminProject,
  CvDocument,
  CvVersion
} from '../../../core/services/admin-api.service';
import { describeApiError } from '../admin-error';
import { CvConfigPanelComponent } from './cv-config-panel.component';
import { CvPreviewPaneComponent } from './cv-preview-pane.component';

/**
 * The CV Builder: pick/create/delete a saved CV configuration ("version"), edit it, and
 * download the ATS-safe PDF/DOCX it resolves to. Owns all API calls; CvConfigPanelComponent
 * and CvPreviewPaneComponent are purely presentational.
 *
 * `GET tenant/cv/versions` returns full CvVersion rows (not a slimmed summary, despite the
 * backend's Swagger annotation - no serialization interceptor is registered), so the
 * selected version's full config comes straight from that list - no second per-version
 * fetch is needed, only the preview.
 */
@Component({
  selector: 'app-admin-cv',
  standalone: true,
  imports: [CvConfigPanelComponent, CvPreviewPaneComponent],
  templateUrl: './admin-cv.component.html',
  styleUrls: ['./admin-cv.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCvComponent {
  private readonly api = inject(AdminApiService);

  readonly versions = signal<CvVersion[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly previewDoc = signal<CvDocument | null>(null);
  readonly experiences = signal<AdminExperience[]>([]);
  readonly projects = signal<AdminProject[]>([]);

  readonly loading = signal(true);
  readonly previewLoading = signal(false);
  readonly busy = signal(false);
  readonly downloading = signal<'pdf' | 'docx' | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);

  readonly currentVersion = computed<CvVersion | null>(
    () => this.versions().find(v => v.id === this.selectedId()) ?? null
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    // Person-level, not version-scoped - loaded once regardless of which version is selected.
    this.api.getExperiences().subscribe({ next: rows => this.experiences.set(rows) });
    this.api.getProjects().subscribe({ next: rows => this.projects.set(rows) });

    this.api.getCvVersions().subscribe({
      next: versions => {
        this.versions.set(versions);
        this.loading.set(false);
        const initial = versions.find(v => v.isDefault) ?? versions[0] ?? null;
        if (initial) this.selectVersion(initial.id);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.loading.set(false);
      }
    });
  }

  selectVersion(id: string): void {
    this.selectedId.set(id);
    this.notice.set(null);
    this.loadPreview(id);
  }

  private loadPreview(id: string): void {
    this.previewLoading.set(true);
    this.error.set(null);

    this.api.getCvPreview(id).subscribe({
      next: doc => {
        this.previewDoc.set(doc);
        this.previewLoading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.previewLoading.set(false);
      }
    });
  }

  createVersion(): void {
    if (this.busy()) return;

    const existingNames = new Set(this.versions().map(v => v.name));
    let name = 'New CV';
    for (let n = 2; existingNames.has(name); n++) {
      name = `New CV ${n}`;
    }

    this.busy.set(true);
    this.error.set(null);

    this.api.createCvVersion({ name }).subscribe({
      next: created => {
        this.busy.set(false);
        this.notice.set(`Created "${created.name}".`);
        this.versions.update(list => [...list, created]);
        this.selectVersion(created.id);
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(describeApiError(e));
      }
    });
  }

  onConfigSave(patch: Record<string, unknown>): void {
    const id = this.selectedId();
    if (!id || this.busy()) return;

    this.busy.set(true);
    this.error.set(null);

    this.api.updateCvVersion(id, patch).subscribe({
      next: updated => {
        this.busy.set(false);
        this.notice.set('Saved.');
        this.versions.update(list => list.map(v => (v.id === id ? updated : v)));
        this.loadPreview(id);
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(describeApiError(e));
      }
    });
  }

  setDefault(id: string): void {
    if (this.busy() || this.currentVersion()?.isDefault) return;

    this.busy.set(true);
    this.error.set(null);

    this.api.setDefaultCvVersion(id).subscribe({
      next: updated => {
        this.busy.set(false);
        this.notice.set(`"${updated.name}" is now your default CV.`);
        this.versions.update(list => list.map(v => ({ ...v, isDefault: v.id === updated.id })));
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
    this.error.set(null);

    this.api.deleteCvVersion(id).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirmDeleteId.set(null);
        this.notice.set('CV version deleted.');
        const remaining = this.versions().filter(v => v.id !== id);
        this.versions.set(remaining);

        if (this.selectedId() === id) {
          const next = remaining.find(v => v.isDefault) ?? remaining[0] ?? null;
          if (next) {
            this.selectVersion(next.id);
          } else {
            this.selectedId.set(null);
            this.previewDoc.set(null);
          }
        }
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.confirmDeleteId.set(null);
        this.error.set(describeApiError(e));
      }
    });
  }

  download(format: 'pdf' | 'docx'): void {
    const id = this.selectedId();
    const version = this.currentVersion();
    if (!id || !version || this.downloading()) return;

    this.downloading.set(format);
    this.error.set(null);

    this.api.downloadCvVersion(id, format).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${version.name}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.downloading.set(null);
      },
      error: (e: HttpErrorResponse) => {
        this.downloading.set(null);
        this.error.set(describeApiError(e));
      }
    });
  }

  trackVersion(_index: number, version: CvVersion): string {
    return version.id;
  }
}
