import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
export const PORTAL_THEME_STORAGE_KEY = 'portal.themeMode';

/**
 * Sole owner of `<html data-theme="...">`. Two independent sources feed it - the public
 * tenant site's own TenantTheme.themeMode (via TenantProfileShellComponent) and the Control
 * Portal's own UserPreference.themeMode (via AdminShellComponent /
 * PlatformAdminShellComponent) - never both at once, since the two route trees are never
 * mounted in the same tab. Neither source ever reads the other's stored value.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly modeSignal = signal<ThemeMode>(this.readCachedBootstrapGuess());
  readonly mode = this.modeSignal.asReadonly();

  constructor() {
    // Agrees with whatever index.html's inline bootstrap script already painted.
    this.applyTheme(this.modeSignal());
  }

  getCurrentTheme(): ThemeMode {
    return this.modeSignal();
  }

  /** DOM + signal only - no storage, no HTTP. Used both for the initial guess and to reflect
   *  a value that already came from the server without re-saving it. */
  applyTheme(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    this.document.documentElement.setAttribute('data-theme', mode);
  }

  /** Caches `mode` as a non-authoritative bootstrap guess for next time - portal-only; the
   *  public tenant site never needs this (its resolver already blocks render until the real
   *  value is known, so there's nothing to cache a guess for). */
  persistTheme(mode: ThemeMode): void {
    try {
      localStorage.setItem(PORTAL_THEME_STORAGE_KEY, mode);
    } catch {
      // Private browsing or storage full - the in-memory mode still works for this tab.
    }
  }

  /** The optimistic local half of a user-initiated switch: apply + cache immediately.
   *  Callers persist server-side themselves and call applyTheme() again to revert on
   *  failure - this service has no HTTP concerns of its own. */
  setTheme(mode: ThemeMode): void {
    this.applyTheme(mode);
    this.persistTheme(mode);
  }

  private readCachedBootstrapGuess(): ThemeMode {
    try {
      return localStorage.getItem(PORTAL_THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
}
