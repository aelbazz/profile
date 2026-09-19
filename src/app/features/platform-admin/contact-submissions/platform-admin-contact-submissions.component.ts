import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AdminContactSubmission,
  ContactSubmissionStatus,
  PlatformAdminApiService
} from '../../../core/services/platform-admin-api.service';
import { describeApiError } from '../../admin/admin-error';

const STATUS_FILTERS: (ContactSubmissionStatus | 'ALL')[] = ['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM'];

@Component({
  selector: 'app-platform-admin-contact-submissions',
  standalone: true,
  imports: [DatePipe, TitleCasePipe],
  templateUrl: './platform-admin-contact-submissions.component.html',
  styleUrl: './platform-admin-contact-submissions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformAdminContactSubmissionsComponent implements OnInit {
  private readonly api = inject(PlatformAdminApiService);

  readonly statusFilters = STATUS_FILTERS;
  readonly activeFilter = signal<ContactSubmissionStatus | 'ALL'>('ALL');

  readonly submissions = signal<AdminContactSubmission[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);

  readonly statusOptions: ContactSubmissionStatus[] = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM'];

  ngOnInit(): void {
    this.load();
  }

  setFilter(filter: ContactSubmissionStatus | 'ALL'): void {
    this.activeFilter.set(filter);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    const filter = this.activeFilter();
    this.api.getContactSubmissions(filter === 'ALL' ? undefined : filter).subscribe({
      next: res => {
        this.submissions.set(res.data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(describeApiError(err));
        this.loading.set(false);
      }
    });
  }

  toggleExpanded(id: string): void {
    this.expandedId.update(current => (current === id ? null : id));
  }

  updateStatus(submission: AdminContactSubmission, status: ContactSubmissionStatus): void {
    if (this.busyId() || submission.status === status) return;

    this.busyId.set(submission.id);
    this.api.updateContactSubmissionStatus(submission.id, status).subscribe({
      next: updated => {
        this.busyId.set(null);
        this.submissions.update(list => list.map(s => (s.id === updated.id ? updated : s)));
      },
      error: (err: HttpErrorResponse) => {
        this.busyId.set(null);
        this.loadError.set(describeApiError(err));
      }
    });
  }
}
