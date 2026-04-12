import express, { Request, Response } from "express";
import { organizationManager } from "../managers/manager-factory";
import { Organization } from "../../../shared/kinds";
import { RequestContext } from "../request-context";
import { BaseRouter } from "./base-router";

export class OrganizationRouter extends BaseRouter {
	public static buildRouter() {
		const organizationRouter = new OrganizationRouter();
		return express.Router()
			.get("", organizationRouter.wrapAsync(organizationRouter.getAllOrganizations.bind(organizationRouter)))
			.post("", organizationRouter.wrapAsync(organizationRouter.createOrganization.bind(organizationRouter)))
			.get("/:id", organizationRouter.wrapAsync(organizationRouter.getOrganization.bind(organizationRouter)))
			.put("/:id", organizationRouter.wrapAsync(organizationRouter.updateOrganization.bind(organizationRouter)))
			.delete("/:id", organizationRouter.wrapAsync(organizationRouter.deleteOrganization.bind(organizationRouter)));
	}

	async getAllOrganizations(req: Request, res: Response) {
		const organizations = await organizationManager.getAllOrganizations(new RequestContext(req));
		this.sendSuccess(res, organizations);
	}

	async getOrganization(req: Request, res: Response) {
		const organization = await organizationManager.getOrganization(new RequestContext(req), req.params["id"] as string);
		if (!organization) {
			this.sendServerError(res, { error: "Organization not found." });
			return;
		}
		this.sendSuccess(res, organization);
	}

	async createOrganization(req: Request, res: Response) {
		const body = req.body as { name?: string; description?: string; parentOrganizationID?: string };
		if (!body.name) {
			this.sendBadRequestError(res, { error: "name is required." });
			return;
		}
		const data: Omit<Organization, "id" | "tenantID"> = { name: body.name };
		if (body.description !== undefined) data.description = body.description;
		if (body.parentOrganizationID !== undefined) data.parentOrganizationID = body.parentOrganizationID;
		const organization = await organizationManager.createOrganization(new RequestContext(req), data);
		this.sendSuccess(res, organization);
	}

	async updateOrganization(req: Request, res: Response) {
		const body = req.body as { name?: string; description?: string };
		const id = req.params["id"] as string;
		// parentOrganizationID is immutable after creation — never accept it in updates
		const updates: Omit<Organization, "tenantID"> = { id, name: body.name ?? "", description: body.description };
		const organization = await organizationManager.updateOrganization(new RequestContext(req), updates);
		if (!organization) {
			this.sendServerError(res, { error: "Organization not found." });
			return;
		}
		this.sendSuccess(res, organization);
	}

	async deleteOrganization(req: Request, res: Response) {
		const deleted = await organizationManager.deleteOrganization(new RequestContext(req), req.params["id"] as string);
		if (!deleted) {
			this.sendServerError(res, { error: "Organization not found." });
			return;
		}
		this.sendSuccess(res, { message: "Organization successfully deleted." });
	}
}