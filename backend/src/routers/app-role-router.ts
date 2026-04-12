import express, { Request, Response } from "express";
import { AppPermission } from "../../../shared/kinds";
import { appRoleManager } from "../managers/manager-factory";
import { RequestContext } from "../request-context";
import { BaseRouter } from "./base-router";

export class AppRoleRouter extends BaseRouter {
    public static buildRouter() {
        const appRoleRouter = new AppRoleRouter();
        return express.Router()
            .get("", appRoleRouter.wrapAsync(appRoleRouter.getAllAppRoles.bind(appRoleRouter)))
            .post("", appRoleRouter.wrapAsync(appRoleRouter.createAppRole.bind(appRoleRouter)))
            .get("/:id", appRoleRouter.wrapAsync(appRoleRouter.getAppRole.bind(appRoleRouter)))
            .put("/:id", appRoleRouter.wrapAsync(appRoleRouter.updateAppRole.bind(appRoleRouter)))
            .delete("/:id", appRoleRouter.wrapAsync(appRoleRouter.deleteAppRole.bind(appRoleRouter)));
    }

    async getAllAppRoles(req: Request, res: Response) {
        const appRoles = await appRoleManager.getAllAppRoles(new RequestContext(req));
        this.sendSuccess(res, appRoles);
    }

    async getAppRole(req: Request, res: Response) {
        const appRole = await appRoleManager.getAppRole(new RequestContext(req), req.params["id"] as string);
        this.sendSuccess(res, appRole);
    }

    async createAppRole(req: Request, res: Response) {
        const body = req.body as { name?: string; description?: string; appPermissions?: AppPermission[] };
        if (!body.name) {
            this.sendBadRequestError(res, { error: "name is required." });
            return;
        }
        if (body.description === undefined || body.description === null) {
            this.sendBadRequestError(res, { error: "description is required." });
            return;
        }
        if (!Array.isArray(body.appPermissions)) {
            this.sendBadRequestError(res, { error: "appPermissions must be an array." });
            return;
        }
        const appRole = await appRoleManager.createAppRole(new RequestContext(req), {
            name: body.name,
            description: body.description,
            appPermissions: body.appPermissions,
        });
        this.sendSuccess(res, appRole);
    }

    async updateAppRole(req: Request, res: Response) {
        const body = req.body as { name?: string; description?: string; appPermissions?: AppPermission[] };
        const id = req.params["id"] as string;
        if (!body.name) {
            this.sendBadRequestError(res, { error: "name is required." });
            return;
        }
        if (body.description === undefined || body.description === null) {
            this.sendBadRequestError(res, { error: "description is required." });
            return;
        }
        if (!Array.isArray(body.appPermissions)) {
            this.sendBadRequestError(res, { error: "appPermissions must be an array." });
            return;
        }
        const appRole = await appRoleManager.updateAppRole(new RequestContext(req), id, {
            name: body.name,
            description: body.description,
            appPermissions: body.appPermissions,
        });
        this.sendSuccess(res, appRole);
    }

    async deleteAppRole(req: Request, res: Response) {
        const deleted = await appRoleManager.deleteAppRole(new RequestContext(req), req.params["id"] as string);
        if (!deleted) {
            this.sendServerError(res, { error: "App role not found." });
            return;
        }
        this.sendSuccess(res, { message: "App role successfully deleted." });
    }
}
