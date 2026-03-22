
import { AppUser, Tenant } from "../../../shared/kinds";
import { AppSession } from "../model";
import { datastore } from "./datastore-factory";

export class SecurityDAO {
	static readonly APPSESSION_KIND = "AppSession";

	public async createAppSession(appSession: AppSession) {
		const key = datastore.key([SecurityDAO.APPSESSION_KIND, appSession.sessionID]);
		const entity = {
			key: key,
			data: appSession
		};
		await datastore.save(entity);
		return appSession;
	}

	public async getAppSession(sessionID: string): Promise<AppSession | null> {
		const key = datastore.key([SecurityDAO.APPSESSION_KIND, sessionID]);
		const [entity] = await datastore.get(key);
		if (!entity) return null;
		return { sessionID, ...entity };
	}

	public async deleteAppSession(sessionID: string) {
		const key = datastore.key([SecurityDAO.APPSESSION_KIND, sessionID]);
		await datastore.delete(key);
	}

	public async getAppUsersByEmail(email: string): Promise<AppUser[] | null> {
		const query = datastore.createQuery("AppUser").filter("email", "=", email);
		const [entities] = await datastore.runQuery(query);
		if (entities.length === 0) return null;
		return entities as AppUser[];
	}

	public async getTenantsByIDs(tenantIDs: Set<string>): Promise<Tenant[]> {
		if (tenantIDs.size === 0) return [];
		const ids = [...tenantIDs];
		const keys = ids.map(id => datastore.key(["Tenant", id]));
		const [rawEntities] = await datastore.get(keys);
		const entities = rawEntities as (Omit<Tenant, "id"> | undefined)[];
		const tenants: Tenant[] = [];
		for (let i = 0; i < entities.length; i++) {
			const entity = entities[i];
			if (entity) tenants.push({ id: ids[i], ...entity });
		}
		return tenants;
	}

	public async getAppUserByEmailAndTenantID(email: string, tenantID: string): Promise<AppUser | null> {
		const query = datastore.createQuery("AppUser")
			.filter("email", "=", email)
			.filter("tenantID", "=", tenantID)
			.limit(1);
		const [entities] = await datastore.runQuery(query);
		if (entities.length === 0) return null;
		return entities[0] as AppUser;
	}
}