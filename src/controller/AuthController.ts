import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { type JwtPayload, sign } from "jsonwebtoken";
import { config } from "../config/index.ts";
import type logger from "../config/logger.ts";
import type { usersTable } from "../db/schema.ts";
import type { TokenService } from "../service/TokenService.ts";
import type UserService from "../service/UserService.ts";

interface RegisterUserRequest extends Request {
	body: typeof usersTable.$inferInsert;
}

export default class AuthController {
	constructor(
		private userService: UserService,
		private tokenService: TokenService,
		private log: typeof logger,
	) {}
	async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			res.status(400).json({ errors: result.array() });
			return;
		}
		try {
			const { firstName, lastName, email, password } = req.body;

			const newUser = await this.userService.create({
				firstName,
				lastName,
				email,
				password,
			});
			this.log.info(`user has been register with id: ${newUser[0]?.id}`);

			const payload: JwtPayload = {
				id: newUser[0]?.id,
				role: newUser[0]?.role,
			};

			const accessToken = this.tokenService.generateAccessToken(payload);
			const refreshToken = this.tokenService.generateRefreshToken(payload);
			const persistedRefreshToken = await this.tokenService.persistRefreshToken(
				newUser[0]!,
			);

			res.cookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: config.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			res.cookie("accessToken", accessToken, {
				httpOnly: true,
				secure: config.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 15 * 60 * 1000, // 15 minutes
			});

			res.status(201).json();
		} catch (e) {
			next(e);
		}
	}
}
