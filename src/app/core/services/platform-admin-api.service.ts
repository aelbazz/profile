import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Mirrors the backend's TenantStatus enum - see ammam/prisma/schema.prisma. */
export type TenantStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
export type BillingInterval = 'MONTHLY' | 'YEARLY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type ContactSubmissionStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'SPAM';

export interface AdminTenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  coordinatorId: string | null;
  coordinatorEmail: string | null;
  createdById: string | null;
  clientEmail: string | null;
  subscriptionStatus?: string;
  planName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  slug?: string;
  clientEmail: string;
  clientPassword: string;
  coordinatorId?: string;
  planId?: string;
}

export interface AdminPlan {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  billingInterval: BillingInterval;
  active: boolean;
  features: string[];
}

export interface CreatePlanRequest {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingInterval: BillingInterval;
  active?: boolean;
  features?: string[];
}

export interface AdminSubscription {
  id: string;
  tenantId: string;
  tenantSlug?: string;
  tenantName?: string;
  planId: string;
  planName?: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  renewalDate: string | null;
  autoRenew: boolean;
  daysRemaining: number | null;
}

export interface UpdateSubscriptionRequest {
  status?: SubscriptionStatus;
  planId?: string;
  expiresAt?: string | null;
  renewalDate?: string | null;
  autoRenew?: boolean;
}

export interface AdminPayment {
  id: string;
  tenantId: string;
  tenantSlug?: string;
  subscriptionId: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  provider: string;
  providerTransactionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface RecordPaymentRequest {
  tenantId: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  provider?: string;
  providerTransactionId?: string;
}

export interface AdminContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string;
  message: string;
  status: ContactSubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Client for the platform-admin API namespace (/admin/*, Role.ADMIN only) - tenants, plans,
 * subscriptions, payments, and the marketing site's contact-submission inbox. Kept separate
 * from AdminApiService, which is the CLIENT portal's client (/tenant/*, one tenant's own
 * content) - the two never call the same endpoints or carry the same authorization.
 */
@Injectable({ providedIn: 'root' })
export class PlatformAdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // -- tenants ------------------------------------------------------------

  getTenants(status?: TenantStatus): Observable<AdminTenant[]> {
    const query = status ? `?status=${status}` : '';
    return this.http.get<AdminTenant[]>(`${this.base}/admin/tenants${query}`);
  }

  createTenant(body: CreateTenantRequest): Observable<AdminTenant> {
    return this.http.post<AdminTenant>(`${this.base}/admin/tenants`, body);
  }

  updateTenantStatus(id: string, status: TenantStatus): Observable<AdminTenant> {
    return this.http.patch<AdminTenant>(`${this.base}/admin/tenants/${id}/status`, { status });
  }

  resetClientAccess(id: string): Observable<{ temporaryPassword: string }> {
    return this.http.post<{ temporaryPassword: string }>(
      `${this.base}/admin/tenants/${id}/reset-access`,
      {}
    );
  }

  // -- plans ----------------------------------------------------------------

  getPlans(): Observable<AdminPlan[]> {
    return this.http.get<AdminPlan[]>(`${this.base}/admin/plans`);
  }

  createPlan(body: CreatePlanRequest): Observable<AdminPlan> {
    return this.http.post<AdminPlan>(`${this.base}/admin/plans`, body);
  }

  updatePlan(id: string, body: Partial<CreatePlanRequest>): Observable<AdminPlan> {
    return this.http.patch<AdminPlan>(`${this.base}/admin/plans/${id}`, body);
  }

  // -- subscriptions --------------------------------------------------------

  getSubscriptions(): Observable<AdminSubscription[]> {
    return this.http.get<AdminSubscription[]>(`${this.base}/admin/subscriptions`);
  }

  updateSubscription(tenantId: string, body: UpdateSubscriptionRequest): Observable<AdminSubscription> {
    return this.http.patch<AdminSubscription>(
      `${this.base}/admin/tenants/${tenantId}/subscription`,
      body
    );
  }

  expireOverdueSubscriptions(): Observable<{ expired: number }> {
    return this.http.post<{ expired: number }>(
      `${this.base}/admin/subscriptions/expire-overdue`,
      {}
    );
  }

  // -- payments ---------------------------------------------------------------

  getPayments(tenantId?: string): Observable<AdminPayment[]> {
    const query = tenantId ? `?tenantId=${tenantId}` : '';
    return this.http.get<AdminPayment[]>(`${this.base}/admin/payments${query}`);
  }

  recordPayment(body: RecordPaymentRequest): Observable<AdminPayment> {
    return this.http.post<AdminPayment>(`${this.base}/admin/payments`, body);
  }

  // -- contact submissions ----------------------------------------------------

  getContactSubmissions(status?: ContactSubmissionStatus): Observable<{ data: AdminContactSubmission[]; total: number }> {
    const query = status ? `?status=${status}` : '';
    return this.http.get<{ data: AdminContactSubmission[]; total: number }>(
      `${this.base}/contact-submissions${query}`
    );
  }

  updateContactSubmissionStatus(
    id: string,
    status: ContactSubmissionStatus
  ): Observable<AdminContactSubmission> {
    return this.http.patch<AdminContactSubmission>(`${this.base}/contact-submissions/${id}`, {
      status
    });
  }
}
