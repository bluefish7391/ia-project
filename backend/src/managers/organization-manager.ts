import { organizationDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { Organization } from "../../../shared/kinds";
import { RequestContext } from "../request-context";
import { BadRequestError, ServerError } from "../kinds";

export class OrganizationManager {
	async getAllOrganizations(requestContext: RequestContext): Promise<Organization[]> {
		const organizations = await organizationDAO.getAllOrganizations(requestContext.getCurrentTenantID());
		console.log("getAllOrganizations: organizations=", organizations);
		return organizations;
	}

	async getOrganization(requestContext: RequestContext, id: string): Promise<Organization | null> {
		const organization = await organizationDAO.getOrganization(requestContext.getCurrentTenantID(), id);
		console.log("getOrganization: organization=", organization);
		if (!organization) {
			throw new BadRequestError("No organization with that id");
		}
		return organization;
	}

	async createOrganization(requestContext: RequestContext, data: Omit<Organization, "id" | "tenantID">): Promise<Organization> {
		const organization: Organization = { ...data, id: generateId(), tenantID: requestContext.getCurrentTenantID() };
		console.log("createOrganization: organization=", organization);
		return await organizationDAO.createOrganization(organization);
	}

	async updateOrganization(requestContext: RequestContext, organization: Omit<Organization, "tenantID">): Promise<Organization | null> {
		const currentOrganization = await organizationDAO.getOrganization(requestContext.getCurrentTenantID(), organization.id);
		console.log("updateOrganization: currentOrganization=", currentOrganization);
		if (!currentOrganization) {
			throw new ServerError("Organization not found.");
		}
		return await organizationDAO.updateOrganization({ ...organization, tenantID: requestContext.getCurrentTenantID() });
	}

	async hasChildren(id: string): Promise<boolean> {
		const children = await organizationDAO.getChildOrganizations(id);
		console.log("hasChildren: children=", children);
		return children.length > 0;
	}

	async deleteOrganization(requestContext: RequestContext, id: string): Promise<boolean> {
		const organization = await organizationDAO.getOrganization(requestContext.getCurrentTenantID(), id);
		console.log("deleteOrganization: organization=", organization);
		if (!organization) {
			throw new BadRequestError("Organization not found.");
		}
		const hasChildren = await this.hasChildren(id);
		console.log("deleteOrganization: hasChildren=", hasChildren);
		if (hasChildren) {
			throw new BadRequestError("Cannot delete an organization that has sub-organizations.");
		}
		return await organizationDAO.deleteOrganization(id);
	}
}