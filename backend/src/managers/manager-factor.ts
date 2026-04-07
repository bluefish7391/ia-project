import { TenantManager } from "./tenant-manager";
import { OrganizationManager } from "./organization-manager";
import { AppUserManager } from "./app-user-manager";
import { SecurityManager } from "./security-manager";
import { StudentManager } from "./student-manager";

export const tenantManager = new TenantManager();
export const organizationManager = new OrganizationManager();
export const appUserManager = new AppUserManager();
export const securityManager = new SecurityManager();
export const studentManager = new StudentManager();