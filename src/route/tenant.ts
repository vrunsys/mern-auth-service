import express from "express";
import logger from "../config/logger";
import { Role } from "../constants";
import TenantController from "../controller/TenantController";
import authentication from "../middleware/authentication";
import { canAccess } from "../middleware/canAccess";
import TenantService from "../service/TenantService";
import tenantsValidator from "../validator/tenants-validator";

const router = express.Router();

const tenantService = new TenantService();
const tenantController = new TenantController(tenantService, logger);

router.post(
	"/",
	tenantsValidator,
	authentication,
	canAccess([Role.ADMIN]),
	async (req, res, next) => {
		await tenantController.createTenant(req, res, next);
	},
);

router.patch(
	"/:id",
	tenantsValidator,
	authentication,
	canAccess([Role.ADMIN]),
	async (req, res, next) => {
		await tenantController.updateTenant(req, res, next);
	},
);

router.delete(
	"/:id",
	authentication,
	canAccess([Role.ADMIN]),
	async (req, res, next) => {
		await tenantController.deleteTenant(req, res, next);
	},
);

router.get(
	"/",
	authentication,
	canAccess([Role.ADMIN]),
	async (req, res, next) => {
		await tenantController.getTenants(req, res, next);
	},
);

router.get(
	"/:id",
	authentication,
	canAccess([Role.ADMIN]),
	async (req, res, next) => {
		await tenantController.getTenantById(req, res, next);
	},
);

export default router;
