import CookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type NextFunction,
	type Request,
	type Response,
} from "express";
import type { HttpError } from "http-errors";
import logger from "./config/logger";
import { globalError } from "./middleware/globalError.ts";
import authRouter from "./route/auth.ts";
import tenantRouter from "./route/tenant.ts";
import userRouter from "./route/user.ts";

const app = express();
const origins = process.env.ORIGINS?.split(",") ?? [];

app.use(
	cors({
		origin: origins,
		credentials: true,
	}),
);
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
app.use(globalError);

export default app;
