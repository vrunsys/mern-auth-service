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

export const clearData = async () => {
	await db.delete(refreshTokensTable);
	await db.delete(usersTable);
	await db.delete(tenantsTable);
};

export const registerUser = async (email: string, role = Role.ADMIN) => {
	const response = await request(app).post("/auth/register").send({
		firstName: "Test",
		lastName: "User",
		email,
		password: "Test@1190",
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
