import { organizationDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { Organization } from "../../../shared/kinds";

export class OrganizationManager {
	async getAllOrganizations() {
		try {
			const organizations = await organizationDAO.getAllOrganizations();
			return organizations;
		} catch (error) {
			console.error("Error fetching organizations:", error);
			throw error;
		}
	}

	async getOrganization(id: string): Promise<Organization | null> {
		try {
			return await organizationDAO.getOrganization(id);
		} catch (error) {
			console.error("Error fetching organization:", error);
			throw error;
		}
	}

	async createOrganization(data: Omit<Organization, "id">): Promise<Organization> {
		try {
			const organization: Organization = { id: generateId(), ...data };
			return await organizationDAO.createOrganization(organization);
		} catch (error) {
			console.error("Error creating organization:", error);
			throw error;
		}
	}

	async updateOrganization(organization: Organization): Promise<Organization | null> {
		try {
			return await organizationDAO.updateOrganization(organization);
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

	async deleteOrganization(id: string): Promise<boolean> {
		try {
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