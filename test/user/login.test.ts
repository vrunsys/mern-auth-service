import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { usersTable } from "../../src/db/schema.ts";
import { isJwt } from "../utils/index.ts";

describe("POST auth/login", () => {
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
		});

		it("should return the valid json response", async () => {
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
			expect(loginResponse.headers["content-type"]).toEqual(
				expect.stringContaining("json"),
			);
		});

		it("should return the access token and refresh token in cookies", async () => {
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

			let accessToken = null;
			let refreshToken = null;
			const cookies = (loginResponse.headers as Headers)["set-cookie"] || [];
			// accessToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjkzOTA5Mjc2LCJleHAiOjE2OTM5MDkzMzYsImlzcyI6Im1lcm5zcGFjZSJ9.KetQMEzY36vxhO6WKwSR-P_feRU1yI-nJtp6RhCEZQTPlQlmVsNTP7mO-qfCdBr0gszxHi9Jd1mqf-hGhfiK8BRA_Zy2CH9xpPTBud_luqLMvfPiz3gYR24jPjDxfZJscdhE_AIL6Uv2fxCKvLba17X0WbefJSy4rtx3ZyLkbnnbelIqu5J5_7lz4aIkHjt-rb_sBaoQ0l8wE5KzyDNy7mGUf7cI_yR8D8VlO7x9llbhvCHF8ts6YSBRBt_e2Mjg5txtfBaDq5auCTXQ2lmnJtMb75t1nAFu8KwQPrDYmwtGZDkHUcpQhlP7R-y3H99YnrWpXbP8Zr_oO67hWnoCSw; Max-Age=43200; Domain=localhost; Path=/; Expires=Tue, 05 Sep 2023 22:21:16 GMT; HttpOnly; SameSite=Strict
			cookies.forEach((cookie) => {
				if (cookie.startsWith("accessToken=")) {
					accessToken = cookie.split(";")[0].split("=")[1];
				}

				if (cookie.startsWith("refreshToken=")) {
					refreshToken = cookie.split(";")[0].split("=")[1];
				}
			});
			expect(accessToken).not.toBeNull();
			expect(refreshToken).not.toBeNull();

			expect(isJwt(accessToken)).toBeTruthy();
			expect(isJwt(refreshToken)).toBeTruthy();
		});
	});

	describe("Given invalid credentials", () => {
		it("should return the 404 status code for invalid email", async () => {
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
				email: "invalid@example.com",
				password: userData.password,
			});
			expect(loginResponse.statusCode).toBe(404);
		});

		it("should return the 400 status code for invalid password", async () => {
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
				password: "invalidpassword",
			});
			expect(loginResponse.statusCode).toBe(401);
		});
	});

	describe("Given invalid request body", () => {
		it("should return the 400 status code for missing email", async () => {
			const loginResponse = await request(app).post("/auth/login").send({
				password: "testpassword",
			});
			expect(loginResponse.statusCode).toBe(400);
		});

		it("should return the 400 status code for missing password", async () => {
			const loginResponse = await request(app).post("/auth/login").send({
				email: "rakesh@example.com",
			});
			expect(loginResponse.statusCode).toBe(400);
		});
	});
});
