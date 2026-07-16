import CookieParser from "cookie-parser";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import type { HttpError } from "http-errors";
import logger from "./config/logger";
import authRouter from "./route/auth.ts";
import tenantRouter from "./route/tenant.ts";
import userRouter from "./route/user.ts";

const app = express();

app.use(express.static("public", { dotfiles: "allow" }));
app.use(CookieParser());
app.use(express.json());

// biome-ignore lint: correctness/noUnusedVariables
app.all("/health", (req, res) => {
	res.status(200).json({ status: "OK" });
});

app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", userRouter);

// biome-ignore lint: correctness/noUnusedVariables
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
	logger.error(err.message);
	const statusCode = err.statusCode || err.status || 500;
	res.status(statusCode).json({
		errors: [
			{
				type: err.name,
				message: err.message,
				path: "",
				location: "",
			},
		],
	});
});

export default app;
