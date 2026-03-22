import { TenantDAO } from "./tenant-dao";
import { OrganizationDAO } from "./organization-dao";
import { AppUserDAO } from "./app-user-dao";
import { SecurityDAO } from "./security-dao";

export const tenantDAO = new TenantDAO();
export const organizationDAO = new OrganizationDAO();
export const appUserDAO = new AppUserDAO();
export const securityDAO = new SecurityDAO();