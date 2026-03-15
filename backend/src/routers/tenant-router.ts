import express, { Request, Response } from "express";
import { tenantManager } from "../managers/manager-factor";
import { Tenant } from "../../../shared/kinds";

export class TenantRouter {
	async getAllTenants(req: Request, res: Response) {
		try {
			const tenants = await tenantManager.getAllTenants();
			res.status(200).json(tenants);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while fetching tenants." });
		}
	}

	async getTenant(req: Request, res: Response) {
		try {
			const tenant = await tenantManager.getTenant(req.params["id"] as string);
			if (!tenant) {
				res.status(404).json({ error: "Tenant not found." });
				return;
			}
			res.status(200).json(tenant);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while fetching the tenant." });
		}
	}

	async createTenant(req: Request, res: Response) {
		try {
			const body = req.body as { name?: string; description?: string };
			if (!body.name) {
				res.status(400).json({ error: "name is required." });
				return;
			}
			const data: Omit<Tenant, "id"> = { name: body.name };
			if (body.description !== undefined) data.description = body.description;
			const tenant = await tenantManager.createTenant(data);
			res.status(201).json(tenant);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while creating the tenant." });
		}
	}

	async updateTenant(req: Request, res: Response) {
		try {
			const body = req.body as Tenant;
			body.id = req.params["id"] as string;
			const tenant = await tenantManager.updateTenant(body);
			console.log("updateTenant: id=" + req.params["id"] + ", data=" + JSON.stringify(body) + ", result=" + JSON.stringify(tenant));
			if (!tenant) {
				res.status(404).json({ error: "Tenant not found." });
				return;
			}
			res.status(200).json(tenant);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while updating the tenant." });
		}
	}

	async deleteTenant(req: Request, res: Response) {
		try {
			const deleted = await tenantManager.deleteTenant(req.params["id"] as string);
			if (!deleted) {
				res.status(404).json({ error: "Tenant not found." });
				return;
			}
			res.status(204).send();
		} catch (error) {
			res.status(500).json({ error: "An error occurred while deleting the tenant." });
		}
	}

    static buildRouter() {
        const tenantRouter = new TenantRouter();
        return express.Router()
			.get("", tenantRouter.getAllTenants.bind(tenantRouter))
			.post("", tenantRouter.createTenant.bind(tenantRouter))
			.get("/:id", tenantRouter.getTenant.bind(tenantRouter))
			.put("/:id", tenantRouter.updateTenant.bind(tenantRouter))
			.delete("/:id", tenantRouter.deleteTenant.bind(tenantRouter));
    }
}