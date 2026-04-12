
import express, { Request, Response } from "express";
import { securityManager } from "../managers/manager-factory";
import { BaseRouter } from "./base-router";

export class SecurityRouter extends BaseRouter {
	public static buildRouter() {
		const securityRouter = new SecurityRouter();
		return express.Router()
			.post("/tenants", securityRouter.wrapAsync(securityRouter.getUserTenants.bind(securityRouter)))
			.post("/app-session", securityRouter.wrapAsync(securityRouter.createAppSession.bind(securityRouter)));
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