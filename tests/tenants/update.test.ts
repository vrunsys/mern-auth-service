import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { Role } from "../../src/constants/index.ts";
import {
	refreshTokensTable,
	tenantsTable,
	usersTable,
} from "../../src/db/schema.ts";

describe("PATCH /tenants/:id", () => {
	const clearUsers = async () => {
		await db.delete(usersTable);
		await db.delete(refreshTokensTable);
		await db.delete(tenantsTable);
	};

	beforeEach(clearUsers);
	afterEach(clearUsers);
	it("should return 200 OK", async () => {
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

		const updateResponse = await request(app)
			.patch(`/tenants/${response.body[0].id}`)
			.send({ name: "Varun Tenent", address: tenantData.address })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body[0].name).toBe("Varun Tenent");
		expect(updateResponse.body[0].address).toBe(tenantData.address);
	});

	it("should return 400 if name is missing", async () => {
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

		const updateResponse = await request(app)
			.patch(`/tenants/${response.body[0].id}`)
			.send({ name: "", address: tenantData.address })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(updateResponse.status).toBe(400);
	});

	it("should return 400 if address is missing", async () => {
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

		const updateResponse = await request(app)
			.patch(`/tenants/${response.body[0].id}`)
			.send({ name: "Varun Tenent", address: "" })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(updateResponse.status).toBe(400);
	});
});
