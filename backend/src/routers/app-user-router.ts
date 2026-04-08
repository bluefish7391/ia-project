import express, { Request, Response } from "express";
import { appUserManager } from "../managers/manager-factor";
import { AppUser } from "../../../shared/kinds";
import { RequestContext } from "../request-context";
import { BaseRouter } from "./base-router";

export class AppUserRouter extends BaseRouter {
	public static buildRouter() {
		const appUserRouter = new AppUserRouter();
		return express.Router()
			.get("", appUserRouter.wrapAsync(appUserRouter.getAllAppUsers.bind(appUserRouter)))
			.post("", appUserRouter.wrapAsync(appUserRouter.createAppUser.bind(appUserRouter)))
			.get("/:id", appUserRouter.wrapAsync(appUserRouter.getAppUser.bind(appUserRouter)))
			.put("/:id", appUserRouter.wrapAsync(appUserRouter.updateAppUser.bind(appUserRouter)))
			.delete("/:id", appUserRouter.wrapAsync(appUserRouter.deleteAppUser.bind(appUserRouter)));
	}

	async getAllAppUsers(req: Request, res: Response) {
		const requestContext = new RequestContext(req);
		const appUsers = await appUserManager.getAllAppUsers(requestContext);
		this.sendSuccess(res, appUsers);
	}

	async getAppUser(req: Request, res: Response) {
		const appUserDetail = await appUserManager.getAppUser(new RequestContext(req), req.params["id"] as string);
		this.sendSuccess(res, appUserDetail);
	}

	async createAppUser(req: Request, res: Response) {
		const body = req.body as { email?: string, organizationID: string };
		if (!body.email) {
			this.sendBadRequestError(res, { message: "No email provided" });
			return;
		}
		const requestContext = new RequestContext(req);
		const data: Omit<AppUser, "id"> = { email: body.email, tenantID: requestContext.getCurrentTenantID(), organizationID: body.organizationID };
		const appUser = await appUserManager.createAppUser(requestContext, data);
		this.sendSuccess(res, appUser);
	}

	async updateAppUser(req: Request, res: Response) {
		const body = req.body as AppUser;
		body.id = req.params["id"] as string;
		const appUser = await appUserManager.updateAppUser(new RequestContext(req), body);
		if (!appUser) {
			this.sendServerError(res, { message: "No app user found" });
			return;
		}
		this.sendSuccess(res, appUser);
	}

	async deleteAppUser(req: Request, res: Response) {
		const deleted = await appUserManager.deleteAppUser(new RequestContext(req), req.params["id"] as string);
		if (!deleted) {
			this.sendServerError(res, { message: "No app user found" });
			return;
		}
		this.sendSuccess(res, { message: "User successfully deleted" });
	}
}
