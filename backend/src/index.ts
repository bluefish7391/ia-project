import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import express from "express";
import { TenantRouter } from "./routers/tenant-router";
import { OrganizationRouter } from "./routers/organization-router";
import { AppUserRouter } from "./routers/app-user-router";
import { StudentRouter } from "./routers/student-router";
import { authMiddleware } from "./middleware/auth-middleware";
import { Logger } from "./logger";
import { SecurityRouter } from "./routers/security-router";

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

// Security routes (tenant list + session creation) must be mounted BEFORE
// authMiddleware because they are called before a session exists.
expressApp.use('/security', SecurityRouter.buildRouter());

expressApp.use(authMiddleware);
expressApp.use('/tenants', TenantRouter.buildRouter());
expressApp.use('/organizations', OrganizationRouter.buildRouter());
expressApp.use('/app-users', AppUserRouter.buildRouter());
expressApp.use('/students', StudentRouter.buildRouter());

export const api = onRequest(expressApp);
