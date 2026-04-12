import { sysAdminManager } from "../managers/manager-factory";
import { authenticator } from "../middleware/authenticator";
import { RequestContext } from "../request-context";
import { BaseRouter } from "./base-router";
import express, { Request, Response } from "express";

export class SysAdminRouter extends BaseRouter {
	public static buildRouter() {
		const sysAdminRouter = new SysAdminRouter();
		return express.Router()
			.delete("/users/:email", authenticator(["SYS_ADMIN_DELETE_USER"]), sysAdminRouter.wrapAsync(sysAdminRouter.deleteUser.bind(sysAdminRouter)));
	}

	async deleteUser(req: Request, res: Response) {
		const email = req.params["email"] as string;
		if (!email) {
			this.sendBadRequestError(res, { error: "Email is required." });
			return;
		}
		const deleteResultMessage = await sysAdminManager.deleteUser(new RequestContext(req), email);

		if (!deleteResultMessage) {
			this.sendSuccess(res, { success: true, message: `User with email "${email}" was deleted successfully.` });
			return;
		}

		this.sendSuccess(res, { success: false, message: deleteResultMessage});
	}
}