import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfigDataService } from '../../core/services';
import { SectionHeaderComponent, BadgeComponent } from '../../shared/components';
import { SkillData } from '../../core/models';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [SectionHeaderComponent, BadgeComponent, FormsModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly skills = this.configService.skills;
  readonly searchTerm = signal<string>('');

  readonly filteredSkills = computed<SkillData | null>(() => {
    const skillsData = this.skills();
    const search = this.searchTerm().toLowerCase().trim();

    if (!skillsData || !search) {
      return skillsData;
    }

    return {
      categories: skillsData.categories
        .map(category => ({
          category: category.category,
          skills: category.skills.filter(skill =>
            skill.name.toLowerCase().includes(search) ||
            category.category.toLowerCase().includes(search)
          )
        }))
        .filter(category => category.skills.length > 0)
    };
  });

  ngOnInit(): void {
    this.configService.loadSkills();
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  getProgressBarClass(level: number): string {
    if (level >= 80) return 'bg-success';
    if (level >= 60) return 'bg-info';
    if (level >= 40) return 'bg-warning';
    return 'bg-danger';
  }
}

