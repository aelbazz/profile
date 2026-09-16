import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { ManagementResponsibility } from '../../core/models';
import { SectionHeaderComponent, DataStateComponent } from '../../shared/components';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [SectionHeaderComponent, DataStateComponent],
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagementComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
  readonly management = this.configService.management;
  readonly managementError = this.configService.managementError;

  ngOnInit(): void {
    this.configService.loadManagement();
  }

  /** Refetches this section after a failed load. */
  reload(): void {
    this.configService.loadManagement(true);
  }

  getHighLevelResponsibilities(): ManagementResponsibility[] {
    const mgmt = this.management();
    return mgmt ? mgmt.responsibilities.filter(r => r.level === 'high') : [];
  }

  /**
   * Roles rendered in the second section.
   *
   * This used to filter for `level === 'low'` only, which meant the one record stored as
   * 'medium' matched neither section and rendered nowhere. Anything that is not 'high'
   * belongs here, so no role can be silently dropped again.
   */
  getLowLevelResponsibilities(): ManagementResponsibility[] {
    const mgmt = this.management();
    return mgmt ? mgmt.responsibilities.filter(r => r.level !== 'high') : [];
  }
}

