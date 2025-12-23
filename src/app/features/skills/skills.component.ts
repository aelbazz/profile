import { Component, OnInit, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfigDataService } from '../../core/services';
import { SectionHeaderComponent } from '../../shared/components';
import { SkillData } from '../../core/models';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [SectionHeaderComponent, FormsModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly skills = this.configService.skills;
  readonly searchTerm = signal<string>('');
  readonly selectedCategory = signal<string | null>(null);

  readonly availableCategories = computed<string[]>(() => {
    const skillsData = this.skills();
    if (!skillsData) return [];
    return skillsData.categories.map(cat => cat.category);
  });

  readonly filteredSkills = computed<SkillData | null>(() => {
    const skillsData = this.skills();
    const search = this.searchTerm().toLowerCase().trim();
    const category = this.selectedCategory();

    if (!skillsData) {
      return null;
    }

    let filtered = skillsData.categories;

    // Filter by category
    if (category) {
      filtered = filtered.filter(cat => cat.category === category);
    }

    // Filter by search term
    if (search) {
      filtered = filtered
        .map(cat => ({
          category: cat.category,
          skills: cat.skills.filter(skill =>
            skill.name.toLowerCase().includes(search) ||
            cat.category.toLowerCase().includes(search)
          )
        }))
        .filter(cat => cat.skills.length > 0);
    }

    // Sort skills within each category by level (descending - highest to lowest)
    filtered = filtered.map(cat => ({
      category: cat.category,
      skills: [...cat.skills].sort((a, b) => b.level - a.level)
    }));

    return {
      categories: filtered
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

  selectCategory(category: string | null): void {
    this.selectedCategory.set(category);
  }

  clearCategoryFilter(): void {
    this.selectedCategory.set(null);
  }

  getProgressBarClass(level: number): string {
    if (level >= 80) return 'bg-success';
    if (level >= 60) return 'bg-info';
    if (level >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  /**
   * Gets proficiency category from level (0-9)
   */
  getProficiencyFromLevel(level: number): 'Beginner' | 'Intermediate' | 'Expert' {
    if (level === 0) return 'Beginner'; // Default for level 0
    if (level >= 1 && level <= 3) return 'Beginner';
    if (level >= 4 && level <= 6) return 'Intermediate';
    return 'Expert'; // 7-9
  }

  /**
   * Gets the RGB color based on level (0-9)
   */
  getSkillLevelColor(level: number): string {
    // Beginner (1-3)
    if (level === 1) return 'rgb(246, 236, 201)'; // starting
    if (level === 2) return 'rgb(246, 227, 158)'; // learning
    if (level === 3) return 'rgb(248, 210, 71)';  // assisting
    
    // Intermediate (4-6)
    if (level === 4) return 'rgb(183, 254, 228)'; // applying
    if (level === 5) return 'rgb(76, 234, 177)';  // understanding
    if (level === 6) return 'rgb(69, 182, 141)';  // collaborating
    
    // Expert (7-9)
    if (level === 7) return 'rgb(102, 102, 102)'; // leading
    if (level === 8) return 'rgb(51, 51, 51)';    // educating
    if (level === 9) return 'rgb(0, 0, 0)';      // mastering
    
    // Default for level 0
    return 'rgb(246, 236, 201)'; // starting
  }

  /**
   * Gets the proficiency tier name based on level (0-9)
   */
  getSkillTierName(level: number): string {
    if (level === 1) return 'Starting';
    if (level === 2) return 'Learning';
    if (level === 3) return 'Assisting';
    if (level === 4) return 'Applying';
    if (level === 5) return 'Understanding';
    if (level === 6) return 'Collaborating';
    if (level === 7) return 'Leading';
    if (level === 8) return 'Educating';
    if (level === 9) return 'Mastering';
    return 'Starting'; // Default for level 0
  }

  /**
   * Gets the proficiency category from level
   */
  getProficiencyCategory(level: number): string {
    return this.getProficiencyFromLevel(level);
  }

  /**
   * Converts level (0-9) to percentage for progress bar width
   */
  getLevelPercentage(level: number): number {
    if (level === 0) return 0;
    // Convert 1-9 to percentage: level 1 = ~11%, level 9 = 100%
    return Math.round((level / 9) * 100);
  }

  /**
   * Checks if text should be white (for dark backgrounds)
   */
  shouldUseWhiteText(level: number): boolean {
    // Expert levels (7-9) use dark colors, need white text
    return level >= 7 && level <= 9;
  }
}

