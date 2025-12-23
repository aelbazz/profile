import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { VERSION } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'Professional Portfolio';
  currentYear = new Date().getFullYear();
  
  navItems = [
    { path: '/profile', label: 'Profile', icon: 'fas fa-id-badge' },
    { path: '/experience', label: 'Experience', icon: 'fas fa-briefcase' },
    { path: '/projects', label: 'Projects', icon: 'fas fa-folder' },
    { path: '/achievements', label: 'Achievements', icon: 'fas fa-trophy' },
    { path: '/courses', label: 'Courses', icon: 'fas fa-book' },
    { path: '/management', label: 'Management', icon: 'fas fa-users' },
    { path: '/skills', label: 'Skills', icon: 'fas fa-code' },
    { path: '/timeline', label: 'Timeline', icon: 'fas fa-history' },
    { path: '/contact', label: 'Contact', icon: 'fas fa-envelope' }
  ];

  getAngularVersion(): string {
    return VERSION.full;
  }
}
