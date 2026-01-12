import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService, FileDownloadService } from '../../core/services';
import { ActionCardComponent } from '../../shared/components';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ActionCardComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  private readonly fileDownloadService = inject(FileDownloadService);
  
  readonly contact = this.configService.contact;

  ngOnInit(): void {
    this.configService.loadContact();
  }

  getWhatsAppLink(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  }

  getMailtoLink(email: string): string {
    return `mailto:${email}`;
  }

  downloadCV(): void {
    this.fileDownloadService.downloadCV();
  }

  getSocialIcon(platform: string): string {
    const iconMap: Record<string, string> = {
      'LinkedIn': 'fab fa-linkedin',
      'GitHub': 'fab fa-github',
      'Medium': 'fab fa-medium',
      'MuchSkills': 'fas fa-diagram-project',
      'Twitter': 'fab fa-twitter',
      'Facebook': 'fab fa-facebook',
      'Instagram': 'fab fa-instagram'
    };
    return iconMap[platform] || 'fas fa-link';
  }
}

