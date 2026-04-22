
import { Request, Response, NextFunction } from "express";
import admin from 'firebase-admin';
import { AppSession } from "../model";
import { appRoleDAO } from "../daos/dao-factory";
import { AppRole } from "../../../shared/kinds";

admin.initializeApp();
export function authenticator(requiredPermissionsList: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const appSession = (req as Request & { appSession?: AppSession }).appSession;
		if (!appSession) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}

		const userID = appSession.userID;
		try {
			const userRoles = await appRoleDAO.getUserRolesForAppUser(appSession.tenantID, userID);
			const appRoles: AppRole[] = await appRoleDAO.getAppRolesFromUserRoles(appSession.tenantID, userRoles.map(r => r.appRoleID));
			const userPermissions = new Set(appRoles.flatMap(r => r.appPermissions));
			const hasRequiredPermissions = requiredPermissionsList.some(p => userPermissions.has(p));

			if (!hasRequiredPermissions) {
				res.status(403).json({ error: "Forbidden" });
				return;
			}
		} catch (error) {
			res.status(500).json({ error: "Internal Server Error" });
			return;
		}
		
		next();
    }
}