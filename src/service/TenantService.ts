import { count, eq } from "drizzle-orm";
import db from "../config/db";
import { tenantsTable } from "../db/schema";
import type { ValidatedQuery } from "../types";

export default class TenantService {
	async create(tenant: typeof tenantsTable.$inferInsert) {
		return await db.insert(tenantsTable).values(tenant).returning();
	}

	async updateTenant(id: number, tenant: typeof tenantsTable.$inferInsert) {
		return await db
			.update(tenantsTable)
			.set(tenant)
			.where(eq(tenantsTable.id, id))
			.returning();
	}

	async getAllTenants(validatedQuery: ValidatedQuery) {
		const { currentPage, perPage } = validatedQuery;
		const totalUsers = await db
			.select({ count: count(tenantsTable.id) })
			.from(tenantsTable);
		const tenants = await db
			.select()
			.from(tenantsTable)
			.limit(perPage)
			.offset((currentPage - 1) * perPage);
		return {
			currentPage,
			perPage,
			count: totalUsers[0]?.count ?? 0,
			tenants,
		};
	}

	async getTenantById(id: number) {
		return await db.select().from(tenantsTable).where(eq(tenantsTable.id, id));
	}

	async deleteTenant(id: number) {
		return await db.delete(tenantsTable).where(eq(tenantsTable.id, id));
	}
}
