import express, { Request, Response } from "express";
import { tenantManager } from "../managers/manager-factor";

export class TenantRouter {
	async getAllTenants(req: Request, res: Response) {
		try {
			const tenants = await tenantManager.getAllTenants();
			res.status(200).json(tenants);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while fetching tenants." });
		}
	}

    static buildRouter() {
        const tenantRouter = new TenantRouter();
        return express.Router()
			.get("", tenantRouter.getAllTenants.bind(tenantRouter));
    }
}