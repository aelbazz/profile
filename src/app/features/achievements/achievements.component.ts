import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { SectionHeaderComponent, CardComponent, BadgeComponent } from '../../shared/components';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [SectionHeaderComponent, BadgeComponent],
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementsComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly achievements = this.configService.achievements;

  ngOnInit(): void {
    this.configService.loadAchievements();
  }

  getCategoryVariant(category: string): 'primary' | 'success' | 'warning' | 'info' {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
      award: 'warning',
      certification: 'success',
      recognition: 'primary',
      milestone: 'info'
    };
    return variants[category] || 'primary';
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      award: 'fas fa-trophy',
      certification: 'fas fa-certificate',
      recognition: 'fas fa-star',
      milestone: 'fas fa-flag'
    };
    return icons[category] || 'fas fa-award';
  }
}

