import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CvDocument } from '../../../core/services/admin-api.service';
import { cvSectionLabel } from './cv-section-labels';

/**
 * Renders the normalized CvDocument returned by GET .../preview - the exact same model the
 * PDF/DOCX are generated from. Purely presentational: no API calls, no own state.
 */
@Component({
  selector: 'app-cv-preview-pane',
  standalone: true,
  imports: [],
  templateUrl: './cv-preview-pane.component.html',
  styleUrls: ['./cv-preview-pane.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CvPreviewPaneComponent {
  @Input() document: CvDocument | null = null;
  @Input() loading = false;

  readonly cvSectionLabel = cvSectionLabel;
}
