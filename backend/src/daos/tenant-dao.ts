import { datastore } from "./datastore-factory";

export class TenantDAO {
	static readonly TENANT_KIND = "Tenant";

	public async getAllTenants() {
        const query = datastore.createQuery(TenantDAO.TENANT_KIND);
        const data = await query.run();
        const tenants = data[0];
        return tenants;
    }
}