import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';
import { PLATFORM_BRANDING } from '../../../core/config/platform-branding.config';
import { SERVICES } from '../content/services.content';

@Component({
  selector: 'app-marketing-services',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './marketing-services.component.html',
  styleUrl: './marketing-services.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketingServicesComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly platformName = PLATFORM_BRANDING.name;
  readonly services = SERVICES;

  ngOnInit(): void {
    this.seo.setMarketingSeo({
      title: 'Services',
      description: `Everything ${this.platformName} offers to build and maintain a professional online profile.`
    });
  }
}
