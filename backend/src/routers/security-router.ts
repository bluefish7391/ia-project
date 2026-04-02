
import express, { Request, Response } from "express";
import { securityManager } from "../managers/manager-factor";
import { BaseRouter, RouterInitializable } from "./base-router";

// export class SecurityRouter {
// 	async getUserTenants(req: Request, res: Response) {
// 		try {
// 			const body = req.body as { googleToken?: string };
// 			const tenants = await securityManager.getUserTenants(body.googleToken);
// 			res.status(200).json(tenants);
// 		} catch (error) {
// 			res.status(500).json({ error: "An error occurred while fetching tenants." });
// 		}
// 	}

// 	async createAppSession(req: Request, res: Response) {
// 		const body = req.body as { tenantID: string, googleToken?: string };
// 		if (!body.tenantID) {
// 			res.status(400).json({ error: "tenantID is required." });
// 			return;
// 		}
// 		try {
// 			const appSession = await securityManager.createAppSession(body.tenantID, body.googleToken);
// 			res.status(200).json(appSession);
// 		} catch (error) {
// 			res.status(500).json({ error: "An error occurred while creating the app session." });
// 		}
// 	}

// 	static buildRouter() {
// 		const securityRouter = new SecurityRouter();
// 		return express.Router()
// 			.post("/tenants", securityRouter.getUserTenants.bind(securityRouter))
// 			.post("/app-session", securityRouter.createAppSession.bind(securityRouter));
// 	}
// }

export class SecurityRouter extends BaseRouter implements RouterInitializable {
	public initializeRoutes() {
		return express.Router()
			.post("/tenants", this.wrapAsync(this.getUserTenants.bind(this)))
			.post("/app-session", this.wrapAsync(this.createAppSession.bind(this)));
	}

	private async getUserTenants(req: Request, res: Response) {
		const body = req.body as { googleToken?: string };
		const tenants = await securityManager.getUserTenants(body.googleToken);
		this.sendSuccess(res, tenants);
	}

	private async createAppSession(req: Request, res: Response) {
		const body = req.body as { tenantID: string, googleToken?: string };
		const appSession = await securityManager.createAppSession(body.tenantID, body.googleToken);
		this.sendSuccess(res, appSession);
	}
}