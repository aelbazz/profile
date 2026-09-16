import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppComponent } from './app';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the brand title', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.navbar-brand')?.textContent).toContain('Albaz Portfolio');
  });

  it('should start with the mobile menu collapsed', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.isNavbarCollapsed()).toBe(true);
  });

  it('should toggle and collapse the mobile menu', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.toggleNavbar();
    expect(app.isNavbarCollapsed()).toBe(false);

    app.collapseNavbar();
    expect(app.isNavbarCollapsed()).toBe(true);
  });

  it('should expose aria-expanded matching the menu state', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const toggler = fixture.nativeElement.querySelector('.navbar-toggler') as HTMLButtonElement;

    expect(toggler.getAttribute('aria-expanded')).toBe('false');

    fixture.componentInstance.toggleNavbar();
    fixture.detectChanges();
    expect(toggler.getAttribute('aria-expanded')).toBe('true');
  });
});
