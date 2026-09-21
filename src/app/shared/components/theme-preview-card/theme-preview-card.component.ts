import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ThemeMode } from '../../../core/services/theme.service';

export interface ThemePreviewColors {
  primaryColor: string;
}

/**
 * A small, self-contained light/dark preview swatch for the Branding page's theme picker
 * (spec: preview both modes before saving). `[data-theme]` is set directly on this
 * component's own host, re-scoping the global semantic tokens from _tokens.scss to just this
 * subtree - see _tokens.scss's selector comment - so both cards render correctly side by
 * side regardless of what the page's own <html data-theme> currently is.
 */
@Component({
  selector: 'app-theme-preview-card',
  standalone: true,
  template: `
    <div class="preview-card" [class.selected]="selected">
      <span class="preview-label">{{ mode === 'dark' ? 'Dark' : 'Light' }}</span>
      <div class="preview-body">
        <h4>Heading</h4>
        <p>Body text on this surface.</p>
        <button type="button" class="preview-btn" [style.background]="theme.primaryColor">
          Primary
        </button>
        <span class="preview-badge">Badge</span>
      </div>
    </div>
  `,
  styleUrls: ['./theme-preview-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-theme]': 'mode'
  }
})
export class ThemePreviewCardComponent {
  @Input({ required: true }) mode!: ThemeMode;
  @Input({ required: true }) theme!: ThemePreviewColors;
  @Input() selected = false;
}
