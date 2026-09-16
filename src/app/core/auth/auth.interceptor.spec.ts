import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  const API = `${environment.apiBaseUrl}/experiences`;
  const THIRD_PARTY = 'https://someone-else.example.com/collect';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function signIn(): void {
    http.post(`${environment.apiBaseUrl}/auth/login`, {}).subscribe();
    const loginRequest = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
    loginRequest.flush({});
    auth['tokenSignal'].set('jwt.token.value');
  }

  it('sends no Authorization header when signed out', () => {
    http.get(API).subscribe();
    const request = httpMock.expectOne(API);

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush([]);
  });

  it('attaches the bearer token to API requests', () => {
    signIn();

    http.get(API).subscribe();
    const request = httpMock.expectOne(API);

    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt.token.value');
    request.flush([]);
  });

  it('never leaks the token to a third-party URL', () => {
    signIn();

    http.get(THIRD_PARTY).subscribe();
    const request = httpMock.expectOne(THIRD_PARTY);

    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('ends the session on a 401 from the API', () => {
    signIn();
    expect(auth.isAuthenticated()).toBe(true);

    http.get(API).subscribe({ error: () => undefined });
    httpMock.expectOne(API).flush('no', { status: 401, statusText: 'Unauthorized' });

    expect(auth.isAuthenticated()).toBe(false);
  });

  it('keeps the session on a non-401 error', () => {
    signIn();

    http.get(API).subscribe({ error: () => undefined });
    httpMock.expectOne(API).flush('bad', { status: 400, statusText: 'Bad Request' });

    expect(auth.isAuthenticated()).toBe(true);
  });
});
