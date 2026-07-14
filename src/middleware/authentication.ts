import { expressjwt, type GetVerificationKey } from "express-jwt";
import jwksClient from "jwks-rsa";
import { config } from "../config";

export default expressjwt({
	secret: jwksClient.expressJwtSecret({
		jwksUri: config.JWT_URI!,
		cache: true,
		rateLimit: true,
	}) as GetVerificationKey,
	algorithms: ["RS256"],
	getToken: (req) => {
		const authHeader = req.headers.authorization;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1];
			if (token) {
				return token;
			}
		}

		const accessTokenCookie = req.cookies?.accessToken;
		return accessTokenCookie;
	},
});
