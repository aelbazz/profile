import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import {
  AdminPayment,
  AdminTenant,
  PlatformAdminApiService
} from '../../../core/services/platform-admin-api.service';
import { describeApiError } from '../../admin/admin-error';

@Component({
  selector: 'app-platform-admin-payments',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './platform-admin-payments.component.html',
  styleUrl: './platform-admin-payments.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformAdminPaymentsComponent implements OnInit {
  private readonly api = inject(PlatformAdminApiService);
  private readonly fb = inject(FormBuilder);

  readonly payments = signal<AdminPayment[]>([]);
  readonly tenants = signal<AdminTenant[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    tenantId: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['USD'],
    provider: ['manual'],
    providerTransactionId: ['']
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({ payments: this.api.getPayments(), tenants: this.api.getTenants() }).subscribe({
      next: ({ payments, tenants }) => {
        this.payments.set(payments);
        this.tenants.set(tenants);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(describeApiError(err));
        this.loading.set(false);
      }
    });
  }

  toggleForm(): void {
    this.showForm.update(v => !v);
    this.formError.set(null);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    this.api
      .recordPayment({
        tenantId: raw.tenantId,
        amount: raw.amount,
        currency: raw.currency || undefined,
        provider: raw.provider || undefined,
        providerTransactionId: raw.providerTransactionId || undefined
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.form.reset({ tenantId: '', amount: 0, currency: 'USD', provider: 'manual', providerTransactionId: '' });
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.formError.set(describeApiError(err));
        }
      });
  }
}
