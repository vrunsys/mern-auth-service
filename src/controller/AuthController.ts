import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { type JwtPayload, sign } from "jsonwebtoken";
import { config } from "../config/index.ts";
import type logger from "../config/logger.ts";
import type { usersTable } from "../db/schema.ts";
import type { CredentialService } from "../service/CredentialService.ts";
import type { TokenService } from "../service/TokenService.ts";
import type UserService from "../service/UserService.ts";
import type {
	AuthRequest,
	LoginUserRequest,
	RegisterUserRequest,
} from "../types/index.ts";

export default class AuthController {
	constructor(
		private userService: UserService,
		private tokenService: TokenService,
		private credentialService: CredentialService,
		private log: typeof logger,
	) {}
	async register(req: RegisterUserRequest, res: Response, next: NextFunction) {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			res.status(400).json({ errors: result.array() });
			return;
		}
		try {
			const { firstName, lastName, email, password, role } = req.body;

			const newUser = (await this.userService.create({
				firstName,
				lastName,
				email,
				password,
				role,
			})) as (typeof usersTable.$inferSelect)[];
			this.log.info(`user has been register with id: ${newUser[0]?.id}`);

			const payload: JwtPayload = {
				id: newUser[0]?.id,
				role: newUser[0]?.role,
			};

			const accessToken = this.tokenService.generateAccessToken(payload);
			const refreshToken = this.tokenService.generateRefreshToken(payload);
			const persistedRefreshToken = await this.tokenService.persistRefreshToken(
				newUser[0]?.id as number,
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

	async login(req: LoginUserRequest, res: Response, next: NextFunction) {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			res.status(400).json({ errors: result.array() });
			return;
		}
		try {
			const { email, password } = req.body;

			const user = await this.userService.findByEmail(email);
			if (user.length === 0) {
				throw createHttpError(404, "User not found");
			}

			const isPasswordValid = await this.credentialService.comparePassword(
				password,
				user[0]!.password,
			);

			if (!isPasswordValid) {
				throw createHttpError(401, "Invalid password");
			}

			const payload: JwtPayload = {
				id: user[0]?.id,
				role: user[0]?.role,
			};

			const accessToken = this.tokenService.generateAccessToken(payload);
			const refreshToken = this.tokenService.generateRefreshToken(payload);
			const persistedRefreshToken = await this.tokenService.persistRefreshToken(
				user[0]!.id,
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
			this.log.info(`user has been logged in with id: ${user[0]?.id}`);
			res.status(201).json({ id: user[0]?.id });
		} catch (e) {
			next(e);
		}
	}

	async logout(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			await this.tokenService.deleteRefreshToken(Number(req.auth.id));
			res.clearCookie("refreshToken");
			res.clearCookie("accessToken");
			this.log.info(`user has been logged out with id: ${req.auth.id}`);
			res.status(200).json({ message: "logged out" });
		} catch (e) {
			next(e);
		}
	}

	async self(req: AuthRequest, res: Response, next: NextFunction) {
		const user = await this.userService.findById(req.auth.id);
		this.log.info(`user has been fetched with id: ${req.auth.id}`);
		res.json(user);
	}

	async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const payload: JwtPayload = {
				id: req.auth.id,
				role: req.auth.role,
			};

			await this.tokenService.deleteRefreshToken(Number(req.auth.id));
			const accessToken = this.tokenService.generateAccessToken(payload);
			const refreshToken = this.tokenService.generateRefreshToken(payload);
			const persistedRefreshToken = await this.tokenService.persistRefreshToken(
				Number(req.auth.id),
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
			this.log.info(`user has been logged in with id: ${req.auth.id}`);
			res.status(201).json({ id: req.auth.id });
		} catch (e) {
			next(e);
		}
	}
}
