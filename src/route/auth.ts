import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import logger from "../config/logger.ts";
import AuthController from "../controller/AuthController.ts";
import UserService from "../service/UserService.ts";

const router = Router();
const userService = new UserService();
const controller = new AuthController(userService, logger);

router.post("/register", (req: Request, res: Response, next: NextFunction) =>
	controller.register(req, res, next),
);

export default router;
