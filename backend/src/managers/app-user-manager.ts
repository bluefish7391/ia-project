import { appRoleDAO, appUserDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { AppUser, AppUserDetail, UserRole } from "../../../shared/kinds";
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
		const appUserRoles: UserRole[] = await appRoleDAO.getAppRolesForAppUser(requestContext.getCurrentTenantID(), id);
		appUserDetail.roleIDs = appUserRoles.map((r) => r.appRoleID);
		console.log("getAppUser: appUserRoles=", appUserRoles);

		return appUserDetail;
	}

	async createAppUser(requestContext: RequestContext, data: Omit<AppUser, "id">): Promise<AppUser> {
		const appUser: AppUser = { ...data, id: generateId(), tenantID: requestContext.getCurrentTenantID() };
		console.log("createAppUser: appUser=", appUser);
		await appUserDAO.createAppUser(appUser);
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

	async deleteAppUser(requestContext: RequestContext, id: string): Promise<boolean> {
		const appUser = await appUserDAO.getAppUser(requestContext.getCurrentTenantID(), id);
		console.log("deleteAppUser: appUser=", appUser);
		if (!appUser) {
			throw new ServerError("App user not found.");
		}
		return await appUserDAO.deleteAppUser(id);
	}
}
