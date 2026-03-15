import { Tenant } from "../../../shared/kinds";
import { datastore } from "./datastore-factory";

export class TenantDAO {
	static readonly TENANT_KIND = "Tenant";

	public async getAllTenants() {
        const query = datastore.createQuery(TenantDAO.TENANT_KIND);
        const data = await query.run();
        const tenants = data[0];
        return tenants;
    }

	public async getTenant(id: string): Promise<Tenant | null> {
		const key = datastore.key([TenantDAO.TENANT_KIND, id]);
		const [entity] = await datastore.get(key);
		if (!entity) return null;
		return { id, ...entity };
	}

	public async createTenant(tenant: Tenant): Promise<Tenant> {
		const key = datastore.key([TenantDAO.TENANT_KIND, tenant.id]);
		const entity = {
			key: key,
			data: tenant
		}
		await datastore.save(entity);
		return tenant;
	}

	public async updateTenant(tenant: Tenant): Promise<Tenant | null> {
		const key = datastore.key([TenantDAO.TENANT_KIND, tenant.id]);
		const [existing] = await datastore.get(key);
		if (!existing) return null;
		const updated = { ...existing, ...tenant };
		const entity = {
            key: key,
            data: updated
        };
		await datastore.save(entity);
		return tenant;
	}

	public async deleteTenant(id: string): Promise<boolean> {
		const key = datastore.key([TenantDAO.TENANT_KIND, id]);
		const [existing] = await datastore.get(key);
		if (!existing) return false;
		await datastore.delete(key);
		return true;
	}
}