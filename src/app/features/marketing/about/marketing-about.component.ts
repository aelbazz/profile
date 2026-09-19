import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { SectionHeaderComponent } from '../../../shared/components';
import { SeoService } from '../../../core/services/seo.service';
import { PLATFORM_BRANDING } from '../../../core/config/platform-branding.config';
import { ABOUT_CONTENT } from '../content/about.content';

@Component({
  selector: 'app-marketing-about',
  standalone: true,
  imports: [SectionHeaderComponent],
  templateUrl: './marketing-about.component.html',
  styleUrl: './marketing-about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketingAboutComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly platformName = PLATFORM_BRANDING.name;
  readonly content = ABOUT_CONTENT;

  ngOnInit(): void {
    this.seo.setMarketingSeo({
      title: 'About',
      description: this.content.intro
    });
  }
}
