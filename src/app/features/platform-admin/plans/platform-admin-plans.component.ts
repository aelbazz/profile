import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AdminPlan,
  BillingInterval,
  PlatformAdminApiService
} from '../../../core/services/platform-admin-api.service';
import { describeApiError } from '../../admin/admin-error';

@Component({
  selector: 'app-platform-admin-plans',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './platform-admin-plans.component.html',
  styleUrl: './platform-admin-plans.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlatformAdminPlansComponent implements OnInit {
  private readonly api = inject(PlatformAdminApiService);
  private readonly fb = inject(FormBuilder);

  readonly plans = signal<AdminPlan[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', [Validators.required]],
    billingInterval: ['MONTHLY' as BillingInterval, [Validators.required]],
    active: [true],
    featuresText: ['']
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.getPlans().subscribe({
      next: plans => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(describeApiError(err));
        this.loading.set(false);
      }
    });
  }

  startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', price: 0, currency: 'USD', billingInterval: 'MONTHLY', active: true, featuresText: '' });
    this.formError.set(null);
    this.showForm.set(true);
  }

  startEdit(plan: AdminPlan): void {
    this.editingId.set(plan.id);
    this.form.reset({
      name: plan.name,
      description: plan.description ?? '',
      price: Number(plan.price),
      currency: plan.currency,
      billingInterval: plan.billingInterval,
      active: plan.active,
      featuresText: plan.features.join('\n')
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  cancel(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const body = {
      name: raw.name,
      description: raw.description || undefined,
      price: raw.price,
      currency: raw.currency,
      billingInterval: raw.billingInterval,
      active: raw.active,
      features: raw.featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)
    };

    const editingId = this.editingId();
    const request = editingId ? this.api.updatePlan(editingId, body) : this.api.createPlan(body);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(describeApiError(err));
      }
    });
  }
}
