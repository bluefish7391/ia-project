import express, { Request, Response } from "express";
import { organizationManager } from "../managers/manager-factor";
import { Organization } from "../../../shared/kinds";
import { RequestContext } from "../request-context";

export class OrganizationRouter {
	async getAllOrganizations(req: Request, res: Response) {
		try {
			const organizations = await organizationManager.getAllOrganizations(new RequestContext(req));
			res.status(200).json(organizations);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while fetching organizations." });
		}
	}

	async getOrganization(req: Request, res: Response) {
		try {
			const organization = await organizationManager.getOrganization(new RequestContext(req), req.params["id"] as string);
			if (!organization) {
				res.status(404).json({ error: "Organization not found." });
				return;
			}
			res.status(200).json(organization);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while fetching the organization." });
		}
	}

	async createOrganization(req: Request, res: Response) {
		try {
			const body = req.body as { name?: string; description?: string; parentOrganizationID?: string };
			if (!body.name) {
				res.status(400).json({ error: "name is required." });
				return;
			}
			const data: Omit<Organization, "id" | "tenantID"> = { name: body.name };
			if (body.description !== undefined) data.description = body.description;
			if (body.parentOrganizationID !== undefined) data.parentOrganizationID = body.parentOrganizationID;
			const organization = await organizationManager.createOrganization(new RequestContext(req), data);
			res.status(201).json(organization);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while creating the organization." });
		}
	}

	async updateOrganization(req: Request, res: Response) {
		try {
			const body = req.body as { name?: string; description?: string };
			const id = req.params["id"] as string;
			// parentOrganizationID is immutable after creation — never accept it in updates
			const updates: Omit<Organization, "tenantID"> = { id, name: body.name ?? "", description: body.description };
			const organization = await organizationManager.updateOrganization(new RequestContext(req), updates);
			if (!organization) {
				res.status(404).json({ error: "Organization not found." });
				return;
			}
			res.status(200).json(organization);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while updating the organization." });
		}
	}

	async deleteOrganization(req: Request, res: Response) {
		try {
			const deleted = await organizationManager.deleteOrganization(new RequestContext(req), req.params["id"] as string);
			if (!deleted) {
				res.status(404).json({ error: "Organization not found." });
				return;
			}
			res.status(204).send();
		} catch (error) {
			if ((error as Error & { code?: string }).code === "HAS_CHILDREN") {
				res.status(409).json({ error: "Cannot delete an organization that has sub-organizations." });
				return;
			}
			res.status(500).json({ error: "An error occurred while deleting the organization." });
		}
	}

	static buildRouter() {
		const organizationRouter = new OrganizationRouter();
		return express.Router()
			.get("", organizationRouter.getAllOrganizations.bind(organizationRouter))
			.post("", organizationRouter.createOrganization.bind(organizationRouter))
			.get("/:id", organizationRouter.getOrganization.bind(organizationRouter))
			.put("/:id", organizationRouter.updateOrganization.bind(organizationRouter))
			.delete("/:id", organizationRouter.deleteOrganization.bind(organizationRouter));
	}
}