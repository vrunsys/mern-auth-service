import { eq } from "drizzle-orm";
import fs from "fs";
import createHttpError from "http-errors";
import { type JwtPayload, sign } from "jsonwebtoken";
import path from "path";
import { config } from "../config";
import db from "../config/db.ts";
import { refreshTokensTable, type usersTable } from "../db/schema.ts";

const privateKeyPath = path.resolve(import.meta.dir, "../../keys/private.pem");

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

export class TokenService {
	constructor() {}

	generateAccessToken(payload: JwtPayload) {
		const privateKey = loadPrivateKey();
		const accessToken = sign(payload, privateKey, {
			algorithm: "RS256",
			expiresIn: "15m",
		});
		return accessToken;
	}

	generateRefreshToken(payload: JwtPayload) {
		const refreshToken = sign(payload, config.REFRESH_TOKEN_SECRET, {
			expiresIn: "7d",
		});
		return refreshToken;
	}

	async persistRefreshToken(userId: typeof usersTable.$inferSelect.id) {
		const MS_IN_YEAR = 365 * 24 * 60 * 60 * 1000;
		const refreshToken = await db
			.insert(refreshTokensTable)
			.values({
				userId: userId,
				expiresAt: new Date(Date.now() + MS_IN_YEAR),
			})
			.returning();

		return refreshToken[0];
	}

	async deleteRefreshToken(userId: typeof usersTable.$inferSelect.id) {
		await db
			.delete(refreshTokensTable)
			.where(eq(refreshTokensTable.userId, userId));
		return;
	}
}
