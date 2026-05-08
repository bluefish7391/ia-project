import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';
import { AppPermissions } from 'shared/permissions';

interface NavLink {
	label: string;
	route: string;
	requiredPermissions?: string[];
}

interface NavGroup {
	label: string;
	icon: string;
	links: NavLink[];
	requiredPermissions?: string[];
}

const NAV_GROUPS: NavGroup[] = [
	{
		label: 'Administration',
		icon: 'admin_panel_settings',
		links: [
			{
				label: 'Organizations', route: '/admin/organizations',
				requiredPermissions: [AppPermissions.LIST_ORGANIZATIONS.name, AppPermissions.VIEW_ORGANIZATIONS.name]
			},
			{ 
				label: 'Tenants', route: '/admin/tenants',
				requiredPermissions: [AppPermissions.LIST_TENANTS.name, AppPermissions.VIEW_TENANTS.name] 
			},
			{ 
				label: 'App Users', route: '/admin/app-users',
				requiredPermissions: [AppPermissions.LIST_USERS.name, AppPermissions.VIEW_USERS.name]
			},
			{ 
				label: 'Students', route: '/admin/students',
				requiredPermissions: [AppPermissions.LIST_STUDENTS.name, AppPermissions.VIEW_STUDENTS.name]
			},
			{ 
				label: 'Roles', route: '/admin/app-roles',
				requiredPermissions: [AppPermissions.LIST_ROLES.name, AppPermissions.VIEW_ROLES.name]
			},
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
	private readonly router = inject(Router);
	private readonly authService = inject(AuthService);
	private readonly sessionService = inject(SessionService);
	protected readonly visibleGroups = computed(() => {
		const session = this.sessionService.session();
		if (!session) {
			return [];
		}

		const perms = new Set(session.permissions);
		return NAV_GROUPS
			.filter(g => {
				if (!g.requiredPermissions) {
					return true;
				}
				return g.requiredPermissions.every(p => perms.has(p));
			}).map(g => ({
				...g,
				links: g.links.filter(l => {
					if (!l.requiredPermissions) {
						return true;
					}
					return l.requiredPermissions.every(p => perms.has(p));
				})
			}))
			.filter(g => g.links.length > 0);
	});

	protected async logout(): Promise<void> {
		this.sessionService.clearSession();
		await this.authService.signOut();
		await this.router.navigate(['/login']);
	}
}
