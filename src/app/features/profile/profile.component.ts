import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ConfigDataService, PdfExportService } from '../../core/services';
import { SectionHeaderComponent } from '../../shared/components';
import { BadgeComponent } from '../../shared/components';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SectionHeaderComponent, BadgeComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  private readonly pdfService = inject(PdfExportService);

  readonly profile = this.configService.profile;
  readonly skills = this.configService.skills;
  readonly experience = this.configService.experience;
  readonly achievements = this.configService.achievements;
  readonly projects = this.configService.projects;
  
  isExporting = signal(false);

  ngOnInit(): void {
    this.configService.loadProfile();
    this.configService.loadSkills();
    this.configService.loadExperience();
    this.configService.loadAchievements();
    this.configService.loadProjects();
  }

  async exportToPdf(): Promise<void> {
    this.isExporting.set(true);
    try {
      await this.pdfService.exportToPdf('profile-export', 'my-professional-profile.pdf');
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      this.isExporting.set(false);
    }
  }
}

