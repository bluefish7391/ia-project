import { tenantDAO } from "../daos/dao-factory";

export class TenantManager {
	async getAllTenants() {
		try {
			const tenants = await tenantDAO.getAllTenants();
			return tenants;
		} catch (error) {
			console.error("Error fetching tenants:", error);
			throw error;
		}
	}
}