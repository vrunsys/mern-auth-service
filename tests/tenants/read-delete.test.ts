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
import { getCookieValue } from "../utils/index.ts";

describe("Tenant read and delete routes", () => {
	const clearData = async () => {
		await db.delete(refreshTokensTable);
		await db.delete(usersTable);
		await db.delete(tenantsTable);
	};

	const registerAndLoginAdmin = async () => {
		const userData = {
			firstName: "Tenant",
			lastName: "Admin",
			email: "tenant-admin@example.com",
			password: "Test@1190",
			role: Role.ADMIN,
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

		return getCookieValue(loginResponse.headers, "accessToken");
	};

	const createTenant = async (
		accessToken: string | null,
		name: string,
		address: string,
	) => {
		const response = await request(app)
			.post("/tenants")
			.send({ name, address })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(201);
		return response.body[0] as { id: number; name: string; address: string };
	};

	beforeEach(clearData);
	afterEach(clearData);

	it("should return all tenants", async () => {
		const accessToken = await registerAndLoginAdmin();
		await createTenant(accessToken, "North tenant", "North address");
		await createTenant(accessToken, "South tenant", "South address");

		const response = await request(app)
			.get("/tenants")
			.set("Cookie", [`accessToken=${accessToken}`]);
		const tenants = response.body as Array<{ name?: string }>;

		expect(response.statusCode).toBe(200);
		expect(tenants.some((tenant) => tenant.name === "North tenant")).toBe(true);
		expect(tenants.some((tenant) => tenant.name === "South tenant")).toBe(true);
	});

	it("should return tenant by id", async () => {
		const accessToken = await registerAndLoginAdmin();
		const tenant = await createTenant(
			accessToken,
			"Lookup tenant",
			"Lookup address",
		);

		const response = await request(app)
			.get(`/tenants/${tenant.id}`)
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(200);
		expect(response.body[0].id).toBe(tenant.id);
		expect(response.body[0].name).toBe("Lookup tenant");
		expect(response.body[0].address).toBe("Lookup address");
	});

	it("should delete tenant by id", async () => {
		const accessToken = await registerAndLoginAdmin();
		const tenant = await createTenant(
			accessToken,
			"Delete tenant",
			"Delete address",
		);

		const response = await request(app)
			.delete(`/tenants/${tenant.id}`)
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(204);
		expect(response.body).toEqual({});
	});
});
