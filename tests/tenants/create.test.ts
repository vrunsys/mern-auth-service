import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { tenantsTable } from "../../src/db/schema.ts";
import { clearData, registerUser } from "../utils/http.ts";

describe("POST /tenants", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should return 201 for an authenticated admin", async () => {
		const { response: loginResponse, accessToken } = await registerUser(
			"tenant-create-admin@example.com",
		);
		expect(loginResponse.statusCode).toBe(201);

		const response = await request(app)
			.post("/tenants")
			.send({ name: "tenant name", address: "tenant address" })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(201);
	});

	it("should persist the tenant", async () => {
		const { accessToken } = await registerUser(
			"tenant-persist-admin@example.com",
		);
		const tenantData = { name: "tenant name", address: "tenant address" };

		const response = await request(app)
			.post("/tenants")
			.send(tenantData)
			.set("Cookie", [`accessToken=${accessToken}`]);
		const tenants = await db.select().from(tenantsTable);

		expect(response.statusCode).toBe(201);
		expect(tenants).toHaveLength(1);
		expect(tenants[0]).toMatchObject(tenantData);
	});

	it("should return 401 when unauthenticated", async () => {
		const response = await request(app)
			.post("/tenants")
			.send({ name: "tenant name", address: "tenant address" });

		expect(response.statusCode).toBe(401);
	});

	it("should return 400 when name is missing", async () => {
		const { accessToken } = await registerUser("tenant-name-admin@example.com");
		const response = await request(app)
			.post("/tenants")
			.send({ name: "", address: "tenant address" })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(400);
	});

	it("should return 400 when address is missing", async () => {
		const { accessToken } = await registerUser(
			"tenant-address-admin@example.com",
		);
		const response = await request(app)
			.post("/tenants")
			.send({ name: "tenant name", address: "" })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(400);
	});
});
