import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type logger from "../config/logger";
import type TenantService from "../service/TenantService";

export default class TenantController {
	constructor(
		private readonly tenantService: TenantService,
		private readonly log: typeof logger,
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

	async updateTenant(req: Request, res: Response, next: NextFunction) {
		const results = validationResult(req);
		if (!results.isEmpty()) {
			res.status(400).json({ errors: results.array() });
			return;
		}
		const { name, address } = req.body;
		const id = Number.parseInt(req.params.id);
		try {
			const tenant = await this.tenantService.updateTenant(id, {
				name,
				address,
			});
			this.log.info("Tenant updated", { id: tenant[0]?.id });
			res.status(200).json(tenant);
		} catch (error) {
			next(error);
		}
	}

	async deleteTenant(req: Request, res: Response, next: NextFunction) {
		const id = Number.parseInt(req.params.id);
		try {
			await this.tenantService.deleteTenant(id);
			this.log.info("Tenant deleted", { id });
			res.status(204).send();
		} catch (error) {
			next(error);
		}
	}

	async getTenants(req: Request, res: Response, next: NextFunction) {
		try {
			const tenants = await this.tenantService.getAllTenants();
			res.status(200).json(tenants);
		} catch (error) {
			next(error);
		}
	}

	async getTenantById(req: Request, res: Response, next: NextFunction) {
		const id = Number.parseInt(req.params.id);
		try {
			const tenant = await this.tenantService.getTenantById(id);
			res.status(200).json(tenant);
		} catch (error) {
			next(error);
		}
	}
}
