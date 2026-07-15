import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type logger from "../config/logger";
import type TenantService from "../service/TenantService";

export default class TenantController {
	constructor(
		private tenantService: TenantService,
		private log: typeof logger,
	) {}
	async createTenant(req: Request, res: Response, next: NextFunction) {
		const results = validationResult(req);
		if (!results.isEmpty()) {
			res.status(400).json({ errors: results.array() });
			return;
		}
		const { name, address } = req.body;
		try {
			const tenant = await this.tenantService.create({ name, address });
			this.log.info("Tenant created", { id: tenant[0]?.id });
			res.status(201).json(tenant);
		} catch (error) {
			next(error);
		}
	}
}
