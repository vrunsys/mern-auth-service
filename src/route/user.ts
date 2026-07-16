import type { NextFunction, Request, Response } from "express";
import express from "express";
import logger from "../config/logger";
import { Role } from "../constants";
import UserController from "../controller/UserController";
import authentication from "../middleware/authentication";
import { canAccess } from "../middleware/canAccess";
import UserService from "../service/UserService";
import type { AuthRequest } from "../types";
import registerValidator from "../validator/register-validator";

const router = express.Router();

const userService = new UserService();
const controller = new UserController(userService, logger);

router.post(
	"/",
	authentication,
	canAccess([Role.ADMIN]),
	registerValidator,
	async (req: Request, res: Response, next: NextFunction) => {
		await controller.createUser(req as AuthRequest, res, next);
	},
);

router.get(
	"/",
	authentication,
	canAccess([Role.ADMIN]),
	async (req: Request, res: Response, next: NextFunction) => {
		await controller.getAllUsers(req as AuthRequest, res, next);
	},
);

router.get(
	"/:id",
	authentication,
	canAccess([Role.ADMIN]),
	async (req: Request, res: Response, next: NextFunction) => {
		await controller.getUserById(req, res, next);
	},
);

router.patch(
	"/:id",
	authentication,
	canAccess([Role.ADMIN]),
	async (req: Request, res: Response, next: NextFunction) => {
		await controller.updateUser(req, res, next);
	},
);

router.delete(
	"/:id",
	authentication,
	canAccess([Role.ADMIN]),
	async (req: Request, res: Response, next: NextFunction) => {
		await controller.deleteUser(req, res, next);
	},
);

export default router;
