import {
	index,
	integer,
	pgTable,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { Role } from "../constants";

export const usersTable = pgTable(
	"users",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		firstName: varchar({ length: 255 }).notNull(),
		lastName: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }).notNull().unique(),
		password: varchar({ length: 255 }).notNull(),
		role: varchar({ length: 255 }).default(Role.CUSTOMER).notNull(),
		tentantId: integer("tentant_id").references(() => tenantsTable.id, {
			onDelete: "cascade",
		}),
	},
	(table) => [index("users_tentant_id_index").on(table.tentantId)],
);

export const refreshTokensTable = pgTable(
	"refresh_tokens",
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		userId: integer("user_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		expiresAt: timestamp().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("refresh_tokens_user_id_index").on(table.userId)],
);

export const tenantsTable = pgTable("tentants", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: varchar({ length: 255 }).notNull(),
	address: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.$onUpdate(() => new Date())
		.notNull(),
});
