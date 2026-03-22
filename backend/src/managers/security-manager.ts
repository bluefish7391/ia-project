import { getAuth } from "firebase-admin/auth";
import { AppUserSession, Tenant } from "../../../shared/kinds";
import { organizationDAO, securityDAO, tenantDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";

export class SecurityManager {
	public async getUserTenants(googleToken: string | undefined): Promise<Tenant[]> {
		try {
			if (!googleToken) {
				throw new Error("Google token is required.");
			}
			const decoded = await getAuth().verifyIdToken(googleToken);
			const email = decoded.email;
			if (!email) {
				throw new Error("Email not found in token.");
			}
			const appUsers = await securityDAO.getAppUsersByEmail(email);
			if (!appUsers) {
				return [];
			}
			const tenantIDs = new Set(appUsers.map((user) => user.tenantID));
			return await securityDAO.getTenantsByIDs(tenantIDs);
		} catch (error) {
			console.error("Error fetching user tenants:", error);
			throw new Error("Failed to fetch user tenants.");
		}
	}

	public async createAppSession(tenantID: string, googleToken: string | undefined): Promise<AppUserSession> {
		try {
			if (!googleToken) {
				throw new Error("Google token is required.");
			}
			const decoded = await getAuth().verifyIdToken(googleToken);
			const email = decoded.email;
			if (!email) {
				throw new Error("Email not found in token.");
			}

			const appUser = await securityDAO.getAppUserByEmailAndTenantID(email, tenantID);
			if (!appUser) {
				throw new Error("User not found for the given tenant.");
			}

			const tenant = await tenantDAO.getTenant(tenantID);
			const organization = await organizationDAO.getOrganization(tenantID, appUser.organizationID);
			const appUserSession: AppUserSession = {
				sessionID: generateId() + generateId() + generateId(),
				tenantID,
				userID: appUser.id,
				tenantName: tenant ? tenant.name : "",
				organizationID: appUser.organizationID,
				organizationName: organization ? organization.name : "",
			};
			return appUserSession;
		} catch (error) {
			console.error("Error verifying Google token:", error);
			throw new Error("Failed to verify Google token.");
		}
	}
}