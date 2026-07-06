import type {Request, Response, NextFunction} from "express";

export default class AuthController{
    register(req: Request, res: Response, next: NextFunction){
        res.status(201).json();
    }
}