import { AppUser } from "../../../shared/kinds";
import { datastore } from "./datastore-factory";

export class AppUserDAO {
	static readonly APP_USER_KIND = "AppUser";

	public async getAllAppUsers(): Promise<AppUser[]> {
		const query = datastore.createQuery(AppUserDAO.APP_USER_KIND);
		const data = await query.run();
		return data[0];
	}

	public async getAppUser(id: string): Promise<AppUser | null> {
		const key = datastore.key([AppUserDAO.APP_USER_KIND, id]);
		const [entity] = await datastore.get(key);
		if (!entity) return null;
		return { id, ...entity };
	}

	public async createAppUser(appUser: AppUser): Promise<AppUser> {
		const key = datastore.key([AppUserDAO.APP_USER_KIND, appUser.id]);
		const entity = {
			key: key,
			data: appUser,
		};
		await datastore.save(entity);
		return appUser;
	}

	public async updateAppUser(appUser: AppUser): Promise<AppUser | null> {
		const key = datastore.key([AppUserDAO.APP_USER_KIND, appUser.id]);
		const [existing] = await datastore.get(key);
		if (!existing) return null;
		const updated = { ...existing, ...appUser };
		const entity = {
			key: key,
			data: updated,
		};
		await datastore.save(entity);
		return appUser;
	}

	public async deleteAppUser(id: string): Promise<boolean> {
		const key = datastore.key([AppUserDAO.APP_USER_KIND, id]);
		const [existing] = await datastore.get(key);
		if (!existing) return false;
		await datastore.delete(key);
		return true;
	}
}
