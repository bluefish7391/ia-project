import { Request, Response, Router } from "express";
import { BadRequestError, ServerError } from "../kinds";

export abstract class BaseRouter {
	protected router: Router;

	constructor() {
		this.router = this.initializeRoutes();
	}

	public abstract initializeRoutes(): Router;

	public getRouter(): Router {
		return this.router;
	}

	protected sendResponse(res: Response, resObj: any, statusCode: number) {
		res.status(statusCode).json(resObj);
	}

	protected sendSuccess(res: Response, data: any, status = 200): void {
		this.sendResponse(res, data, status);
	}

	protected sendBadRequestError(res: Response, data: any, status = 400): void {
		this.sendResponse(res, data, status);
	}

	protected sendServerError(res: Response, data: any, status = 500): void {
		this.sendResponse(res, data, status);
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