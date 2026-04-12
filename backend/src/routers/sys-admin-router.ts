import { sysAdminManager } from "../managers/manager-factory";
import { RequestContext } from "../request-context";
import { BaseRouter } from "./base-router";
import express, { Request, Response } from "express";

export class SysAdminRouter extends BaseRouter {
	public static buildRouter() {
		const sysAdminRouter = new SysAdminRouter();
		return express.Router()
			.delete("/users/:email", sysAdminRouter.wrapAsync(sysAdminRouter.deleteUser.bind(sysAdminRouter)));
	}

	async deleteUser(req: Request, res: Response) {
		const email = req.params["email"] as string;
		if (!email) {
			this.sendBadRequestError(res, { error: "Email is required." });
			return;
		}
		const success = await sysAdminManager.deleteUser(new RequestContext(req), email);
		if (!success) {
			this.sendServerError(res, { error: "Failed to delete user. User may not exist." });
			return;
		}
		this.sendSuccess(res, { message: `User with email "${email}" was deleted successfully.` });
	}
}