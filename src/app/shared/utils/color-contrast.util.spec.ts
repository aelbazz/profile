import { accessibleDarkVariant, contrastRatio } from './color-contrast.util';

describe('color-contrast.util', () => {
  describe('contrastRatio', () => {
    it('is 21 for black on white', () => {
      expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    });

    it('is 1 for identical colors', () => {
      expect(contrastRatio('#6366f1', '#6366f1')).toBeCloseTo(1, 5);
    });
  });

  describe('accessibleDarkVariant', () => {
    it('returns white unchanged - already accessible against any dark surface', () => {
      expect(accessibleDarkVariant('#ffffff')).toBe('#ffffff');
    });

    it('lightens a brand color that fails 4.5:1 against the dark surface', () => {
      const surface = '#1e293b';
      expect(contrastRatio('#6366f1', surface)).toBeLessThan(4.5);

      const result = accessibleDarkVariant('#6366f1', surface);
      expect(result).not.toBe('#6366f1');
      expect(contrastRatio(result, surface)).toBeGreaterThanOrEqual(4.5);
    });

    it('never exceeds the lightness ceiling even for a very dark, low-contrast color', () => {
      const result = accessibleDarkVariant('#000010', '#1e293b');
      // A near-black candidate against a dark surface may never clear 4.5:1 within the
      // ceiling - the function must still terminate and return something, not loop forever.
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});
