import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionHeaderComponent } from '../../../shared/components';
import { SeoService } from '../../../core/services/seo.service';
import { PLATFORM_BRANDING } from '../../../core/config/platform-branding.config';
import {
  AUDIENCES,
  BENEFITS,
  FEATURES,
  FIRST_CLIENT_EXAMPLE,
  HERO,
  HOW_IT_WORKS
} from '../content/home.content';

@Component({
  selector: 'app-marketing-home',
  standalone: true,
  imports: [RouterLink, SectionHeaderComponent],
  templateUrl: './marketing-home.component.html',
  styleUrl: './marketing-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketingHomeComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly platformName = PLATFORM_BRANDING.name;
  readonly hero = HERO;
  readonly benefits = BENEFITS;
  readonly howItWorks = HOW_IT_WORKS;
  readonly features = FEATURES;
  readonly audiences = AUDIENCES;
  readonly firstClient = FIRST_CLIENT_EXAMPLE;

  ngOnInit(): void {
    this.seo.setMarketingSeo({
      title: this.platformName,
      description: PLATFORM_BRANDING.seo.defaultDescription
    });
  }
}
