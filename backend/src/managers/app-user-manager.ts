import { appUserDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { AppUser } from "../../../shared/kinds";
import { RequestContext } from "../request-context";

export class AppUserManager {
	async getAllAppUsers(requestContext: RequestContext): Promise<AppUser[]> {
		try {
			return await appUserDAO.getAllAppUsers(requestContext.getCurrentTenantID());
		} catch (error) {
			console.error("Error fetching app users:", error);
			throw error;
		}
	}

	async getAppUser(requestContext: RequestContext, id: string): Promise<AppUser | null> {
		try {
			return await appUserDAO.getAppUser(requestContext.getCurrentTenantID(), id);
		} catch (error) {
			console.error("Error fetching app user:", error);
			throw error;
		}
	}

	async createAppUser(requestContext: RequestContext, data: Omit<AppUser, "id">): Promise<AppUser> {
		try {
			const appUser: AppUser = { ...data, id: generateId(), tenantID: requestContext.getCurrentTenantID() };
			return await appUserDAO.createAppUser(appUser);
		} catch (error) {
			console.error("Error creating app user:", error);
			throw error;
		}
	}

	async updateAppUser(requestContext: RequestContext, appUser: AppUser): Promise<AppUser | null> {
		try {
			const currentAppUser = await appUserDAO.getAppUser(requestContext.getCurrentTenantID(), appUser.id);
			if (!currentAppUser) {
				throw new Error("App user not found.");
			};
			appUser.tenantID = requestContext.getCurrentTenantID();
			return await appUserDAO.updateAppUser(appUser);
		} catch (error) {
			console.error("Error updating app user:", error);
			throw error;
		}
	}

	async deleteAppUser(requestContext: RequestContext, id: string): Promise<boolean> {
		try {
			const appUser = await appUserDAO.getAppUser(requestContext.getCurrentTenantID(), id);
			if (!appUser) {
				throw new Error("App user not found.");
			}
			return await appUserDAO.deleteAppUser(id);
		} catch (error) {
			console.error("Error deleting app user:", error);
			throw error;
		}
	}
}
