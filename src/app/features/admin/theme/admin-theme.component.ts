import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AdminApiService,
  DesignRegistry,
  LayoutOption
} from '../../../core/services/admin-api.service';
import { ConfigDataService } from '../../../core/services';
import { describeApiError } from '../admin-error';

@Component({
  selector: 'app-admin-theme',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-theme.component.html',
  styleUrls: ['./admin-theme.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminThemeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminApiService);
  private readonly configData = inject(ConfigDataService);

  readonly form = this.fb.nonNullable.group({
    designSystem: 'modern',
    layout: 'classic',
    primaryColor: '#6366f1',
    secondaryColor: '#64748b',
    accentColor: '#06b6d4',
    backgroundColor: '#ffffff',
    textColor: '#334155',
    headingColor: '#0f172a',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.5rem',
    darkMode: false,
    customCss: ''
  });

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  readonly registry = signal<DesignRegistry | null>(null);

  /** Tracks the design-system control reactively - a plain `.value` read would not update
   *  `availableLayouts` when the user changes the dropdown. */
  private readonly selectedDesignSystem = toSignal(
    this.form.controls.designSystem.valueChanges.pipe(map(v => v)),
    { initialValue: this.form.controls.designSystem.value }
  );

  private readonly selectedDesignSystemOption = computed(() =>
    this.registry()?.designSystems.find(d => d.id === this.selectedDesignSystem())
  );

  readonly selectedDesignSystemDescription = computed(
    () => this.selectedDesignSystemOption()?.description ?? ''
  );

  readonly availableLayouts = computed<LayoutOption[]>(() => {
    const reg = this.registry();
    const supported = this.selectedDesignSystemOption()?.layouts ?? [];
    return reg ? reg.layouts.filter(l => supported.includes(l.id)) : [];
  });

  constructor() {
    this.load();

    // If switching design system leaves the current layout unsupported, correct it rather
    // than let the form sit in a combination the API will reject on save.
    this.form.controls.designSystem.valueChanges.subscribe(() => {
      const layouts = this.availableLayouts();
      const current = this.form.controls.layout.value;
      if (layouts.length > 0 && !layouts.some(l => l.id === current)) {
        this.form.controls.layout.setValue(layouts[0].id);
      }
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({ theme: this.api.getTheme(), registry: this.api.getDesignRegistry() }).subscribe({
      next: ({ theme, registry }) => {
        this.registry.set(registry);
        this.form.patchValue({
          designSystem: theme.designSystem,
          layout: theme.layout,
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          accentColor: theme.accentColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          headingColor: theme.headingColor,
          fontFamily: theme.fontFamily,
          borderRadius: theme.borderRadius,
          darkMode: theme.darkMode,
          customCss: theme.customCss ?? ''
        });
        this.loading.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(describeApiError(e));
        this.loading.set(false);
      }
    });
  }

  save(): void {
    if (this.saving()) return;

    this.saving.set(true);
    this.error.set(null);
    this.saved.set(false);

    const raw = this.form.getRawValue();
    this.api
      .updateTheme({
        designSystem: raw.designSystem,
        layout: raw.layout,
        primaryColor: raw.primaryColor,
        secondaryColor: raw.secondaryColor,
        accentColor: raw.accentColor,
        backgroundColor: raw.backgroundColor,
        textColor: raw.textColor,
        headingColor: raw.headingColor,
        fontFamily: raw.fontFamily,
        borderRadius: raw.borderRadius,
        darkMode: raw.darkMode,
        customCss: raw.customCss.trim() || undefined
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.set(true);
          this.configData.invalidate();
        },
        error: (e: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(describeApiError(e));
        }
      });
  }
}
