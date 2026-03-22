import { appUserDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { AppUser } from "../../../shared/kinds";

export class AppUserManager {
	async getAllAppUsers(): Promise<AppUser[]> {
		try {
			return await appUserDAO.getAllAppUsers();
		} catch (error) {
			console.error("Error fetching app users:", error);
			throw error;
		}
	}

	async getAppUser(id: string): Promise<AppUser | null> {
		try {
			return await appUserDAO.getAppUser(id);
		} catch (error) {
			console.error("Error fetching app user:", error);
			throw error;
		}
	}

	async createAppUser(data: Omit<AppUser, "id">): Promise<AppUser> {
		try {
			const appUser: AppUser = { id: generateId(), ...data };
			return await appUserDAO.createAppUser(appUser);
		} catch (error) {
			console.error("Error creating app user:", error);
			throw error;
		}
	}

	async updateAppUser(appUser: AppUser): Promise<AppUser | null> {
		try {
			return await appUserDAO.updateAppUser(appUser);
		} catch (error) {
			console.error("Error updating app user:", error);
			throw error;
		}
	}

	async deleteAppUser(id: string): Promise<boolean> {
		try {
			return await appUserDAO.deleteAppUser(id);
		} catch (error) {
			console.error("Error deleting app user:", error);
			throw error;
		}
	}
}
