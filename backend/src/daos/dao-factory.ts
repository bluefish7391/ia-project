import { TenantDAO } from "./tenant-dao";
import { OrganizationDAO } from "./organization-dao";
import { AppUserDAO } from "./app-user-dao";
import { SecurityDAO } from "./security-dao";
import { StudentDAO } from "./student-dao";
import { AppRoleDAO } from "./app-role-dao";
import { LunchCheckDAO } from "./lunch-check-dao";

export const tenantDAO = new TenantDAO();
export const organizationDAO = new OrganizationDAO();
export const appUserDAO = new AppUserDAO();
export const securityDAO = new SecurityDAO();
export const studentDAO = new StudentDAO();
export const appRoleDAO = new AppRoleDAO();
export const lunchCheckDAO = new LunchCheckDAO();