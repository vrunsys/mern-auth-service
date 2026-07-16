import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import logger from "../config/logger.ts";
import AuthController from "../controller/AuthController.ts";
import authentication from "../middleware/authentication.ts";
import validateRefreshToken from "../middleware/validateRefreshToken.ts";
import { CredentialService } from "../service/CredentialService.ts";
import { TokenService } from "../service/TokenService.ts";
import UserService from "../service/UserService.ts";
import type { AuthRequest } from "../types/index.ts";
import loginValidator from "../validator/login-validator.ts";
import registerValidator from "../validator/register-validator.ts";

const router = Router();
const userService = new UserService();
const tokenService = new TokenService();
const credentialService = new CredentialService();
const controller = new AuthController(
	userService,
	tokenService,
	credentialService,
	logger,
);

router.post(
	"/register",
	registerValidator,
	(req: Request, res: Response, next: NextFunction) =>
		controller.register(req, res, next),
);

router.post(
	"/login",
	loginValidator,
	(req: Request, res: Response, next: NextFunction) =>
		controller.login(req, res, next),
);

router.get(
	"/self",
	authentication,
	(req: Request, res: Response, next: NextFunction) =>
		controller.self(req as AuthRequest, res, next),
);

router.post(
	"/refresh",
	validateRefreshToken,
	(req: Request, res: Response, next: NextFunction) =>
		controller.refreshToken(req as AuthRequest, res, next),
);

router.post(
	"/logout",
	authentication,
	(req: Request, res: Response, next: NextFunction) =>
		controller.logout(req as AuthRequest, res, next),
);

export default router;
