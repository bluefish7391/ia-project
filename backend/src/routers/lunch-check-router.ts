import { QueryStudentLunchCheckRequest } from "../../../shared/kinds";
import { lunchCheckManager } from "../managers/manager-factory";
import { RequestContext } from "../request-context";
import { BaseRouter } from "./base-router";
import express, { Request, Response } from "express";

export class LunchCheckRouter extends BaseRouter {
	public static buildRouter() {
		const lunchCheckRouter = new LunchCheckRouter();
		return express.Router()
			.post("/student-lunch-check-records", lunchCheckRouter.wrapAsync(lunchCheckRouter.getAllStudentLunchCheckRecords.bind(lunchCheckRouter)));
	}

	async getAllStudentLunchCheckRecords(req: Request, res: Response) {
		const filterOptions = req.body as QueryStudentLunchCheckRequest;
		if (!filterOptions.lunchDate) {
			this.sendBadRequestError(res, { error: "lunchDate is required." });
			return;
		}

		const students = await lunchCheckManager.getAllStudents(new RequestContext(req), filterOptions);
		this.sendSuccess(res, students);
	}
}