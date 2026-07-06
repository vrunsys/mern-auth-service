import createHttpError from "http-errors";
import db from "../config/db.ts";
import { usersTable } from "../db/schema.ts";

type NewUser = typeof usersTable.$inferInsert;

export default class UserService {
	constructor() {}

	async create({ firstName, lastName, email, password }: NewUser) {
		try {
			const user: NewUser = {
				firstName: firstName,
				lastName: lastName,
				email: email,
				password: password,
			};

			const newUser = await db.insert(usersTable).values(user);
			return newUser;
		} catch (error) {
			const err = createHttpError(500, "Failed to store in database");
			throw err;
		}
	}
}
