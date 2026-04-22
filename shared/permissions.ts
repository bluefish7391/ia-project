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
	SYS_ADMIN_DELETE_USER: {
		name: "System admin delete user",
		description: "Delete users from Google Identity Platform as a system administrator"
	}
} as const satisfies Record<string, AppPermission>;