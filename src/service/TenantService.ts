import { and, eq, ilike, or } from "drizzle-orm";
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
		const { currentPage, perPage, q } = validatedQuery;

		let tenants: (typeof tenantsTable.$inferSelect)[];

		if (q) {
			tenants = await db
				.select()
				.from(tenantsTable)
				.where(
					and(
						q
							? or(
									ilike(tenantsTable.name, `%${q}%`),
									ilike(tenantsTable.address, `%${q}%`),
								)
							: undefined,
					),
				);

			return {
				currentPage,
				perPage,
				count: tenants.length,
				tenants,
			};
		}

		tenants = await db
			.select()
			.from(tenantsTable)
			.limit(perPage)
			.offset((currentPage - 1) * perPage);
		return {
			currentPage,
			perPage,
			count: tenants.length,
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
