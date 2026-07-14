import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { usersTable } from "../../src/db/schema.ts";

describe("GET auth/self", () => {
	const clearUsers = async () => {
		await db.delete(usersTable);
	};

	beforeEach(clearUsers);
	afterEach(clearUsers);

	describe("Given valid credentials", () => {
		it("should return the 200 status code", async () => {
			const userData = {
				firstName: "Rakesh",
				lastName: "k",
				email: "rakesh@example.com",
				password: "testpassword",
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

			let accessToken = null;
			const cookies = ((loginResponse.headers as Headers)["set-cookie"] ||
				[]) as string[];

			cookies.forEach((cookie) => {
				if (cookie.startsWith("accessToken=")) {
					accessToken = cookie.split(";")[0].split("=")[1];
				}
			});
			const selfResponse = await request(app)
				.get("/auth/self")
				.set("Cookie", [`accessToken=${accessToken};`]);
			expect(selfResponse.statusCode).toBe(200);
		});
	});
});
