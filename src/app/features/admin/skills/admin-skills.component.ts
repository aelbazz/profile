import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AdminApiService,
  AdminSkill,
  AdminSkillCategory
} from '../../../core/services/admin-api.service';
import { ConfigDataService } from '../../../core/services';
import { describeApiError } from '../admin-error';

/** Mirrors the tier names the public Skills page shows for each level. */
const TIER_NAMES: Record<number, string> = {
  0: 'Unranked',
  1: 'Starting',
  2: 'Learning',
  3: 'Assisting',
  4: 'Applying',
  5: 'Understanding',
  6: 'Collaborating',
  7: 'Leading',
  8: 'Educating',
  9: 'Mastering'
};

@Component({
  selector: 'app-admin-skills',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-skills.component.html',
  styleUrls: ['./admin-skills.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSkillsComponent {
  private readonly api = inject(AdminApiService);
  private readonly configData = inject(ConfigDataService);

  readonly categories = signal<AdminSkillCategory[] | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  readonly expandedId = signal<string | null>(null);
  readonly newCategoryName = signal('');
  readonly confirmDeleteCategoryId = signal<string | null>(null);

  /** Draft state for the "add skill" row inside the expanded category. */
  readonly newSkillName = signal('');
  readonly newSkillLevel = signal(0);
  readonly newSkillSince = signal<number | null>(null);

  constructor() {
    this.load();
  }

  tierName(level: number): string {
    return TIER_NAMES[level] ?? '';
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getSkillCategories().subscribe({
      next: rows => {
        this.categories.set(rows);
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.loading.set(false);
      }
    });
  }

  toggleCategory(id: string): void {
    this.expandedId.update(current => (current === id ? null : id));
    this.newSkillName.set('');
    this.newSkillLevel.set(0);
    this.newSkillSince.set(null);
  }

  addCategory(): void {
    const name = this.newCategoryName().trim();
    if (!name || this.busy()) return;

    this.busy.set(true);
    this.api.createSkillCategory({ name }).subscribe({
      next: () => {
        this.busy.set(false);
        this.newCategoryName.set('');
        this.notice.set('Category added.');
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(describeApiError(e));
      }
    });
  }

  askDeleteCategory(id: string): void {
    this.confirmDeleteCategoryId.set(id);
  }

  cancelDeleteCategory(): void {
    this.confirmDeleteCategoryId.set(null);
  }

  deleteCategory(id: string): void {
    this.busy.set(true);

    this.api.deleteSkillCategory(id).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirmDeleteCategoryId.set(null);
        this.notice.set('Category and its skills deleted.');
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.confirmDeleteCategoryId.set(null);
        this.error.set(describeApiError(e));
      }
    });
  }

  toggleCategoryPublished(category: AdminSkillCategory): void {
    this.api.updateSkillCategory(category.id, { isPublished: !category.isPublished }).subscribe({
      next: () => {
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => this.error.set(describeApiError(e))
    });
  }

  addSkill(categoryId: string): void {
    const name = this.newSkillName().trim();
    if (!name || this.busy()) return;

    this.busy.set(true);

    const body: Record<string, unknown> = { name, level: this.newSkillLevel() };
    const since = this.newSkillSince();
    if (since) body['since'] = since;

    this.api.addSkill(categoryId, body).subscribe({
      next: () => {
        this.busy.set(false);
        this.newSkillName.set('');
        this.newSkillLevel.set(0);
        this.newSkillSince.set(null);
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(describeApiError(e));
      }
    });
  }

  /** Level changes save immediately - a separate save button for one dropdown is friction. */
  changeLevel(skill: AdminSkill, value: string): void {
    const level = Number(value);
    if (level === skill.level) return;

    this.api.updateSkill(skill.id, { level }).subscribe({
      next: () => {
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => this.error.set(describeApiError(e))
    });
  }

  deleteSkill(skill: AdminSkill): void {
    this.busy.set(true);

    this.api.deleteSkill(skill.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.configData.invalidate();
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(describeApiError(e));
      }
    });
  }
}
