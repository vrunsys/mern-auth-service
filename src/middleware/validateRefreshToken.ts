import type { Request } from "express";
import { expressjwt } from "express-jwt";
import type { JwtPayload } from "jsonwebtoken";
import { config } from "../config";
import db from "../config/db";
import logger from "../config/logger";
import type { AuthCookie } from "../types";

export default expressjwt({
	secret: config.REFRESH_TOKEN_SECRET,
	algorithms: ["HS256"],
	getToken: (req: Request) => {
		const { refreshToken } = req.cookies as AuthCookie;
		return refreshToken;
	},
	async isRevoked(req: Request, token: JwtPayload & { id: string }) {
		try {
			const refreshToken = await db.query.refreshTokens.findFirst({
				where: {
					userId: Number(token?.payload.id),
				},
			});
			return refreshToken === null;
		} catch (error) {
			logger.error("Error while validating refresh token", {
				id: token?.payload.id,
			});
		}
		return true;
	},
});
