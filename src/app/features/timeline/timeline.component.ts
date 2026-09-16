import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { SectionHeaderComponent, TimelineItemComponent, DataStateComponent } from '../../shared/components';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [SectionHeaderComponent, TimelineItemComponent, DataStateComponent],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly timeline = this.configService.timeline;
  readonly timelineError = this.configService.timelineError;

  ngOnInit(): void {
    this.configService.loadTimeline();
  }

  /** Refetches this section after a failed load. */
  reload(): void {
    this.configService.loadTimeline(true);
  }
}

