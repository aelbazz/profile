import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigDataService } from './config-data.service';
import { environment } from '../../../environments/environment';

describe('ConfigDataService', () => {
  let service: ConfigDataService;
  let httpMock: HttpTestingController;

  const SLUG = 'albaz';
  const OTHER_SLUG = 'someone-else';
  const urlFor = (slug: string) => `${environment.apiBaseUrl}/public/tenants/${slug}/profile`;

  const response = {
    person: {
      name: 'Ahmed Mohsen Albaz',
      title: 'Staff Engineer',
      summary: 'Summary',
      location: 'Riyadh, Saudi Arabia',
      yearsOfExperience: 13,
      avatar: '/assets/images/profile-image.jpg',
      tagline: 'Tagline'
    },
    contact: { email: 'a@b.com', phone: '+1', whatsapp: '+1', linkedin: 'https://x', socialLinks: [] },
    experiences: [{ id: 'exp1', responsibilities: ['R1'], technologies: ['Angular'] }],
    projects: [{ id: 'proj1', highlights: ['H1'], technologies: ['Angular'] }],
    achievements: [{ id: 'ach1' }],
    courses: [{ id: 'edu1', skills: ['S1'] }],
    timelineEvents: [{ id: 'evt1' }],
    managementRoles: [{ id: 'mgmt1', keyResponsibilities: ['K1'], achievements: ['A1'] }],
    skills: { categories: [{ category: 'Frontend', skills: [{ name: 'Angular', level: 9 }] }] }
  };

  const otherTenantResponse = {
    ...response,
    person: { ...response.person, name: 'Someone Else' }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ConfigDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('populates every section from one request', () => {
    service.loadProfile$(SLUG).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush(response);

    expect(service.profile()?.name).toBe('Ahmed Mohsen Albaz');
    expect(service.contact()?.email).toBe('a@b.com');
    expect(service.experience()?.experiences.length).toBe(1);
    expect(service.projects()?.projects.length).toBe(1);
    expect(service.achievements()?.achievements.length).toBe(1);
    expect(service.courses()?.courses.length).toBe(1);
    expect(service.timeline()?.events.length).toBe(1);
    expect(service.management()?.responsibilities.length).toBe(1);
    expect(service.skills()?.categories.length).toBe(1);
  });

  it('wraps bare API arrays into the shapes the frontend models expect', () => {
    service.loadProfile$(SLUG).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush(response);

    // The API returns `timelineEvents`; the frontend model is `{ events: [...] }`.
    expect(service.timeline()).toEqual({ events: response.timelineEvents });
    // `managementRoles` -> `{ responsibilities: [...] }`.
    expect(service.management()).toEqual({ responsibilities: response.managementRoles });
    // skills passes through untouched - it already matches SkillData.
    expect(service.skills()).toEqual(response.skills);
  });

  it('issues only one request no matter which loadX() is called for the same tenant', () => {
    service.loadProfile$(SLUG).subscribe();
    service.loadSkills();
    service.loadExperience();

    httpMock.expectOne(urlFor(SLUG)).flush(response);
    httpMock.expectNone(urlFor(SLUG));
  });

  it('does not refetch once loaded for the same slug', () => {
    service.loadProfile$(SLUG).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush(response);

    service.loadProjects();
    httpMock.expectNone(urlFor(SLUG));
  });

  it('refetches when forced', () => {
    service.loadProfile$(SLUG).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush(response);

    service.loadProfile$(SLUG, true).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush(response);
  });

  it('refetches after invalidate()', () => {
    service.loadProfile$(SLUG).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush(response);

    service.invalidate();
    service.loadProfile$(SLUG).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush(response);
  });

  it('flags an error and stays retryable when the request fails', () => {
    service.loadProfile$(SLUG).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush('down', { status: 503, statusText: 'Service Unavailable' });

    expect(service.profile()).toBeNull();
    expect(service.profileError()).toBe(true);
    expect(service.skillsError()).toBe(true);
    expect(service.isLoading()).toBe(false);

    // A failed load is not cached, so a plain retry re-issues the request.
    service.loadProfile$(SLUG).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush(response);
    expect(service.profileError()).toBe(false);
  });

  it('tracks loading state', () => {
    service.loadProfile$(SLUG).subscribe();
    expect(service.isLoading()).toBe(true);

    httpMock.expectOne(urlFor(SLUG)).flush(response);
    expect(service.isLoading()).toBe(false);
  });

  it('switching tenants clears the previous tenant\'s data before the new request lands', () => {
    service.loadProfile$(SLUG).subscribe();
    httpMock.expectOne(urlFor(SLUG)).flush(response);
    expect(service.profile()?.name).toBe('Ahmed Mohsen Albaz');

    // The switch itself (before the new response arrives) must not show tenant A's data.
    service.loadProfile$(OTHER_SLUG).subscribe();
    expect(service.profile()).toBeNull();

    httpMock.expectOne(urlFor(OTHER_SLUG)).flush(otherTenantResponse);
    expect(service.profile()?.name).toBe('Someone Else');
  });

  it('reports a redirect when the backend serves the data under a different, canonical slug', () => {
    let result: { success: boolean; redirectSlug: string | null } | undefined;
    service.loadProfile$('old-slug').subscribe(r => (result = r));

    const req = httpMock.expectOne(urlFor('old-slug'));
    req.flush(response, { headers: { 'X-Tenant-Slug-Current': SLUG } });

    expect(result).toEqual({ success: true, redirectSlug: SLUG });
    expect(service.profile()?.name).toBe('Ahmed Mohsen Albaz');
  });
});
