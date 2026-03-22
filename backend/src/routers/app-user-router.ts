import express, { Request, Response } from "express";
import { appUserManager } from "../managers/manager-factor";
import { AppUser } from "../../../shared/kinds";

export class AppUserRouter {
	async getAllAppUsers(req: Request, res: Response) {
		try {
			const appUsers = await appUserManager.getAllAppUsers();
			res.status(200).json(appUsers);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while fetching app users." });
		}
	}

	async getAppUser(req: Request, res: Response) {
		try {
			const appUser = await appUserManager.getAppUser(req.params["id"] as string);
			if (!appUser) {
				res.status(404).json({ error: "App user not found." });
				return;
			}
			res.status(200).json(appUser);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while fetching the app user." });
		}
	}

	async createAppUser(req: Request, res: Response) {
		try {
			const body = req.body as { email?: string };
			if (!body.email) {
				res.status(400).json({ error: "email is required." });
				return;
			}
			const data: Omit<AppUser, "id"> = { email: body.email };
			const appUser = await appUserManager.createAppUser(data);
			res.status(201).json(appUser);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while creating the app user." });
		}
	}

	async updateAppUser(req: Request, res: Response) {
		try {
			const body = req.body as AppUser;
			body.id = req.params["id"] as string;
			const appUser = await appUserManager.updateAppUser(body);
			if (!appUser) {
				res.status(404).json({ error: "App user not found." });
				return;
			}
			res.status(200).json(appUser);
		} catch (error) {
			res.status(500).json({ error: "An error occurred while updating the app user." });
		}
	}

	async deleteAppUser(req: Request, res: Response) {
		try {
			const deleted = await appUserManager.deleteAppUser(req.params["id"] as string);
			if (!deleted) {
				res.status(404).json({ error: "App user not found." });
				return;
			}
			res.status(204).send();
		} catch (error) {
			res.status(500).json({ error: "An error occurred while deleting the app user." });
		}
	}

	static buildRouter() {
		const appUserRouter = new AppUserRouter();
		return express.Router()
			.get("", appUserRouter.getAllAppUsers.bind(appUserRouter))
			.post("", appUserRouter.createAppUser.bind(appUserRouter))
			.get("/:id", appUserRouter.getAppUser.bind(appUserRouter))
			.put("/:id", appUserRouter.updateAppUser.bind(appUserRouter))
			.delete("/:id", appUserRouter.deleteAppUser.bind(appUserRouter));
	}
}
