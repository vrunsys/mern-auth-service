import bcrypt from "bcrypt";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { Role } from "../../src/constants";
import {
	refreshTokensTable,
	tenantsTable,
	usersTable,
} from "../../src/db/schema.ts";
import { getCookieValue } from "./index.ts";

const TEST_PASSWORD = "TestAdmin@1190";
const TEST_PASSWORD_HASH = bcrypt.hash(TEST_PASSWORD, 4);

export const clearData = async () => {
	await db.delete(refreshTokensTable);
	await db.delete(usersTable);
	await db.delete(tenantsTable);
};

export const registerUser = async (email: string, role = Role.ADMIN) => {
	const response =
		role === Role.ADMIN
			? await (async () => {
					await db
						.insert(usersTable)
						.values({
							firstName: "Test",
							lastName: "Admin",
							email,
							password: await TEST_PASSWORD_HASH,
							role: Role.ADMIN,
						})
						.onConflictDoNothing({ target: usersTable.email });
					return request(app).post("/auth/login").send({
						email,
						password: TEST_PASSWORD,
					});
				})()
			: await request(app).post("/auth/register").send({
					firstName: "Test",
					lastName: "User",
					email,
					password: TEST_PASSWORD,
					role,
				});

	return {
		response,
		accessToken: getCookieValue(response.headers, "accessToken"),
		refreshToken: getCookieValue(response.headers, "refreshToken"),
	};
};

export const createManager = async (
	accessToken: string | null,
	email = "manager@example.com",
) => {
	const userData = {
		firstName: "Manager",
		lastName: "User",
		email,
		password: "password123",
	};
	const response = await request(app)
		.post("/users")
		.send(userData)
		.set("Cookie", [`accessToken=${accessToken}`]);

	return { response, userData };
};

export const createTenant = async (
	accessToken: string | null,
	name: string,
	address: string,
) =>
	request(app)
		.post("/tenants")
		.send({ name, address })
		.set("Cookie", [`accessToken=${accessToken}`]);
