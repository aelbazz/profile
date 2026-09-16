import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { PageHeaderComponent, DataStateComponent } from '../../shared/components';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [PageHeaderComponent, DataStateComponent],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoursesComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly courses = this.configService.courses;
  readonly coursesError = this.configService.coursesError;

  ngOnInit(): void {
    this.configService.loadCourses();
  }

  /** Refetches this section after a failed load. */
  reload(): void {
    this.configService.loadCourses(true);
  }
}

