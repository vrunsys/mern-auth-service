import {Router} from "express";
import type {Request, Response, NextFunction} from "express";
import AuthController from "../Controller/AuthController.ts";

const router = Router();

const controller = new AuthController();

router.post("/register", (req: Request, res: Response, next: NextFunction) =>
controller.register(req, res, next))

export default router;