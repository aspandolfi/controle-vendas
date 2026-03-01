import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html'
})
export class Navbar {
  isCollapsed = true;

  constructor(private router: Router) {}

  toggleMenu(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  closeMenu(): void {
    this.isCollapsed = true;
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
    this.closeMenu();
  }
}
