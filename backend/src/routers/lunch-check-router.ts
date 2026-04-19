import { GetStudentLunchCheckInAndOutHistoryRequest, QueryStudentLunchCheckRequest, SaveStudentLunchCheckConfigRequest, SaveStudentLunchCheckRequest } from "../../../shared/kinds";
import { lunchCheckManager } from "../managers/manager-factory";
import { RequestContext } from "../request-context";
import { BaseRouter } from "./base-router";
import express, { Request, Response } from "express";

export class LunchCheckRouter extends BaseRouter {
	public static buildRouter() {
		const lunchCheckRouter = new LunchCheckRouter();
		return express.Router()
			.post("/student-lunch-check-records", lunchCheckRouter.wrapAsync(lunchCheckRouter.getAllStudentLunchCheckRecords.bind(lunchCheckRouter)))
			.put("/student-lunch-check-record", lunchCheckRouter.wrapAsync(lunchCheckRouter.saveStudentLunchCheck.bind(lunchCheckRouter)))
			.get("/student-lunch-check-in-and-out-history", lunchCheckRouter.wrapAsync(lunchCheckRouter.getStudentLunchCheckInAndOutHistory.bind(lunchCheckRouter)))
			.post("/student-lunch-check", lunchCheckRouter.wrapAsync(lunchCheckRouter.saveStudentLunchCheckConfig.bind(lunchCheckRouter)));
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

	async saveStudentLunchCheck(req: Request, res: Response) {
		const body = req.body as SaveStudentLunchCheckRequest;
		if (!body.studentID || !body.lunchDate || body.checkingIn === undefined) {
			this.sendBadRequestError(res, { error: "studentID, lunchDate and checkingIn are required." });
			return;
		}

		const lunchCheckRecord = await lunchCheckManager.saveStudentLunchCheck(new RequestContext(req), body);
		this.sendSuccess(res, { lunchCheckRecord });
	}

	async getStudentLunchCheckInAndOutHistory(req: Request, res: Response) {
		const body = req.body as GetStudentLunchCheckInAndOutHistoryRequest;
		if (!body.studentID) {
			this.sendBadRequestError(res, { error: "studentID is required." });
			return;
		}
		const history = await lunchCheckManager.getStudentLunchCheckInAndOutHistory(new RequestContext(req), body);
		this.sendSuccess(res, history);
	}

	async saveStudentLunchCheckConfig(req: Request, res: Response) {
		const body = req.body as SaveStudentLunchCheckConfigRequest;
		if (!body.studentID || body.contractSigned === undefined) {
			this.sendBadRequestError(res, { error: "studentID and contractSigned are required." });
			return;
		}
		const result = await lunchCheckManager.saveStudentLunchCheckConfig(new RequestContext(req), body);
		this.sendSuccess(res, result);
	}
}