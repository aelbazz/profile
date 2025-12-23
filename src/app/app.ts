import { Component, OnInit, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { VERSION } from '@angular/core';
import { ConfigDataService } from './core/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  title = 'Professional Portfolio';
  currentYear = new Date().getFullYear();
  
  navItems = [
    { path: '/profile', label: 'Profile', icon: 'fas fa-id-badge' },
    { path: '/experience', label: 'Experience', icon: 'fas fa-briefcase' },
    { path: '/projects', label: 'Projects', icon: 'fas fa-folder' },
    { path: '/achievements', label: 'Achievements', icon: 'fas fa-trophy' },
    { path: '/courses', label: 'Courses', icon: 'fas fa-book' },
    { path: '/skills', label: 'Skills', icon: 'fas fa-code' },
    { path: '/contact', label: 'Contact', icon: 'fas fa-envelope' }
  ];

  readonly profile = computed(() => this.configService.profile());
  readonly authorName = computed(() => this.profile()?.name || 'Author');
  readonly linkedinUrl = computed(() => this.profile()?.linkedin || '#');

  constructor(private configService: ConfigDataService) {}

  ngOnInit(): void {
    this.configService.loadProfile();
  }

  getAngularVersion(): string {
    return VERSION.full;
  }
}
