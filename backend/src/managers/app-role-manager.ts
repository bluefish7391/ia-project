import { AppPermission, AppRole } from "../../../shared/kinds";
import { appRoleDAO } from "../daos/dao-factory";
import { generateId } from "../idutilities";
import { BadRequestError, ServerError } from "../kinds";
import { RequestContext } from "../request-context";

export class AppRoleManager {
    async getAllAppRoles(requestContext: RequestContext): Promise<AppRole[]> {
        const appRoles = await appRoleDAO.getAllAppRoles(requestContext.getCurrentTenantID());
        console.log("getAllAppRoles: appRoles=", appRoles);
        return appRoles;
    }

    async getAppRole(requestContext: RequestContext, id: string): Promise<AppRole> {
        const appRole = await appRoleDAO.getAppRole(requestContext.getCurrentTenantID(), id);
        console.log("getAppRole: appRole=", appRole);
        if (!appRole) {
            throw new BadRequestError("No app role with that id.");
        }
        return appRole;
    }

    async createAppRole(
        requestContext: RequestContext,
        data: { name: string; description: string; appPermissions: AppPermission[] },
    ): Promise<AppRole> {
        const appRole: AppRole = {
            id: generateId(),
            tenantID: requestContext.getCurrentTenantID(),
            ...data,
        };
        console.log("createAppRole: appRole=", appRole);
        return await appRoleDAO.createAppRole(appRole);
    }

    async updateAppRole(
        requestContext: RequestContext,
        id: string,
        data: { name: string; description: string; appPermissions: AppPermission[] },
    ): Promise<AppRole> {
        const existing = await appRoleDAO.getAppRole(requestContext.getCurrentTenantID(), id);
        console.log("updateAppRole: existing=", existing);
        if (!existing) {
            throw new BadRequestError("App role not found.");
        }
        const updated: AppRole = { ...existing, ...data };
        const result = await appRoleDAO.updateAppRole(updated);
        if (!result) {
            throw new ServerError("Failed to update app role.");
        }
        return result;
    }

    async deleteAppRole(requestContext: RequestContext, id: string): Promise<boolean> {
        const appRole = await appRoleDAO.getAppRole(requestContext.getCurrentTenantID(), id);
        console.log("deleteAppRole: appRole=", appRole);
        if (!appRole) {
            throw new BadRequestError("App role not found.");
        }
        return await appRoleDAO.deleteAppRole(id);
    }
}
