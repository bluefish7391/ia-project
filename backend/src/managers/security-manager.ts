import { getAuth } from "firebase-admin/auth";
import { AppRole, AppUserSession, Tenant } from "../../../shared/kinds";
import { appRoleDAO, organizationDAO, securityDAO, tenantDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { BadRequestError, ServerError } from "../kinds";

export class SecurityManager {
	public async getUserTenants(googleToken: string | undefined): Promise<Tenant[]> {
		if (!googleToken) {
			throw new BadRequestError("Google token is required.");
		}

		const decoded = await getAuth().verifyIdToken(googleToken);
		const email = decoded.email;
		console.log("getUserTenants: decoded=", decoded);
		if (!email) {
			throw new BadRequestError("Email not found in token.");
		}

		if (!decoded.email_verified) {
			throw new BadRequestError("Email not verified.");
		}

		const appUsers = await securityDAO.getAppUsersByEmail(email);
		console.log("getUserTenants: appUsers=", appUsers);
		if (!appUsers) {
			return [];
		}

		const tenantIDs = new Set(appUsers.map((user) => user.tenantID));
		console.log("getUserTenants: tenantIDs=", tenantIDs);
		const tenants = await securityDAO.getTenantsByIDs(tenantIDs);
		console.log("getUserTenants: tenants=", tenants);
		return tenants;
	}

	public async createAppSession(tenantID?: string, googleToken?: string): Promise<AppUserSession> {
		if (!tenantID) throw new BadRequestError("Tenant ID is required.");
		if (!googleToken) throw new BadRequestError("Google token is required.");

		const decoded = await getAuth().verifyIdToken(googleToken);
		const email = decoded.email;
		console.log("createAppSession: decoded=", decoded);
		if (!email) {
			throw new BadRequestError("Email not found in token.");
		}

		if (!decoded.email_verified) {
			throw new BadRequestError("Email not verified.");
		}

		const appUser = await securityDAO.getAppUserByEmailAndTenantID(email, tenantID);
		console.log("createAppSession: appUser=", appUser);
		if (!appUser) {
			throw new ServerError("User not found for the given tenant.");
		}

		const tenant = await tenantDAO.getTenant(tenantID);
		const organization = await organizationDAO.getOrganization(tenantID, appUser.organizationID);
		const permissions = await this.getPermisionsForUser(tenantID, appUser.id);
		const appUserSession: AppUserSession = {
			sessionID: generateId() + generateId() + generateId(),
			tenantID,
			userID: appUser.id,
			tenantName: tenant ? tenant.name : "",
			organizationID: appUser.organizationID,
			organizationName: organization ? organization.name : "",
			permissions,
		};

		console.log("createAppSession: appUserSession=", appUserSession);
		await securityDAO.createAppSession(appUserSession);
		return appUserSession;
	}

	private async getPermisionsForUser(tenantID: string, appUserID: string): Promise<string[]> {
		const userRoles = await appRoleDAO.getUserRolesForAppUser(tenantID, appUserID);
		const appRoles: AppRole[] = await appRoleDAO.getAppRolesFromUserRoles(tenantID, userRoles.map(r => r.appRoleID));
		const userPermissions = new Set(appRoles.flatMap(r => r.appPermissions));
		return Array.from(userPermissions);
	}
}