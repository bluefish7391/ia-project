
import express, { Request, Response } from "express";
import { securityManager } from "../managers/manager-factor";
import { BaseRouter, RouterInitializable } from "./base-router";

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
		const body = req.body as { tenantID?: string, googleToken?: string };
		const appSession = await securityManager.createAppSession(body.tenantID, body.googleToken);
		this.sendSuccess(res, appSession);
	}
}