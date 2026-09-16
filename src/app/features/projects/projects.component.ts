import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { PageHeaderComponent, DataStateComponent } from '../../shared/components';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [PageHeaderComponent, DataStateComponent],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectsComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly projects = this.configService.projects;
  readonly projectsError = this.configService.projectsError;

  ngOnInit(): void {
    this.configService.loadProjects();
  }

  /** Refetches this section after a failed load. */
  reload(): void {
    this.configService.loadProjects(true);
  }
}

