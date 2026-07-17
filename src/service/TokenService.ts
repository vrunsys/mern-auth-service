import { eq } from "drizzle-orm";
import createHttpError from "http-errors";
import { type JwtPayload, sign } from "jsonwebtoken";
import { config } from "../config";
import db from "../config/db.ts";
import { refreshTokensTable, type usersTable } from "../db/schema.ts";

function loadPrivateKey(): string {
	let privateKey: string;
	if (!config.PRIVATE_KEY) {
		const error = createHttpError(500, "PRIVATE_KEY not set");
		throw error;
	}
	try {
		privateKey = config.PRIVATE_KEY!;
		return privateKey;
	} catch (error) {
		throw createHttpError(500, `Failed to read private key: ${privateKey!}`, {
			cause: error,
		});
	}
}

export class TokenService {
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
		return await db
			.delete(refreshTokensTable)
			.where(eq(refreshTokensTable.userId, userId));
	}
}
