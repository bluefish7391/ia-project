import { TenantManager } from "./tenant-manager";
import { OrganizationManager } from "./organization-manager";
import { AppUserManager } from "./app-user-manager";
import { SecurityManager } from "./security-manager";
import { StudentManager } from "./student-manager";
import { AppRoleManager } from "./app-role-manager";
import { SysAdminManager } from "./sys-admin-manager";
import { LunchCheckManager } from "./lunch-check-manager";

export const tenantManager = new TenantManager();
export const organizationManager = new OrganizationManager();
export const appUserManager = new AppUserManager();
export const securityManager = new SecurityManager();
export const studentManager = new StudentManager();
export const appRoleManager = new AppRoleManager();
export const sysAdminManager = new SysAdminManager();
export const lunchCheckManager = new LunchCheckManager();