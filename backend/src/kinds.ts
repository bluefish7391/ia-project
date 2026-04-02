
const SERVER_ERROR_KIND = "ServerError";
const BAD_REQUEST_ERROR_KIND = "BadRequestError";

export class ServerError extends Error {
	constructor(message: string, data?: any) {
		super(message);
		this.name = SERVER_ERROR_KIND;
	}
}

export class BadRequestError extends Error {
	constructor(message: string, data?: any) {
		super(message);
		this.name = BAD_REQUEST_ERROR_KIND;
	}
}