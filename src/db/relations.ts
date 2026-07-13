import { defineRelations } from "drizzle-orm";
import { refreshTokensTable, usersTable } from "./schema";

export const relations = defineRelations(
	{
		users: usersTable,
		refreshTokens: refreshTokensTable,
	},
	(r) => ({
		users: {
			refreshTokens: r.many.refreshTokens(),
		},

		refreshTokens: {
			user: r.one.users({
				from: r.refreshTokens.userId,
				to: r.users.id,
			}),
		},
	}),
);
