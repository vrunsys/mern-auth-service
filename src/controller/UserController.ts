import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import type logger from "../config/logger.ts";
import { Role } from "../constants/index.ts";
import type UserService from "../service/UserService.ts";
import type { AuthRequest } from "../types";

export default class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly log: typeof logger,
	) {}

	async createUser(req: AuthRequest, res: Response, next: NextFunction) {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(400).json(result.array());
		}

		const { firstName, lastName, email, password } = req.body;

		try {
			const user = await this.userService.create({
				firstName,
				lastName,
				email,
				password,
				role: Role.MANAGER,
			});
			this.log.info("User created", { id: user[0]?.id });
			res.status(201).json({ id: user[0]?.id });
		} catch (error) {
			next(error);
		}
	}

	async getAllUsers(req: Request, res: Response, next: NextFunction) {
		try {
			const users = await this.userService.getAll();
			res.status(200).json(users);
		} catch (error) {
			next(error);
		}
	}

	async getUserById(req: Request, res: Response, next: NextFunction) {
		const { id } = req.params;
		try {
			const user = await this.userService.findById(Number(id));
			res.status(200).json(user);
		} catch (error) {
			next(error);
		}
	}

	async updateUser(req: Request, res: Response, next: NextFunction) {
		const { id } = req.params;
		const { firstName, lastName, role } = req.body;
		if (Number.isNaN(Number(id)))
			return next(createHttpError(400, "Invalid user id"));
		try {
			const user = await this.userService.updateById(Number(id), {
				firstName,
				lastName,
				role,
			});
			this.log.info(`User updated:`, { ...user[0] });
			res.status(200).json(user);
		} catch (error) {
			next(error);
		}
	}

	async deleteUser(req: Request, res: Response, next: NextFunction) {
		const { id } = req.params;
		if (Number.isNaN(Number(id)))
			return next(createHttpError(400, "Invalid user id"));
		try {
			await this.userService.deleteById(Number(id));
			this.log.info(`User deleted: ${id}`);
			res.status(200).json({ message: "User deleted" });
		} catch (error) {
			next(error);
		}
	}
}
