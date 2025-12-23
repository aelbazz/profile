import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { SectionHeaderComponent, BadgeComponent } from '../../shared/components';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [SectionHeaderComponent, BadgeComponent],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperienceComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly experience = this.configService.experience;

  ngOnInit(): void {
    this.configService.loadExperience();
  }
}

