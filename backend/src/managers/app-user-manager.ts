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

	async getAppUser(requestContext: RequestContext, id: string): Promise<AppUserDetail | null> {
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

	async updateAppUser(requestContext: RequestContext, id: string, payload: AppUserUpsertPayload): Promise<AppUserDetail> {
		const currentAppUser = await appUserDAO.getAppUser(requestContext.getCurrentTenantID(), id);
		console.log("updateAppUser: currentAppUser=", currentAppUser);

		if (!currentAppUser) {
			throw new ServerError("App user not found.");
		}

		const appUserDetail: AppUserDetail = { ...currentAppUser, roleIDs: payload.roleIDs };

		await appUserDAO.updateAppUser({ ...currentAppUser, email: payload.email, organizationID: payload.organizationID });
		await this.updateAppUserRoles(requestContext.getCurrentTenantID(), appUserDetail);

		return appUserDetail;
	}

	private async updateAppUserRoles(tenantID: string, appUserDetail: AppUserDetail): Promise<void> {
		const currentRoles = await appRoleDAO.getUserRolesForAppUser(tenantID, appUserDetail.id);
		const currentRoleIDs = new Set(currentRoles.map(r => r.appRoleID));
		const newRoleIDs = new Set(appUserDetail.roleIDs);

		const toDelete = currentRoles.filter(r => !newRoleIDs.has(r.appRoleID));
		const toAdd = appUserDetail.roleIDs.filter(id => !currentRoleIDs.has(id));

		await Promise.all([
			...toDelete.map(r => appRoleDAO.deleteUserRole(r.appUserID, r.appRoleID)),
			...toAdd.map(appRoleID => appRoleDAO.createUserRole({ tenantID, appUserID: appUserDetail.id, appRoleID }))
		]);
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
