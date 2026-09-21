import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminExperience,
  AdminProject,
  CvSectionConfigEntry,
  CvVersion
} from '../../../core/services/admin-api.service';
import { cvSectionLabel } from './cv-section-labels';

interface ContactToggle {
  readonly field: keyof Pick<
    CvVersion,
    'includePhone' | 'includeEmail' | 'includeLinkedin' | 'includeGithub' | 'includePortfolio'
  >;
  readonly label: string;
}

const CONTACT_TOGGLES: readonly ContactToggle[] = [
  { field: 'includeEmail', label: 'Email' },
  { field: 'includePhone', label: 'Phone' },
  { field: 'includeLinkedin', label: 'LinkedIn' },
  { field: 'includeGithub', label: 'GitHub' },
  { field: 'includePortfolio', label: 'Portfolio' }
];

/**
 * Left-hand editor for one CvVersion's configuration. Purely presentational + local draft
 * state - every change is emitted via `save` as a partial PATCH body; the parent
 * (AdminCvComponent) owns the actual API call and error/busy state, same division of
 * responsibility as CvPreviewPaneComponent.
 *
 * Text fields (name/cvTitle/cvSummary) use an explicit "Save details" button rather than
 * saving per keystroke - matching AdminPersonComponent's form. Toggles, section order, and
 * per-item inclusion save immediately on change - matching AdminSectionsComponent.
 */
@Component({
  selector: 'app-cv-config-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cv-config-panel.component.html',
  styleUrls: ['./cv-config-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CvConfigPanelComponent implements OnChanges {
  @Input({ required: true }) version!: CvVersion;
  @Input() experiences: AdminExperience[] = [];
  @Input() projects: AdminProject[] = [];
  @Input() busy = false;

  @Output() save = new EventEmitter<Record<string, unknown>>();

  readonly contactToggles = CONTACT_TOGGLES;
  readonly cvSectionLabel = cvSectionLabel;

  nameDraft = '';
  titleDraft = '';
  summaryDraft = '';

  private syncedVersionId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['version'] && this.version && this.version.id !== this.syncedVersionId) {
      this.nameDraft = this.version.name;
      this.titleDraft = this.version.cvTitle ?? '';
      this.summaryDraft = this.version.cvSummary ?? '';
      this.syncedVersionId = this.version.id;
    }
  }

  get detailsDirty(): boolean {
    return (
      this.nameDraft.trim() !== this.version.name ||
      this.titleDraft.trim() !== (this.version.cvTitle ?? '') ||
      this.summaryDraft.trim() !== (this.version.cvSummary ?? '')
    );
  }

  saveDetails(): void {
    if (this.busy || !this.nameDraft.trim()) return;
    this.save.emit({
      name: this.nameDraft.trim(),
      // Blank clears the override back to the live profile title/summary - see
      // cv-builder.service.ts's `version.cvTitle ?? person.title` fallback (only null/
      // undefined trigger it, so an override must be cleared to null, not '').
      cvTitle: this.titleDraft.trim() || null,
      cvSummary: this.summaryDraft.trim() || null
    });
  }

  toggleContact(field: ContactToggle['field']): void {
    if (this.busy) return;
    this.save.emit({ [field]: !this.version[field] });
  }

  toggleManagement(): void {
    if (this.busy) return;
    this.save.emit({ includeManagement: !this.version.includeManagement });
  }

  toggleSection(entry: CvSectionConfigEntry): void {
    if (this.busy) return;
    const sectionConfig = this.version.sectionConfig.map(s =>
      s.key === entry.key ? { key: s.key, enabled: !s.enabled } : s
    );
    this.save.emit({ sectionConfig });
  }

  moveSection(index: number, direction: -1 | 1): void {
    if (this.busy) return;
    const target = index + direction;
    if (target < 0 || target >= this.version.sectionConfig.length) return;

    const reordered = [...this.version.sectionConfig];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    this.save.emit({ sectionConfig: reordered.map(s => ({ key: s.key, enabled: s.enabled })) });
  }

  isExperienceIncluded(id: string): boolean {
    return !this.version.excludedExperienceIds.includes(id);
  }

  toggleExperience(id: string): void {
    if (this.busy) return;
    const excludedExperienceIds = this.isExperienceIncluded(id)
      ? [...this.version.excludedExperienceIds, id]
      : this.version.excludedExperienceIds.filter(x => x !== id);
    this.save.emit({ excludedExperienceIds });
  }

  isProjectIncluded(id: string): boolean {
    return !this.version.excludedProjectIds.includes(id);
  }

  toggleProject(id: string): void {
    if (this.busy) return;
    const excludedProjectIds = this.isProjectIncluded(id)
      ? [...this.version.excludedProjectIds, id]
      : this.version.excludedProjectIds.filter(x => x !== id);
    this.save.emit({ excludedProjectIds });
  }

  trackSectionEntry(_index: number, entry: CvSectionConfigEntry): string {
    return entry.key;
  }
}
