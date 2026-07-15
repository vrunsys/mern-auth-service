import { defineRelations } from "drizzle-orm";
import { refreshTokensTable, tenantsTable, usersTable } from "./schema";

export const relations = defineRelations(
	{
		users: usersTable,
		refreshTokens: refreshTokensTable,
		tenants: tenantsTable,
	},
	(r) => ({
		users: {
			refreshTokens: r.many.refreshTokens(),
			tenants: r.one.tenants({
				from: r.users.tentantId,
				to: r.tenants.id,
			}),
		},

		refreshTokens: {
			user: r.one.users({
				from: r.refreshTokens.userId,
				to: r.users.id,
			}),
		},

		tenants: {
			users: r.many.users(),
		},
	}),
);
