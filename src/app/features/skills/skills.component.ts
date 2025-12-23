import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { SectionHeaderComponent, BadgeComponent } from '../../shared/components';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [SectionHeaderComponent, BadgeComponent],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly skills = this.configService.skills;

  ngOnInit(): void {
    this.configService.loadSkills();
  }

  getProgressBarClass(level: number): string {
    if (level >= 80) return 'bg-success';
    if (level >= 60) return 'bg-info';
    if (level >= 40) return 'bg-warning';
    return 'bg-danger';
  }
}

