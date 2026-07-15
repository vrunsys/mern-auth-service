import db from "../config/db";
import { tenantsTable } from "../db/schema";

export default class TenantService {
	async create(tenant: typeof tenantsTable.$inferInsert) {
		return await db.insert(tenantsTable).values(tenant).returning();
	}
}
