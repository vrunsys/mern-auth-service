import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { Role } from "../../src/constants";
import {
	refreshTokensTable,
	tenantsTable,
	usersTable,
} from "../../src/db/schema.ts";
import { getCookieValue, isJwt } from "../utils/index.ts";

describe("Auth session routes", () => {
	const clearData = async () => {
		await db.delete(refreshTokensTable);
		await db.delete(usersTable);
		await db.delete(tenantsTable);
	};

	const registerAndLogin = async () => {
		const userData = {
			firstName: "Session",
			lastName: "User",
			email: "session@example.com",
			password: "password123",
			role: Role.CUSTOMER,
		};

		const registerResponse = await request(app)
			.post("/auth/register")
			.send(userData);
		expect(registerResponse.statusCode).toBe(201);

		const loginResponse = await request(app).post("/auth/login").send({
			email: userData.email,
			password: userData.password,
		});
		expect(loginResponse.statusCode).toBe(201);

		return {
			id: loginResponse.body.id as number,
			accessToken: getCookieValue(loginResponse.headers, "accessToken"),
			refreshToken: getCookieValue(loginResponse.headers, "refreshToken"),
		};
	};

	beforeEach(clearData);
	afterEach(clearData);

	it("should return the current user when access token is sent as bearer token", async () => {
		const { accessToken } = await registerAndLogin();
		expect(accessToken).not.toBeNull();

		const response = await request(app)
			.get("/auth/self")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.statusCode).toBe(200);
		expect(response.body.email).toBe("session@example.com");
	});

	it("should rotate refresh token and return new auth cookies", async () => {
		const { id, refreshToken } = await registerAndLogin();
		expect(refreshToken).not.toBeNull();

		const response = await request(app)
			.post("/auth/refresh")
			.set("Cookie", [`refreshToken=${refreshToken}`]);

		const accessToken = getCookieValue(response.headers, "accessToken");
		const rotatedRefreshToken = getCookieValue(
			response.headers,
			"refreshToken",
		);

		expect(response.statusCode).toBe(201);
		expect(response.body).toEqual({ id });
		expect(accessToken).not.toBeNull();
		expect(rotatedRefreshToken).not.toBeNull();
		expect(isJwt(accessToken)).toBeTruthy();
		expect(isJwt(rotatedRefreshToken)).toBeTruthy();
	});

	it("should clear auth cookies on logout", async () => {
		const { accessToken } = await registerAndLogin();
		expect(accessToken).not.toBeNull();

		const response = await request(app)
			.post("/auth/logout")
			.set("Cookie", [`accessToken=${accessToken}`]);
		const cookies = (response.headers["set-cookie"] || []) as string[];
		const clearCookieHeader = cookies.join("; ");

		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({ message: "logged out" });
		expect(clearCookieHeader).toContain("refreshToken=");
		expect(clearCookieHeader).toContain("accessToken=");
	});
});
