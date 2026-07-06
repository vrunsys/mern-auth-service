import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import type { HttpError } from "http-errors";
import logger from "./config/logger";
import authRouter from "./route/auth.ts";

const app = express();

app.use(express.json());

// biome-ignore lint: correctness/noUnusedVariables
app.all("/health", (req, res) => {
	res.status(200).json({ status: "OK" });
});

app.use("/auth", authRouter);

// biome-ignore lint: correctness/noUnusedVariables
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
	logger.error(err.message);
	const statusCode = err.statusCode || 500;
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
