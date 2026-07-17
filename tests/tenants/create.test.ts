import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { name } from "drizzle-orm";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { Role } from "../../src/constants/index.ts";
import {
	refreshTokensTable,
	tenantsTable,
	usersTable,
} from "../../src/db/schema.ts";

describe("POST /tenants", () => {
	const clearUsers = async () => {
		await db.delete(usersTable);
		await db.delete(refreshTokensTable);
		await db.delete(tenantsTable);
	};

	beforeEach(clearUsers);
	afterEach(clearUsers);

	describe("Given all fields", () => {
		it("should return a 201 status code", async () => {
			// register admin
			const userData = {
				firstName: "admin",
				lastName: "admin",
				email: "admin@admin.com",
				password: "Test@1190",
				role: Role.ADMIN,
			};

			await request(app).post("/auth/register").send(userData);

			// login admin
			const loginData = {
				email: userData.email,
				password: userData.password,
			};
			const loginResponse = await request(app)
				.post("/auth/login")
				.send(loginData);

			let accessToken = null;
			const cookies = ((loginResponse.headers as Headers)["set-cookie"] ||
				[]) as string[];

			cookies.forEach((cookie) => {
				if (cookie.startsWith("accessToken=")) {
					accessToken = cookie.split(";")[0].split("=")[1];
				}
			});

			const tenantData: typeof tenantsTable.$inferInsert = {
				name: "tenant name",
				address: "tenant address",
			};
			const response = await request(app)
				.post("/tenants")
				.send(tenantData)
				.set("Cookie", [`accessToken=${accessToken}`]);

			expect(response.status).toBe(201);
		});

		it("should create a tenant in the database", async () => {
			const tenantData: typeof tenantsTable.$inferInsert = {
				name: "tenant name",
				address: "tenant address",
			};

			// register admin
			const userData = {
				firstName: "admin",
				lastName: "admin",
				email: "admin@admin.com",
				password: "Test@1190",
				role: Role.ADMIN,
			};

			await request(app).post("/auth/register").send(userData);

			// login admin
			const loginData = {
				email: userData.email,
				password: userData.password,
			};
			const loginResponse = await request(app)
				.post("/auth/login")
				.send(loginData);

			let accessToken = null;
			const cookies = ((loginResponse.headers as Headers)["set-cookie"] ||
				[]) as string[];

			cookies.forEach((cookie) => {
				if (cookie.startsWith("accessToken=")) {
					accessToken = cookie.split(";")[0].split("=")[1];
				}
			});

			const response = await request(app)
				.post("/tenants")
				.send(tenantData)
				.set("Cookie", [`accessToken=${accessToken}`]);
			const tenants = (await db
				.select()
				.from(tenantsTable)) as (typeof tenantsTable.$inferSelect)[];
			expect(tenants.length).toBe(1);
			expect(tenants[0]?.name).toBe(tenantData.name);
			expect(tenants[0]?.address).toBe(tenantData.address);
		});

		it("should return 401 status code when not authenticated", async () => {
			const tenantData: typeof tenantsTable.$inferInsert = {
				name: "tenant name",
				address: "tenant address",
			};

			// register admin
			const userData = {
				firstName: "admin",
				lastName: "admin",
				email: "admin@admin.com",
				password: "Test@1190",
			};

			await request(app).post("/users/register").send(userData);

			// login admin
			const loginData = {
				email: userData.email,
				password: userData.password,
			};
			const loginResponse = await request(app)
				.post("/users/login")
				.send(loginData);

			let accessToken = null;
			const cookies = ((loginResponse.headers as Headers)["set-cookie"] ||
				[]) as string[];

			cookies.forEach((cookie) => {
				if (cookie.startsWith("accessToken=")) {
					accessToken = cookie.split(";")[0].split("=")[1];
				}
			});

			const response = await request(app)
				.post("/tenants")
				.send(tenantData)
				.set("Cookie", [`accessToken=${accessToken}`]);
			expect(response.status).toBe(401);
		});
	});

	describe("Fields validation", () => {
		it("should return 400 status code when name is missing", async () => {
			// register admin
			const userData = {
				firstName: "admin",
				lastName: "admin",
				email: "admin@admin.com",
				password: "Test@1190",
				role: Role.ADMIN,
			};

			await request(app).post("/auth/register").send(userData);

			// login admin
			const loginData = {
				email: userData.email,
				password: userData.password,
			};
			const loginResponse = await request(app)
				.post("/auth/login")
				.send(loginData);

			let accessToken = null;
			const cookies = ((loginResponse.headers as Headers)["set-cookie"] ||
				[]) as string[];

			cookies.forEach((cookie) => {
				if (cookie.startsWith("accessToken=")) {
					accessToken = cookie.split(";")[0].split("=")[1];
				}
			});

			const tenantData: typeof tenantsTable.$inferInsert = {
				name: "",
				address: "tenant address",
			};

			const response = await request(app)
				.post("/tenants")
				.send(tenantData)
				.set("Cookie", [`accessToken=${accessToken}`]);

			expect(response.status).toBe(400);
		});
		it("should return 400 status code when address is missing", async () => {
			// register admin
			const userData = {
				firstName: "admin",
				lastName: "admin",
				email: "admin@admin.com",
				password: "Test@1190",
				role: Role.ADMIN,
			};

			await request(app).post("/auth/register").send(userData);

			// login admin
			const loginData = {
				email: userData.email,
				password: userData.password,
			};
			const loginResponse = await request(app)
				.post("/auth/login")
				.send(loginData);

			let accessToken = null;
			const cookies = ((loginResponse.headers as Headers)["set-cookie"] ||
				[]) as string[];

			cookies.forEach((cookie) => {
				if (cookie.startsWith("accessToken=")) {
					accessToken = cookie.split(";")[0].split("=")[1];
				}
			});

			const tenantData: typeof tenantsTable.$inferInsert = {
				name: "tenant name",
				address: "",
			};

			const response = await request(app)
				.post("/tenants")
				.send(tenantData)
				.set("Cookie", [`accessToken=${accessToken}`]);

			expect(response.status).toBe(400);
		});
	});
});
