import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ConfigDataService } from '../../core/services';
import { SectionHeaderComponent } from '../../shared/components';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [SectionHeaderComponent],
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
}

