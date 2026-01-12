import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ConfigDataService, PdfExportService } from '../../core/services';
import { Achievement } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
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

  downloadCV(): void {
    const link = document.createElement('a');
    link.href = '/assets/files/Ahmed-Albaz-Frontend-staff-Engineer-Jan-2026.pdf';
    link.download = 'Ahmed-Albaz-Frontend-staff-Engineer-Jan-2026.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getAchievementIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'award': 'fas fa-trophy',
      'certification': 'fas fa-certificate',
      'recognition': 'fas fa-star',
      'milestone': 'fas fa-flag-checkered'
    };
    return iconMap[category] || 'fas fa-award';
  }

  getCategoryLabel(category: string): string {
    const labelMap: Record<string, string> = {
      'award': 'Award',
      'certification': 'Certification',
      'recognition': 'Recognition',
      'milestone': 'Milestone'
    };
    return labelMap[category] || category;
  }

  getAchievementsByCategory(achievements: Achievement[], category: string): Achievement[] {
    return achievements.filter(a => a.category === category);
  }
}

