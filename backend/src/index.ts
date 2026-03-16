import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import { TenantRouter } from "./routers/tenant-router";

const expressApp = express();
expressApp.use(express.json());
expressApp.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Expires', '0');
    next();
});

expressApp.use('/tenants', TenantRouter.buildRouter());

export const api = onRequest(expressApp);
