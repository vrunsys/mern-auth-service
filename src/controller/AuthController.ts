import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import fs from "fs";
import createHttpError from "http-errors";
import { type JwtPayload, sign } from "jsonwebtoken";
import path from "path";
import { config } from "../config/index.ts";
import type logger from "../config/logger.ts";
import type { usersTable } from "../db/schema.ts";
import type UserService from "../service/UserService.ts";

interface RegisterUserRequest extends Request {
	body: typeof usersTable.$inferInsert;
}

const privateKeyPath = path.resolve(
	import.meta.dirname,
	"../../keys/private.pem",
);

function loadPrivateKey(): string {
	try {
		return fs.readFileSync(privateKeyPath, "utf8");
	} catch (error) {
		throw createHttpError(
			500,
			`Failed to read private key: ${privateKeyPath}`,
			{ cause: error },
		);
	}
}

const privateKey = loadPrivateKey();

export default class AuthController {
	constructor(
		private userService: UserService,
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
			const accessToken = sign(payload, privateKey, {
				algorithm: "RS256",
				expiresIn: "15m",
			});

			const refreshToken = sign(payload, config.REFRESH_TOKEN_SECRET, {
				expiresIn: "7d",
			});

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
