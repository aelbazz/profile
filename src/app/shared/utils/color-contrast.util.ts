/**
 * Dependency-free WCAG contrast math, used to derive an accessible variant of a tenant's
 * brand color for use against a dark surface - see TenantProfileShellComponent.cssVariables().
 * A client's primaryColor/secondaryColor/accentColor stay literally the same across modes
 * (the platform never silently rewrites their branding), but a color chosen for a white page
 * can easily fail contrast against a dark one, so this computes a lightened variant only
 * when the original genuinely fails, rather than asking clients to configure a second set of
 * colors for dark mode.
 */

type Rgb = readonly [number, number, number];
interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex([r, g, b]: Rgb): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl([r, g, b]: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === rn
      ? ((gn - bn) / d + (gn < bn ? 6 : 0))
      : max === gn
        ? (bn - rn) / d + 2
        : (rn - gn) / d + 4;

  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function relativeLuminance([r, g, b]: Rgb): number {
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG contrast ratio between two hex colors, 1 (no contrast) to 21 (max). */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

const DARK_SURFACE_HEX = '#1e293b'; // = _tokens.scss [data-theme='dark'] --color-surface
const MIN_CONTRAST = 4.5;
const LIGHTNESS_STEP = 4;
const MAX_LIGHTNESS = 85;

/**
 * Returns `hex` unchanged if it already clears 4.5:1 against the fixed dark card surface;
 * otherwise boosts HSL lightness in fixed steps (hue/saturation untouched, so it stays
 * recognisably the same brand color) until it clears the threshold or hits an 85% lightness
 * ceiling (never washes out to near-white). Pure function, no dependency.
 */
export function accessibleDarkVariant(hex: string, surfaceHex: string = DARK_SURFACE_HEX): string {
  if (contrastRatio(hex, surfaceHex) >= MIN_CONTRAST) return hex;

  let hsl = rgbToHsl(hexToRgb(hex));
  while (hsl.l < MAX_LIGHTNESS) {
    hsl = { ...hsl, l: Math.min(MAX_LIGHTNESS, hsl.l + LIGHTNESS_STEP) };
    const candidate = rgbToHex(hslToRgb(hsl));
    if (contrastRatio(candidate, surfaceHex) >= MIN_CONTRAST || hsl.l >= MAX_LIGHTNESS) {
      return candidate;
    }
  }
  return rgbToHex(hslToRgb(hsl));
}
