import { organizationDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { Organization } from "../../../shared/kinds";
import { RequestContext } from "../request-context";

export class OrganizationManager {
	async getAllOrganizations(requestContext: RequestContext): Promise<Organization[]> {
		try {
			const organizations = await organizationDAO.getAllOrganizations(requestContext.getCurrentTenantID());
			return organizations;
		} catch (error) {
			console.error("Error fetching organizations:", error);
			throw error;
		}
	}

	async getOrganization(requestContext: RequestContext, id: string): Promise<Organization | null> {
		try {
			return await organizationDAO.getOrganization(requestContext.getCurrentTenantID(), id);
		} catch (error) {
			console.error("Error fetching organization:", error);
			throw error;
		}
	}

	async createOrganization(requestContext: RequestContext, data: Omit<Organization, "id" | "tenantID">): Promise<Organization> {
		try {
			const organization: Organization = { ...data, id: generateId(), tenantID: requestContext.getCurrentTenantID() };
			return await organizationDAO.createOrganization(organization);
		} catch (error) {
			console.error("Error creating organization:", error);
			throw error;
		}
	}

	async updateOrganization(requestContext: RequestContext, organization: Omit<Organization, "tenantID">): Promise<Organization | null> {
		try {
			const currentOrganization = await organizationDAO.getOrganization(requestContext.getCurrentTenantID(), organization.id);
			if (!currentOrganization) {
				throw new Error("Organization not found.");
			}
			return await organizationDAO.updateOrganization({ ...organization, tenantID: requestContext.getCurrentTenantID() });
		} catch (error) {
			console.error("Error updating organization:", error);
			throw error;
		}
	}

	async hasChildren(id: string): Promise<boolean> {
		try {
			const children = await organizationDAO.getChildOrganizations(id);
			return children.length > 0;
		} catch (error) {
			console.error("Error checking organization children:", error);
			throw error;
		}
	}

	async deleteOrganization(requestContext: RequestContext, id: string): Promise<boolean> {
		try {
			if (!await organizationDAO.getOrganization(id, requestContext.getCurrentTenantID())) {
				throw new Error("Organization not found.");
			}
			const hasChildren = await this.hasChildren(id);
			if (hasChildren) {
				const err = new Error("Cannot delete an organization that has sub-organizations.");
				(err as Error & { code: string }).code = "HAS_CHILDREN";
				throw err;
			}
			return await organizationDAO.deleteOrganization(id);
		} catch (error) {
			console.error("Error deleting organization:", error);
			throw error;
		}
	}
}