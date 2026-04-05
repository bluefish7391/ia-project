import { tenantDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { Tenant } from "../../../shared/kinds";
import { BadRequestError, ServerError } from "../kinds";

export class TenantManager {
	async getAllTenants(): Promise<Tenant[]> {
		const tenants = await tenantDAO.getAllTenants();
		console.log("getAllTenants: tenants=", tenants);
		return tenants;
	}

	async getTenant(id: string): Promise<Tenant | null> {
		const tenant = await tenantDAO.getTenant(id);
		console.log("getTenant: tenant=", tenant);
		if (!tenant) {
			throw new BadRequestError("No tenant with that id");
		}
		return tenant;
	}

	async createTenant(data: Omit<Tenant, "id">): Promise<Tenant> {
		const tenant: Tenant = { id: generateId(), ...data };
		console.log("createTenant: tenant=", tenant);
		return await tenantDAO.createTenant(tenant);
	}

	async updateTenant(tenant: Tenant): Promise<Tenant | null> {
		const currentTenant = await tenantDAO.getTenant(tenant.id);
		console.log("updateTenant: currentTenant=", currentTenant);
		if (!currentTenant) {
			throw new ServerError("Tenant not found.");
		}
		return await tenantDAO.updateTenant(tenant);
	}

	async deleteTenant(id: string): Promise<boolean> {
		const tenant = await tenantDAO.getTenant(id);
		console.log("deleteTenant: tenant=", tenant);
		if (!tenant) {
			throw new BadRequestError("Tenant not found.");
		}
		return await tenantDAO.deleteTenant(id);
	}
}