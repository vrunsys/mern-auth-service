import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import logger from "../config/logger.ts";
import AuthController from "../controller/AuthController.ts";
import { TokenService } from "../service/TokenService.ts";
import UserService from "../service/UserService.ts";
import registerValidator from "../validator/register-validator.ts";

const router = Router();
const userService = new UserService();
const tokenService = new TokenService();
const controller = new AuthController(userService, tokenService, logger);

router.post(
	"/register",
	registerValidator,
	(req: Request, res: Response, next: NextFunction) =>
		controller.register(req, res, next),
);

export default router;
