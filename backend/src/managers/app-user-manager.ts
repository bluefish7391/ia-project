import { appRoleDAO, appUserDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { AppUser, AppUserDetail, AppUserUpsertPayload, UserRole } from "../../../shared/kinds";
import { RequestContext } from "../request-context";
import { BadRequestError, ServerError } from "../kinds";

export class AppUserManager {
	async getAllAppUsers(requestContext: RequestContext): Promise<AppUser[]> {
		const appUsers = await appUserDAO.getAllAppUsers(requestContext.getCurrentTenantID());
		console.log("getAllAppUsers: appUsers=", appUsers);
		return appUsers;
	}

	async getAppUser(requestContext: RequestContext, id: string): Promise<AppUser | null> {
		const appUser = await appUserDAO.getAppUser(requestContext.getCurrentTenantID(), id);
		console.log("getAppUser: appUser=", appUser);
		if (!appUser) {
			throw new BadRequestError("No app user with that id");
		}

		const appUserDetail: AppUserDetail = { ...appUser, roleIDs: [] };
		const appUserRoles: UserRole[] = await appRoleDAO.getUserRolesForAppUser(requestContext.getCurrentTenantID(), id);
		appUserDetail.roleIDs = appUserRoles.map((r) => r.appRoleID);
		console.log("getAppUser: appUserRoles=", appUserRoles);

		return appUserDetail;
	}

	async createAppUser(requestContext: RequestContext, data: AppUserUpsertPayload): Promise<AppUser> {
		const tenantID = requestContext.getCurrentTenantID();
		const appUser: AppUser = { 
			id: generateId(),
			email: data.email,
			tenantID: tenantID,
			organizationID: data.organizationID
		};
		console.log("createAppUser: appUser=", appUser);

		await appUserDAO.createAppUser(appUser);
		await this.updateAppUserRoles(tenantID, { ...appUser, roleIDs: data.roleIDs });

		return appUser;
	}

	async updateAppUser(requestContext: RequestContext, appUser: AppUser): Promise<AppUser | null> {
		const currentAppUser = await appUserDAO.getAppUser(requestContext.getCurrentTenantID(), appUser.id);
		console.log("updateAppUser: currentAppUser=", currentAppUser);
		if (!currentAppUser) {
			throw new ServerError("App user not found.");
		};
		appUser.tenantID = requestContext.getCurrentTenantID();
		return await appUserDAO.updateAppUser(appUser);
	}

	private async updateAppUserRoles(tenantID: string, appUserDetail: AppUserDetail): Promise<void> {	
		/**
		 * Update UserRole objects in database to reflect roles held by user according to appUserDetail
		 * Below is my implementation of a "nuclear method", deleting every existing UserRole and 
		 * creating new ones for each role id in appUserDetail. This may or may not be the best option.
		 */

		// Delete all existing UserRoles for user
		const userRolesCurrent: UserRole[] = await appRoleDAO.getUserRolesForAppUser(tenantID, appUserDetail.id);
		userRolesCurrent.forEach(async r => await appRoleDAO.deleteUserRole(r.appUserID, r.appRoleID));

		// Create new ones according to updated info
		appUserDetail.roleIDs.forEach(async appRoleID => {
			const userRole: UserRole = {
				tenantID: tenantID,
				appUserID: appUserDetail.id,
				appRoleID: appRoleID
			};
			await appRoleDAO.createUserRole(userRole);
		});
	}

	async deleteAppUser(requestContext: RequestContext, id: string): Promise<boolean> {
		const appUser = await appUserDAO.getAppUser(requestContext.getCurrentTenantID(), id);
		console.log("deleteAppUser: appUser=", appUser);
		if (!appUser) {
			throw new ServerError("App user not found.");
		}
		return await appUserDAO.deleteAppUser(id);
	}
}
