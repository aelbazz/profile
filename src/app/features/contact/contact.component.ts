import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnInit {
  private readonly configService = inject(ConfigDataService);
  
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
    const link = document.createElement('a');
    link.href = '/assets/files/Ahmed-Albaz-Frontend-staff-Engineer-Jan-2026.pdf';
    link.download = 'Ahmed-Albaz-Frontend-staff-Engineer-Jan-2026.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

