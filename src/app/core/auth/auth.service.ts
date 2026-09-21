import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PORTAL_THEME_STORAGE_KEY } from '../services/theme.service';

export type UserRole = 'ADMIN' | 'COORDINATOR' | 'CLIENT';

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  /** Set only for role CLIENT - the tenant this user manages. Assigned by the API, never chosen. */
  tenantId: string | null;
  /** That tenant's public slug. Set only for role CLIENT. */
  tenantSlug: string | null;
}

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AdminUser;
}

const TOKEN_KEY = 'admin.accessToken';
const USER_KEY = 'admin.user';

/**
 * Admin session.
 *
 * The token lives in localStorage so a refresh does not log the admin out. That is a
 * deliberate trade-off: it survives reloads but is readable by any script running on this
 * origin, so an XSS bug would expose it. Acceptable for a single-admin portfolio CMS;
 * it would not be for a multi-tenant product, where an httpOnly refresh cookie belongs.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly tokenSignal = signal<string | null>(this.readStored(TOKEN_KEY));
  private readonly userSignal = signal<AdminUser | null>(this.readStoredUser());

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  /**
   * Slug of the tenant this session manages. Display only - the API derives the tenant
   * from the token on every request and ignores anything the client claims.
   */
  readonly tenantSlug = computed(() => this.userSignal()?.tenantSlug ?? null);

  /** Read synchronously by the interceptor on every outgoing request. */
  get token(): string | null {
    return this.tokenSignal();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.persist(res.accessToken, res.user)));
  }

  /** Confirms a stored token is still valid - it may have expired or been revoked. */
  verify(): Observable<AdminUser> {
    return this.http
      .get<AdminUser>(`${this.baseUrl}/auth/me`)
      .pipe(tap(user => this.userSignal.set(user)));
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Avoids leaking this user's portal theme as the next login's bootstrap guess on a
      // shared machine - see ThemeService/index.html's inline bootstrap script.
      localStorage.removeItem(PORTAL_THEME_STORAGE_KEY);
    } catch {
      // Storage unavailable; clearing the signals is what actually ends the session.
    }
  }

  private persist(token: string, user: AdminUser): void {
    this.tokenSignal.set(token);
    this.userSignal.set(user);
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Private browsing can block writes; the session still works for this tab.
    }
  }

  private readStored(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private readStoredUser(): AdminUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AdminUser) : null;
    } catch {
      return null;
    }
  }
}
