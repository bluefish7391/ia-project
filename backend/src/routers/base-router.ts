import { Request, Response } from "express";
import { BadRequestError, ServerError } from "../kinds";

export abstract class BaseRouter {
	protected sendResponse(res: Response, resObj: any, statusCode: number) {
		res.status(statusCode).json(resObj);
	}

	protected sendSuccess(res: Response, data: any): void {
		this.sendResponse(res, data, 200);
	}

	protected sendBadRequestError(res: Response, data: any): void {
		this.sendResponse(res, data, 400);
	}

	protected sendServerError(res: Response, data: any): void {
		this.sendResponse(res, data, 500);
	}

	protected wrapAsync(
		handler: (req: Request, res: Response) => Promise<void>
	) {
		return async (req: Request, res: Response) => {
			try {
				await handler(req, res);
			} catch (error: any) {
				this.handleError(res, error);
			}
		};
	}

	private handleError(res: Response, error: any) {
		if (error instanceof ServerError) {
			console.log("Server error:", error);
			this.sendServerError(res, { error: error.message });
		} else if (error instanceof BadRequestError) {
			console.log("Bad request error:", error);
			this.sendBadRequestError(res, { error: error.message });
		} else {
			console.log("Unexpected error:", error);
			this.sendServerError(res, { error: "An unexpected error occurred" });
		}
	}
}