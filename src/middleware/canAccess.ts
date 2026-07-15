import createHttpError from "http-errors";
import type { AuthRequest } from "../types";

export const canAccess = (roles: string[]) => {
	return (req: any, res: any, next: any) => {
		const _req = req as AuthRequest;
		const role = _req.auth?.role;

		if (!role) {
			const error = createHttpError(401, "Unauthorized");
			next(error);
			return;
		}
		if (!roles.includes(role)) {
			const error = createHttpError(403, "Forbidden");
			next(error);
			return;
		}
		next();
	};
};
