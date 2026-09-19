import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  AdminPlan,
  AdminSubscription,
  AdminTenant,
  PlatformAdminApiService,
  TenantStatus
} from '../../../core/services/platform-admin-api.service';
import { describeApiError } from '../../admin/admin-error';

/** The lifecycle graph enforced server-side (TenantLifecycleService) - mirrored here only
 *  to decide which action buttons to show; the API is what actually rejects an invalid one. */
const ALLOWED_NEXT_STATUSES: Record<TenantStatus, TenantStatus[]> = {
  PENDING: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['SUSPENDED', 'ARCHIVED'],
  SUSPENDED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: []
};

interface TenantRow extends AdminTenant {
  daysRemaining: number | null;
}

@Component({
  selector: 'app-platform-admin-tenants',
  standalone: true,
  imports: [ReactiveFormsModule, LowerCasePipe],
  templateUrl: './platform-admin-tenants.component.html',
  styleUrl: './platform-admin-tenants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformAdminTenantsComponent implements OnInit {
  private readonly api = inject(PlatformAdminApiService);
  private readonly fb = inject(FormBuilder);

  private readonly tenants = signal<AdminTenant[]>([]);
  private readonly subscriptionsByTenant = signal<Map<string, AdminSubscription>>(new Map());
  readonly plans = signal<AdminPlan[]>([]);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly rows = computed<TenantRow[]>(() =>
    this.tenants().map(t => ({
      ...t,
      daysRemaining: this.subscriptionsByTenant().get(t.id)?.daysRemaining ?? null
    }))
  );

  readonly showCreateForm = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly createdCredentials = signal<{ email: string; password: string } | null>(null);

  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    slug: [''],
    clientEmail: ['', [Validators.required, Validators.email]],
    clientPassword: ['', [Validators.required, Validators.minLength(8)]],
    planId: ['']
  });

  /** id of the row a status-change or reset-access request is in flight for. */
  readonly busyRowId = signal<string | null>(null);
  readonly rowError = signal<string | null>(null);
  readonly resetPasswordFor = signal<{ tenantId: string; password: string } | null>(null);

  nextStatuses(status: TenantStatus): TenantStatus[] {
    return ALLOWED_NEXT_STATUSES[status];
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      tenants: this.api.getTenants(),
      subscriptions: this.api.getSubscriptions(),
      plans: this.api.getPlans()
    }).subscribe({
      next: ({ tenants, subscriptions, plans }) => {
        this.tenants.set(tenants);
        this.subscriptionsByTenant.set(new Map(subscriptions.map(s => [s.tenantId, s])));
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(describeApiError(err));
        this.loading.set(false);
      }
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update(v => !v);
    this.createError.set(null);
    this.createdCredentials.set(null);
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.creating()) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    const raw = this.createForm.getRawValue();
    this.api
      .createTenant({
        name: raw.name,
        slug: raw.slug || undefined,
        clientEmail: raw.clientEmail,
        clientPassword: raw.clientPassword,
        planId: raw.planId || undefined
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.createdCredentials.set({ email: raw.clientEmail, password: raw.clientPassword });
          this.createForm.reset();
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.creating.set(false);
          this.createError.set(describeApiError(err));
        }
      });
  }

  changeStatus(tenant: AdminTenant, status: TenantStatus): void {
    if (this.busyRowId()) return;

    this.busyRowId.set(tenant.id);
    this.rowError.set(null);

    this.api.updateTenantStatus(tenant.id, status).subscribe({
      next: () => {
        this.busyRowId.set(null);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busyRowId.set(null);
        this.rowError.set(describeApiError(err));
      }
    });
  }

  resetAccess(tenant: AdminTenant): void {
    if (this.busyRowId()) return;

    this.busyRowId.set(tenant.id);
    this.rowError.set(null);
    this.resetPasswordFor.set(null);

    this.api.resetClientAccess(tenant.id).subscribe({
      next: res => {
        this.busyRowId.set(null);
        this.resetPasswordFor.set({ tenantId: tenant.id, password: res.temporaryPassword });
      },
      error: (err: HttpErrorResponse) => {
        this.busyRowId.set(null);
        this.rowError.set(describeApiError(err));
      }
    });
  }
}
