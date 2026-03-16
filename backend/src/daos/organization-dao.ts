import { Organization } from "../../../shared/kinds";
import { datastore } from "./datastore-factory";

export class OrganizationDAO {
	static readonly ORGANIZATION_KIND = "Organization";

	public async getAllOrganizations() {
		const query = datastore.createQuery(OrganizationDAO.ORGANIZATION_KIND);
		const data = await query.run();
		const organizations = data[0];
		return organizations;
	}

	public async getOrganization(id: string): Promise<Organization | null> {
		const key = datastore.key([OrganizationDAO.ORGANIZATION_KIND, id]);
		const [entity] = await datastore.get(key);
		if (!entity) return null;
		return { id, ...entity };
	}

	public async createOrganization(organization: Organization): Promise<Organization> {
		const key = datastore.key([OrganizationDAO.ORGANIZATION_KIND, organization.id]);
		const entity = {
			key: key,
			data: organization
		};
		await datastore.save(entity);
		return organization;
	}

	public async updateOrganization(organization: Organization): Promise<Organization | null> {
		const key = datastore.key([OrganizationDAO.ORGANIZATION_KIND, organization.id]);
		const [existing] = await datastore.get(key);
		if (!existing) return null;
		const updated = { ...existing, ...organization };
		const entity = {
			key: key,
			data: updated
		};
		await datastore.save(entity);
		return organization;
	}

	public async deleteOrganization(id: string): Promise<boolean> {
		const key = datastore.key([OrganizationDAO.ORGANIZATION_KIND, id]);
		const [existing] = await datastore.get(key);
		if (!existing) return false;
		await datastore.delete(key);
		return true;
	}
}