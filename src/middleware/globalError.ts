import type { NextFunction, Request, Response } from "express";
import type { HttpError } from "http-errors";
import { v4 as uuidv4 } from "uuid";
import logger from "../config/logger";

export const globalError = (
	err: HttpError,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const errorId = uuidv4();
	const statusCode = err.status || 500;
	const isProduction = process.env.NODE_ENV === "production";
	const message = isProduction ? "Internal Server Error" : err.message;

	logger.error(err.message, {
		id: errorId,
		error: err.stack,
		path: req.path,
		method: req.method,
	});

	res.status(statusCode).json({
		errors: [
			{
				ref: errorId,
				type: err.name,
				msg: message,
				path: req.path,
				method: req.method,
				location: "server",
				stack: isProduction ? null : err.stack,
			},
		],
	});
};
