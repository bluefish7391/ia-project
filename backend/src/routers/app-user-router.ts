import express, { Request, Response } from "express";
import { appUserManager } from "../managers/manager-factory";
import { AppUserDetail, AppUserUpsertPayload } from "../../../shared/kinds";
import { RequestContext } from "../request-context";
import { BaseRouter } from "./base-router";
import { BadRequestError } from "../kinds";

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
		const body = req.body as Partial<AppUserUpsertPayload>;

		if (!body.email || !body.organizationID || !Array.isArray(body.roleIDs)) {
			console.log("updateAppUser: invalid body=", body);
			throw new BadRequestError("Request body must include email, organizationID, and roleIDs");
		}

		const payload: AppUserUpsertPayload = {
			email: body.email,
			organizationID: body.organizationID,
			roleIDs: body.roleIDs,
		};

		const appUser = await appUserManager.createAppUser(new RequestContext(req), payload);
		this.sendSuccess(res, appUser);
	}

	async updateAppUser(req: Request, res: Response) {
		const id = req.params["id"] as string;
		const body = req.body as Partial<AppUserUpsertPayload>;

		if (!body.email || !body.organizationID || !Array.isArray(body.roleIDs)) {
			console.log("updateAppUser: invalid body=", body);
			throw new BadRequestError("Request body must include email, organizationID, and roleIDs");
		}

		const payload: AppUserUpsertPayload = {
			email: body.email,
			organizationID: body.organizationID,
			roleIDs: body.roleIDs,
		};
		
		const appUserDetail: AppUserDetail = await appUserManager.updateAppUser(new RequestContext(req), id, payload);
		this.sendSuccess(res, appUserDetail);
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
