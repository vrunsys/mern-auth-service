import type { Request } from "express";
import type { usersTable } from "../db/schema.ts";

export interface RegisterUserRequest extends Request {
	body: typeof usersTable.$inferInsert;
}

export interface LoginUserRequest extends Request {
	body: {
		email: string;
		password: string;
	};
}

export interface AuthRequest extends Request {
	auth: {
		id: number;
		role: string;
		iat: number;
		exp: number;
	};
}

export interface AuthCookie {
	refreshToken: string;
	accessToken: string;
}
