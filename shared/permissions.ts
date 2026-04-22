export interface AppPermission {
	name: string;
	description: string;
}

export const AppPermissions = {
	CREATE_USERS: {
		name: "Create users",
		description: "Add new users"
	},
	DELETE_USERS: {
		name: "Delete users",
		description: "Delete existing users"
	},
	VIEW_USERS: {
		name: "View users",
		description: "View specified users"
	},
	LIST_USERS: {
		name: "List users",
		description: "List users without directly accessing them"
	},
	EDIT_USERS: {
		name: "Edit users",
		description: "Update existing users"
	},
	SYS_ADMIN_DELETE_USER: {
		name: "System admin delete user",
		description: "Delete users from Google Identity Platform as a system administrator"
	},
	LIST_ROLES: {
		name: "List roles",
		description: "List app roles without directly accessing them"
	},
	VIEW_ROLES: {
		name: "View roles",
		description: "View a specific app role"
	},
	CREATE_ROLES: {
		name: "Create roles",
		description: "Add new app roles"
	},
	EDIT_ROLES: {
		name: "Edit roles",
		description: "Update existing app roles"
	},
	DELETE_ROLES: {
		name: "Delete roles",
		description: "Delete existing app roles"
	},
	LIST_ORGANIZATIONS: {
		name: "List organizations",
		description: "List organizations without directly accessing them"
	},
	VIEW_ORGANIZATIONS: {
		name: "View organizations",
		description: "View a specific organization"
	},
	CREATE_ORGANIZATIONS: {
		name: "Create organizations",
		description: "Add new organizations"
	},
	EDIT_ORGANIZATIONS: {
		name: "Edit organizations",
		description: "Update existing organizations"
	},
	DELETE_ORGANIZATIONS: {
		name: "Delete organizations",
		description: "Delete existing organizations"
	},
	LIST_STUDENTS: {
		name: "List students",
		description: "List students without directly accessing them"
	},
	VIEW_STUDENTS: {
		name: "View students",
		description: "View a specific student"
	},
	CREATE_STUDENTS: {
		name: "Create students",
		description: "Add new students"
	},
	EDIT_STUDENTS: {
		name: "Edit students",
		description: "Update existing students"
	},
	DELETE_STUDENTS: {
		name: "Delete students",
		description: "Delete existing students"
	},
	VIEW_LUNCH_CHECK_RECORDS: {
		name: "View lunch check records",
		description: "View student lunch check-in/check-out records and history"
	},
	MANAGE_LUNCH_CHECK_RECORDS: {
		name: "Manage lunch check records",
		description: "Record student lunch check-in/check-out and manage lunch check configuration"
	},
	LIST_TENANTS: {
		name: "List tenants",
		description: "List tenants without directly accessing them"
	},
	VIEW_TENANTS: {
		name: "View tenants",
		description: "View a specific tenant"
	},
	CREATE_TENANTS: {
		name: "Create tenants",
		description: "Add new tenants"
	},
	EDIT_TENANTS: {
		name: "Edit tenants",
		description: "Update existing tenants"
	},
	DELETE_TENANTS: {
		name: "Delete tenants",
		description: "Delete existing tenants"
	}
} as const satisfies Record<string, AppPermission>;