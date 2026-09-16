import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Renders the loading spinner or, when a fetch has failed, an error message with a
 * retry button. Replaces the `@else` spinner blocks that previously spun forever
 * whenever a data file failed to load.
 */
@Component({
  selector: 'app-data-state',
  standalone: true,
  templateUrl: './data-state.component.html',
  styleUrls: ['./data-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataStateComponent {
  /** What is being loaded, e.g. 'projects'. Used in both messages. */
  readonly label = input.required<string>();
  /** True when the last fetch failed and no data is available. */
  readonly hasError = input<boolean>(false);

  /** Emitted when the user asks to retry the failed fetch. */
  readonly retry = output<void>();
}
