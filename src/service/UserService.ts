import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import createHttpError from "http-errors";
import db from "../config/db.ts";
import { usersTable } from "../db/schema.ts";

type NewUser = typeof usersTable.$inferInsert;

export default class UserService {
	constructor() {}

	async create({ firstName, lastName, email, password }: NewUser) {
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
			};

			const newUser = await db.insert(usersTable).values(user);
			return newUser;
		} catch (error) {
			const err = createHttpError(500, "Failed to store in database");
			throw err;
		}
	}
}
