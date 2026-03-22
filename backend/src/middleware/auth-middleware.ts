import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { Logger } from "../logger";

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
	logger.info("Received request with Authorization header:", authHeader);
	if (!authHeader?.startsWith("Bearer ")) {
		logger.warn("Authorization header is missing or invalid");
		res.status(401).json({ error: "Unauthorized" });
		return;
	}

	const token = authHeader.slice("Bearer ".length);

	try {
		const decoded = await getAuth().verifyIdToken(token);
		(req as Request & { user: typeof decoded }).user = decoded;
		next();
	} catch (error) {
		logger.warn("Failed to verify ID token", error);
		res.status(401).json({ error: "Unauthorized" });
	}
}
