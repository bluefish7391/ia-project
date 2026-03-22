import { Request, Response, NextFunction } from "express";
import { Logger } from "../logger";
import { securityDAO } from "../daos/dao-factory";
import { AppSession } from "../model";

/**
 * Verifies a Firebase ID token from the Authorization bearer header.
 * @param {Request} req - Express request.
 * @param {Response} res - Express response.
 * @param {NextFunction} next - Express next function.
 */
export async function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	const logger = new Logger("AuthMiddleware");
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith("Bearer ")) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}

	try {
		const sessionID = authHeader.slice("Bearer ".length);
		const appSession = await securityDAO.getAppSession(sessionID);
		if (!appSession) {
			res.status(401).json({ error: "Unauthorized" });
			return;
		}
		(req as Request & { appSession: AppSession }).appSession = appSession;
		next();
	} catch (error) {
		logger.warn("Failed to verify ID token", error);
		res.status(401).json({ error: "Unauthorized" });
	}
}
