import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { PageHeaderComponent } from '../../shared/components';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [PageHeaderComponent],
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

