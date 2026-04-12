import express, { Request, Response } from "express";
import { tenantManager } from "../managers/manager-factory";
import { Tenant } from "../../../shared/kinds";
import { BaseRouter } from "./base-router";

export class TenantRouter extends BaseRouter {
	public static buildRouter() {
		const tenantRouter = new TenantRouter();
		return express.Router()
			.get("", tenantRouter.wrapAsync(tenantRouter.getAllTenants.bind(tenantRouter)))
			.post("", tenantRouter.wrapAsync(tenantRouter.createTenant.bind(tenantRouter)))
			.get("/:id", tenantRouter.wrapAsync(tenantRouter.getTenant.bind(tenantRouter)))
			.put("/:id", tenantRouter.wrapAsync(tenantRouter.updateTenant.bind(tenantRouter)))
			.delete("/:id", tenantRouter.wrapAsync(tenantRouter.deleteTenant.bind(tenantRouter)));
	}

	async getAllTenants(req: Request, res: Response) {
		const tenants = await tenantManager.getAllTenants();
		this.sendSuccess(res, tenants);
	}

	async getTenant(req: Request, res: Response) {
		const tenant = await tenantManager.getTenant(req.params["id"] as string);
		if (!tenant) {
			this.sendServerError(res, { error: "Tenant not found." });
			return;
		}
		this.sendSuccess(res, tenant);
	}

	async createTenant(req: Request, res: Response) {
		const body = req.body as { name?: string; description?: string };
		if (!body.name) {
			this.sendBadRequestError(res, { error: "name is required." });
			return;
		}
		const data: Omit<Tenant, "id"> = { name: body.name };
		if (body.description !== undefined) data.description = body.description;
		const tenant = await tenantManager.createTenant(data);
		this.sendSuccess(res, tenant);
	}

	async updateTenant(req: Request, res: Response) {
		const body = req.body as Tenant;
		body.id = req.params["id"] as string;
		const tenant = await tenantManager.updateTenant(body);
		console.log("updateTenant: id=" + req.params["id"] + ", data=" + JSON.stringify(body) + ", result=" + JSON.stringify(tenant));
		if (!tenant) {
			this.sendServerError(res, { error: "Tenant not found." });
			return;
		}
		this.sendSuccess(res, tenant);
	}

	async deleteTenant(req: Request, res: Response) {
		const deleted = await tenantManager.deleteTenant(req.params["id"] as string);
		if (!deleted) {
			this.sendServerError(res, { error: "Tenant not found." });
			return;
		}
		this.sendSuccess(res, { message: "Tenant successfully deleted." });
	}
}