import bcrypt from "bcrypt";
import { and, eq, getColumns, ilike, or } from "drizzle-orm";
import createHttpError from "http-errors";
import db from "../config/db.ts";
import { Role } from "../constants/index.ts";
import { tenantsTable, usersTable } from "../db/schema.ts";
import type { ValidatedQuery } from "../types/index.ts";

type NewUser = typeof usersTable.$inferInsert;

export default class UserService {
	async create({
		firstName,
		lastName,
		email,
		password,
		role,
		tentantId,
	}: NewUser) {
		const user = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
			.limit(1);
		if (user.length !== 0) {
			throw createHttpError(400, "Email already exist!");
		}
		const hashPassword = await bcrypt.hash(password, 10);
		try {
			const user: NewUser = {
				firstName: firstName,
				lastName: lastName,
				email: email,
				password: hashPassword,
				role: role || Role.CUSTOMER,
				tentantId: tentantId || null,
			};

			const newUser = await db.insert(usersTable).values(user).returning();
			return newUser;
		} catch (error: unknown) {
			const err = createHttpError(500, "Failed to store in database", {
				cause: error,
			});
			throw err;
		}
	}

	async findByEmail(email: string) {
		const user = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, email))
			.limit(1);

		return user;
	}

	async findById(id: number) {
		const user = await db.query.users.findFirst({
			columns: {
				password: false,
			},
			where: {
				id: id,
			},
			with: {
				tenants: true,
			},
		});

		return user;
	}

	async getAll(validatedQuery: ValidatedQuery) {
		const { currentPage, perPage, role, q } = validatedQuery;
		const { password, ...returningColumns } = getColumns(usersTable);
		if (role || q) {
			const users = await db
				.select({ ...returningColumns, tenants: tenantsTable })
				.from(usersTable)
				.leftJoin(tenantsTable, eq(usersTable.tentantId, tenantsTable.id))
				.where(
					and(
						q
							? or(
									ilike(usersTable.firstName, `%${q}%`),
									ilike(usersTable.lastName, `%${q}%`),
									ilike(usersTable.email, `%${q}%`),
									eq(usersTable.role, role),
								)
							: undefined,

						role ? eq(usersTable.role, role) : undefined,
					),
				);

			return {
				currentPage,
				perPage,
				count: users.length ?? 0,
				users,
			};
		}

		const users = await db.query.users.findMany({
			columns: {
				password: false,
			},
			limit: perPage,
			offset: (currentPage - 1) * perPage,
			with: {
				tenants: true,
			},
		});

		return {
			currentPage,
			perPage,
			count: users.length ?? 0,
			users,
		};
	}

	async updateById(id: number, data: Partial<NewUser>) {
		const { password, ...returningColumns } = getColumns(usersTable);
		const updatedUser = await db
			.update(usersTable)
			.set(data)
			.where(eq(usersTable.id, id))
			.returning({ ...returningColumns });
		return updatedUser;
	}

	async deleteById(id: number) {
		return await db.delete(usersTable).where(eq(usersTable.id, id));
	}
}
