/**
 * A tenant's visual configuration, as returned nested under `profile.theme` by the public
 * API. `designSystem` and `layout` are validated backend-side against a registry
 * (GET /design-registry) - this frontend maps each known id to actual rendering; an unknown
 * id it has no mapping for should fall back to the 'modern'/'classic' defaults rather than
 * break the page.
 */
export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  fontFamily: string;
  borderRadius: string;
  layout: string;
  designSystem: string;
  /** 'light' | 'dark' today, validated backend-side against a registry - see
   *  GET /design-registry's themeModes. */
  themeMode: string;
  customCss: string | null;
}
