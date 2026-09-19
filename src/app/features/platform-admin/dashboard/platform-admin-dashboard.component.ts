import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AdminContactSubmission,
  AdminPayment,
  AdminSubscription,
  AdminTenant,
  PlatformAdminApiService
} from '../../../core/services/platform-admin-api.service';
import { describeApiError } from '../../admin/admin-error';

@Component({
  selector: 'app-platform-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './platform-admin-dashboard.component.html',
  styleUrl: './platform-admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformAdminDashboardComponent implements OnInit {
  private readonly api = inject(PlatformAdminApiService);

  private readonly tenants = signal<AdminTenant[] | null>(null);
  private readonly subscriptions = signal<AdminSubscription[] | null>(null);
  private readonly payments = signal<AdminPayment[] | null>(null);
  private readonly submissions = signal<AdminContactSubmission[] | null>(null);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly tenantCount = computed(() => this.tenants()?.length ?? 0);
  readonly activeTenantCount = computed(
    () => this.tenants()?.filter(t => t.status === 'ACTIVE').length ?? 0
  );
  readonly pendingTenantCount = computed(
    () => this.tenants()?.filter(t => t.status === 'PENDING').length ?? 0
  );

  readonly expiredSubscriptionCount = computed(
    () => this.subscriptions()?.filter(s => s.status === 'EXPIRED').length ?? 0
  );
  readonly expiringSoonCount = computed(
    () =>
      this.subscriptions()?.filter(
        s => s.status !== 'EXPIRED' && s.daysRemaining !== null && s.daysRemaining <= 7 && s.daysRemaining >= 0
      ).length ?? 0
  );

  readonly totalIncome = computed(() => {
    const paid = this.payments()?.filter(p => p.status === 'PAID') ?? [];
    return paid.reduce((sum, p) => sum + Number(p.amount), 0);
  });
  readonly paymentCurrency = computed(() => this.payments()?.[0]?.currency ?? 'USD');

  readonly newSubmissionCount = computed(
    () => this.submissions()?.filter(s => s.status === 'NEW').length ?? 0
  );

  ngOnInit(): void {
    forkJoin({
      tenants: this.api.getTenants(),
      subscriptions: this.api.getSubscriptions(),
      payments: this.api.getPayments(),
      submissions: this.api.getContactSubmissions()
    }).subscribe({
      next: ({ tenants, subscriptions, payments, submissions }) => {
        this.tenants.set(tenants);
        this.subscriptions.set(subscriptions);
        this.payments.set(payments);
        this.submissions.set(submissions.data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(describeApiError(err));
        this.loading.set(false);
      }
    });
  }
}
