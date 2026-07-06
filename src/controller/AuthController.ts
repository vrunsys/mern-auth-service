import type { NextFunction, Request, Response } from "express";
import type logger from "../config/logger.ts";
import type { usersTable } from "../db/schema.ts";
import type UserService from "../service/UserService.ts";

interface RegisterUserRequest extends Request {
	body: typeof usersTable.$inferInsert;
}

export default class AuthController {
	constructor(
		private userService: UserService,
		private log: typeof logger,
	) {}
	async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
		try {
			const { firstName, lastName, email, password } = req.body;

			const newUser = await this.userService.create({
				firstName,
				lastName,
				email,
				password,
			});
			this.log.info(`user has been register with id: ${newUser.oid}`);
			res.status(201).json();
		} catch (e) {
			next(e);
		}
	}
}
