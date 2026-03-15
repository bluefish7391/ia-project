import { tenantDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { Tenant } from "../../../shared/kinds";

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

	async getTenant(id: string): Promise<Tenant | null> {
		try {
			return await tenantDAO.getTenant(id);
		} catch (error) {
			console.error("Error fetching tenant:", error);
			throw error;
		}
	}

	async createTenant(data: Omit<Tenant, "id">): Promise<Tenant> {
		try {
			const tenant: Tenant = { id: generateId(), ...data };
			return await tenantDAO.createTenant(tenant);
		} catch (error) {
			console.error("Error creating tenant:", error);
			throw error;
		}
	}

	async updateTenant(tenant: Tenant): Promise<Tenant | null> {
		try {
			return await tenantDAO.updateTenant(tenant);
		} catch (error) {
			console.error("Error updating tenant:", error);
			throw error;
		}
	}

	async deleteTenant(id: string): Promise<boolean> {
		try {
			return await tenantDAO.deleteTenant(id);
		} catch (error) {
			console.error("Error deleting tenant:", error);
			throw error;
		}
	}
}