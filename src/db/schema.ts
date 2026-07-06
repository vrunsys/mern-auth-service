import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { Role } from "../constants";

export const usersTable = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	firstName: varchar({ length: 255 }).notNull(),
	lastName: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull().unique(),
	password: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 255 }).default(Role.CUSTOMER).notNull(),
});
