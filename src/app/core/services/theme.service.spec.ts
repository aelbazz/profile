import { TestBed } from '@angular/core/testing';
import { ThemeService, PORTAL_THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to light with no cached preference', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.getCurrentTheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('boots from a cached dark preference', () => {
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, 'dark');
    const service = TestBed.inject(ThemeService);
    expect(service.getCurrentTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('applyTheme sets the DOM attribute and the signal without touching storage', () => {
    const service = TestBed.inject(ThemeService);
    service.applyTheme('dark');
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(PORTAL_THEME_STORAGE_KEY)).toBeNull();
  });

  it('persistTheme writes the cache without touching the DOM/signal', () => {
    const service = TestBed.inject(ThemeService);
    service.persistTheme('dark');
    expect(localStorage.getItem(PORTAL_THEME_STORAGE_KEY)).toBe('dark');
    expect(service.mode()).toBe('light');
  });

  it('setTheme applies and persists together', () => {
    const service = TestBed.inject(ThemeService);
    service.setTheme('dark');
    expect(service.mode()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(PORTAL_THEME_STORAGE_KEY)).toBe('dark');
  });

  it('does not crash when localStorage throws', () => {
    const original = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('blocked');
      },
    });

    expect(() => {
      const service = TestBed.inject(ThemeService);
      service.setTheme('dark');
    }).not.toThrow();

    Object.defineProperty(window, 'localStorage', { configurable: true, value: original });
  });
});
