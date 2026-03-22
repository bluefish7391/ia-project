import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import express from "express";
import { TenantRouter } from "./routers/tenant-router";
import { OrganizationRouter } from "./routers/organization-router";
import { AppUserRouter } from "./routers/app-user-router";
import { authMiddleware } from "./middleware/auth-middleware";
import { Logger } from "./logger";

initializeApp();

const logger = new Logger("Index");
logger.info("Starting backend server...");

const expressApp = express();
expressApp.use(express.json());
expressApp.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Expires', '0');
    next();
});

expressApp.use(authMiddleware);
expressApp.use('/tenants', TenantRouter.buildRouter());
expressApp.use('/organizations', OrganizationRouter.buildRouter());
expressApp.use('/app-users', AppUserRouter.buildRouter());

export const api = onRequest(expressApp);
