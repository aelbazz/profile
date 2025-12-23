import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { SectionHeaderComponent, CardComponent, BadgeComponent } from '../../shared/components';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [SectionHeaderComponent, CardComponent, BadgeComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly projects = this.configService.projects;

  ngOnInit(): void {
    this.configService.loadProjects();
  }
}

