
import express, { Request, Response } from "express";
import { securityManager } from "../managers/manager-factor";
import { BaseRouter } from "./base-router";

export class SecurityRouter extends BaseRouter {
	public static initializeRoutes() {
		const securityRouter = new SecurityRouter();
		return express.Router()
			.post("/tenants", securityRouter.wrapAsync(securityRouter.getUserTenants.bind(this)))
			.post("/app-session", securityRouter.wrapAsync(securityRouter.createAppSession.bind(this)));
	}

	private async getUserTenants(req: Request, res: Response) {
		const body = req.body as { googleToken?: string };
		const tenants = await securityManager.getUserTenants(body.googleToken);
		this.sendSuccess(res, tenants);
	}

	private async createAppSession(req: Request, res: Response) {
		const body = req.body as { tenantID?: string, googleToken?: string };
		const appSession = await securityManager.createAppSession(body.tenantID, body.googleToken);
		this.sendSuccess(res, appSession);
	}
}