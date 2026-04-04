
import express, { Request, Response } from "express";
import { securityManager } from "../managers/manager-factor";
import { BaseRouter } from "./base-router";

export class SecurityRouter extends BaseRouter {
	public static initializeRoutes() {
		const sr = new SecurityRouter();
		return express.Router()
			.post("/tenants", sr.wrapAsync(sr.getUserTenants.bind(this)))
			.post("/app-session", sr.wrapAsync(sr.createAppSession.bind(this)));
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