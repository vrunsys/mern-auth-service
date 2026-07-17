import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import { clearData, createTenant, registerUser } from "../utils/http.ts";

describe("GET /tenants", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should return all tenants", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"tenants-list-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);
		expect(
			(await createTenant(accessToken, "North tenant", "North address"))
				.statusCode,
		).toBe(201);
		expect(
			(await createTenant(accessToken, "South tenant", "South address"))
				.statusCode,
		).toBe(201);

		const response = await request(app)
			.get("/tenants")
			.set("Cookie", [`accessToken=${accessToken}`]);
		const tenants = response.body as Array<{ name?: string }>;

		expect(response.statusCode).toBe(200);
		expect(tenants.some((tenant) => tenant.name === "North tenant")).toBe(true);
		expect(tenants.some((tenant) => tenant.name === "South tenant")).toBe(true);
	});
});

describe("GET /tenants/:id", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should return a tenant", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"tenants-get-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);
		const createResponse = await createTenant(
			accessToken,
			"Lookup tenant",
			"Lookup address",
		);
		expect(createResponse.statusCode).toBe(201);
		const tenant = createResponse.body[0] as {
			id: number;
			name: string;
			address: string;
		};

		const response = await request(app)
			.get(`/tenants/${tenant.id}`)
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(200);
		expect(response.body[0]).toMatchObject({
			id: tenant.id,
			name: "Lookup tenant",
			address: "Lookup address",
		});
	});
});
