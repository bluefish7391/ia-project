import { AppRole, UserRole } from "../../../shared/kinds";
import { datastore } from "./datastore-factory";

export class AppRoleDAO {
    static readonly APP_ROLE_KIND = "AppRole";
	static readonly USER_ROLE_KIND = "UserRole";

    public async getAllAppRoles(tenantID: string): Promise<AppRole[]> {
        const query = datastore.createQuery(AppRoleDAO.APP_ROLE_KIND).filter("tenantID", "=", tenantID);
        const data = await query.run();
        return data[0] as AppRole[];
    }

    public async getAppRole(tenantID: string, id: string): Promise<AppRole | null> {
        const key = datastore.key([AppRoleDAO.APP_ROLE_KIND, id]);
        const [entity] = await datastore.get(key);
        if (!entity || entity.tenantID !== tenantID) return null;
        return { id, ...entity } as AppRole;
    }

	public async getAppRolesForAppUser(tenantID: string, appUserID: string): Promise<UserRole[]> {
		const query = datastore.createQuery(AppRoleDAO.USER_ROLE_KIND)
			.filter("tenantID", "=", tenantID)
			.filter("appUserID", "=", appUserID);
		const data = await query.run();
		return data[0] as UserRole[];
	}

    public async createAppRole(appRole: AppRole): Promise<AppRole> {
        const key = datastore.key([AppRoleDAO.APP_ROLE_KIND, appRole.id]);
        const entity = { key, data: appRole };
        await datastore.save(entity);
        return appRole;
    }

    public async updateAppRole(appRole: AppRole): Promise<AppRole | null> {
        const key = datastore.key([AppRoleDAO.APP_ROLE_KIND, appRole.id]);
        const [existing] = await datastore.get(key);
        if (!existing) return null;
        const updated = { ...existing, ...appRole };
        const entity = { key, data: updated };
        await datastore.save(entity);
        return appRole;
    }

    public async deleteAppRole(id: string): Promise<boolean> {
        const key = datastore.key([AppRoleDAO.APP_ROLE_KIND, id]);
        const [existing] = await datastore.get(key);
        if (!existing) return false;
        await datastore.delete(key);
        return true;
    }
}
