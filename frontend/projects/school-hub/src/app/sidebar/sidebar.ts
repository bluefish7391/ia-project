import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';

interface NavLink {
  label: string;
  route: string;
}

interface NavGroup {
  label: string;
  icon: string;
  links: NavLink[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Administration',
    icon: 'admin_panel_settings',
    links: [
      { label: 'Organizations', route: '/admin/organizations' },
      { label: 'Tenants', route: '/admin/tenants' },
      { label: 'App Users', route: '/admin/app-users' },
      { label: 'Students', route: '/admin/students' },
      { label: 'Roles', route: '/admin/app-roles' },
      { label: 'Todo List', route: '/admin/todo-list' },
    ],
  },
  {
    label: 'Tools',
    icon: 'build',
    links: [
      { label: 'Lunch Check', route: '/lunch-check' },
    ],
  },
  {
    label: 'System Administration',
    icon: 'settings',
    links: [
      { label: 'Delete User', route: '/sys-admin/delete-user' },
    ],
  },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatExpansionModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected readonly navGroups = NAV_GROUPS;

  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected async logout(): Promise<void> {
    this.sessionService.clearSession();
    await this.authService.signOut();
    await this.router.navigate(['/login']);
  }
}
