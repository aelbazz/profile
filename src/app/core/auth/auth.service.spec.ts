import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const LOGIN_URL = `${environment.apiBaseUrl}/auth/login`;
  const loginResponse = {
    accessToken: 'jwt.token.value',
    expiresIn: 604800,
    user: {
      id: 'u1',
      email: 'admin@example.com',
      name: 'Admin',
      personId: 'tenant-1',
      personSlug: 'ahmed'
    }
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts unauthenticated with no stored token', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.token).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('stores the token and user after a successful login', () => {
    service.login('admin@example.com', 'password123').subscribe();
    httpMock.expectOne(LOGIN_URL).flush(loginResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.token).toBe('jwt.token.value');
    expect(service.user()?.email).toBe('admin@example.com');
  });

  it('writes the session to storage', () => {
    service.login('admin@example.com', 'password123').subscribe();
    httpMock.expectOne(LOGIN_URL).flush(loginResponse);

    expect(localStorage.getItem('admin.accessToken')).toBe('jwt.token.value');
    expect(localStorage.getItem('admin.user')).toContain('admin@example.com');
  });

  it('restores a stored session on construction, so a reload stays signed in', () => {
    localStorage.setItem('admin.accessToken', 'stored.jwt.value');
    localStorage.setItem('admin.user', JSON.stringify(loginResponse.user));

    // A brand new TestBed models the app booting again with storage already populated.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const restored = TestBed.inject(AuthService);

    expect(restored.isAuthenticated()).toBe(true);
    expect(restored.token).toBe('stored.jwt.value');
    expect(restored.user()?.email).toBe('admin@example.com');

    // This instance replaced the one the outer afterEach verifies.
    TestBed.inject(HttpTestingController).verify();
  });

  it('ignores corrupt stored user data rather than crashing the app', () => {
    localStorage.setItem('admin.accessToken', 'stored.jwt.value');
    localStorage.setItem('admin.user', 'not-json');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const restored = TestBed.inject(AuthService);

    expect(restored.user()).toBeNull();
    expect(restored.isAuthenticated()).toBe(true);
    TestBed.inject(HttpTestingController).verify();
  });

  it('exposes the tenant the session manages', () => {
    service.login('admin@example.com', 'password123').subscribe();
    httpMock.expectOne(LOGIN_URL).flush(loginResponse);

    // Display only - the API derives the tenant from the token on every request.
    expect(service.tenantSlug()).toBe('ahmed');
    expect(service.user()?.personId).toBe('tenant-1');
  });

  it('clears everything on logout', () => {
    service.login('admin@example.com', 'password123').subscribe();
    httpMock.expectOne(LOGIN_URL).flush(loginResponse);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.token).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.tenantSlug()).toBeNull();
    expect(localStorage.getItem('admin.accessToken')).toBeNull();
    expect(localStorage.getItem('admin.user')).toBeNull();
  });

  it('does not authenticate when login fails', () => {
    service.login('admin@example.com', 'wrong').subscribe({ error: () => undefined });
    httpMock.expectOne(LOGIN_URL).flush('nope', { status: 401, statusText: 'Unauthorized' });

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('admin.accessToken')).toBeNull();
  });
});
