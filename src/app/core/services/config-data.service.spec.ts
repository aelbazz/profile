import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigDataService } from './config-data.service';

describe('ConfigDataService', () => {
  let service: ConfigDataService;
  let httpMock: HttpTestingController;

  const PROFILE_URL = 'assets/data/profile.json';
  const profileFixture = {
    name: 'Ahmed Mohsen Albaz',
    title: 'Staff Engineer',
    summary: 'Summary',
    location: 'Riyadh, Saudi Arabia',
    yearsOfExperience: 13,
    avatar: '/assets/images/profile-image.jpg',
    tagline: 'Tagline'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ConfigDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should populate the signal on a successful load', () => {
    service.loadProfile();
    httpMock.expectOne(PROFILE_URL).flush(profileFixture);

    expect(service.profile()?.name).toBe('Ahmed Mohsen Albaz');
    expect(service.profileError()).toBe(false);
  });

  it('should not refetch data that is already cached', () => {
    service.loadProfile();
    httpMock.expectOne(PROFILE_URL).flush(profileFixture);

    service.loadProfile();
    httpMock.expectNone(PROFILE_URL);
  });

  it('should collapse duplicate parallel calls into one request', () => {
    service.loadProfile();
    service.loadProfile();
    service.loadProfile();

    httpMock.expectOne(PROFILE_URL).flush(profileFixture);
  });

  it('should refetch when forced', () => {
    service.loadProfile();
    httpMock.expectOne(PROFILE_URL).flush(profileFixture);

    service.loadProfile(true);
    httpMock.expectOne(PROFILE_URL).flush({ ...profileFixture, name: 'Updated' });

    expect(service.profile()?.name).toBe('Updated');
  });

  it('should refetch after the cache is invalidated', () => {
    service.loadProfile();
    httpMock.expectOne(PROFILE_URL).flush(profileFixture);

    service.invalidate('profile');
    service.loadProfile();
    httpMock.expectOne(PROFILE_URL).flush(profileFixture);
  });

  it('should flag an error and stay retryable when a load fails', () => {
    service.loadProfile();
    httpMock
      .expectOne(PROFILE_URL)
      .flush('not found', { status: 404, statusText: 'Not Found' });

    expect(service.profile()).toBeNull();
    expect(service.profileError()).toBe(true);
    expect(service.isLoading()).toBe(false);

    // A failed key is not cached, so a plain retry re-issues the request.
    service.loadProfile();
    httpMock.expectOne(PROFILE_URL).flush(profileFixture);

    expect(service.profileError()).toBe(false);
    expect(service.profile()?.name).toBe('Ahmed Mohsen Albaz');
  });

  it('should track loading across concurrent requests', () => {
    service.loadProfile();
    service.loadSkills();
    expect(service.isLoading()).toBe(true);

    httpMock.expectOne(PROFILE_URL).flush(profileFixture);
    expect(service.isLoading()).toBe(true);

    httpMock.expectOne('assets/data/skills.json').flush({ categories: [] });
    expect(service.isLoading()).toBe(false);
  });
});
