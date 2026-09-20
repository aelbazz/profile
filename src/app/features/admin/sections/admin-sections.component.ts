import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminApiService, SectionInfo } from '../../../core/services/admin-api.service';
import { ConfigDataService } from '../../../core/services';
import { describeApiError } from '../admin-error';

/**
 * Which sections show on the public site, and in what order. One clear label - "Show on my
 * site" - rather than mixing enabled/active/published/visible terminology; see
 * docs/SAAS-ARCHITECTURE.md §14 on the backend for why this is a dedicated ClientSection
 * table rather than the old WebsiteSettings array fields.
 */
@Component({
  selector: 'app-admin-sections',
  standalone: true,
  imports: [],
  templateUrl: './admin-sections.component.html',
  styleUrls: ['./admin-sections.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSectionsComponent {
  private readonly api = inject(AdminApiService);
  private readonly configData = inject(ConfigDataService);

  readonly sections = signal<SectionInfo[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getSections().subscribe({
      next: sections => {
        this.sections.set([...sections].sort((a, b) => a.displayOrder - b.displayOrder));
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.loading.set(false);
      }
    });
  }

  toggle(section: SectionInfo): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);

    this.api.updateSection(section.sectionKey, !section.enabled).subscribe({
      next: sections => {
        this.sections.set([...sections].sort((a, b) => a.displayOrder - b.displayOrder));
        this.busy.set(false);
        this.configData.invalidate();
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.busy.set(false);
      }
    });
  }

  moveUp(index: number): void {
    if (index > 0) this.swapAndSave(index, index - 1);
  }

  moveDown(index: number): void {
    if (index < this.sections().length - 1) this.swapAndSave(index, index + 1);
  }

  private swapAndSave(indexA: number, indexB: number): void {
    if (this.busy()) return;

    const reordered = [...this.sections()];
    [reordered[indexA], reordered[indexB]] = [reordered[indexB], reordered[indexA]];

    this.busy.set(true);
    this.error.set(null);

    const entries = reordered.map((s, i) => ({ sectionKey: s.sectionKey, displayOrder: i + 1 }));

    this.api.reorderSections(entries).subscribe({
      next: sections => {
        this.sections.set([...sections].sort((a, b) => a.displayOrder - b.displayOrder));
        this.busy.set(false);
        this.configData.invalidate();
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.busy.set(false);
      }
    });
  }

  trackSection(_index: number, section: SectionInfo): string {
    return section.sectionKey;
  }
}
