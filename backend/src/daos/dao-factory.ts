import { TenantDAO } from "./tenant-dao";
import { OrganizationDAO } from "./organization-dao";
import { AppUserDAO } from "./app-user-dao";

export const tenantDAO = new TenantDAO();
export const organizationDAO = new OrganizationDAO();
export const appUserDAO = new AppUserDAO();