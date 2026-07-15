import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import createHttpError from "http-errors";
import db from "../config/db.ts";
import { Role } from "../constants/index.ts";
import { usersTable } from "../db/schema.ts";

type NewUser = typeof usersTable.$inferInsert;

export default class UserService {
	constructor() {}

	async create({ firstName, lastName, email, password, role }: NewUser) {
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
			};

			const newUser = await db.insert(usersTable).values(user).returning();
			return newUser;
		} catch (error) {
			const err = createHttpError(500, "Failed to store in database");
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
		});

		return user;
	}
}
