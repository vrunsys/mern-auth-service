import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import { clearData, createTenant, registerUser } from "../utils/http.ts";

describe("PATCH /tenants/:id", () => {
	beforeEach(clearData);
	afterEach(clearData);

	const arrangeTenant = async (email: string) => {
		const { accessToken } = await registerUser(email);
		const createResponse = await createTenant(
			accessToken,
			"tenant name",
			"tenant address",
		);
		expect(createResponse.statusCode).toBe(201);

		return { accessToken, tenant: createResponse.body[0] };
	};

	it("should update a tenant", async () => {
		const { accessToken, tenant } = await arrangeTenant(
			"tenant-update-admin@example.com",
		);
		const response = await request(app)
			.patch(`/tenants/${tenant.id}`)
			.send({ name: "Updated tenant", address: tenant.address })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(200);
		expect(response.body[0].name).toBe("Updated tenant");
		expect(response.body[0].address).toBe(tenant.address);
	});

	it("should return 400 when name is missing", async () => {
		const { accessToken, tenant } = await arrangeTenant(
			"tenant-update-name-admin@example.com",
		);
		const response = await request(app)
			.patch(`/tenants/${tenant.id}`)
			.send({ name: "", address: tenant.address })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(400);
	});

	it("should return 400 when address is missing", async () => {
		const { accessToken, tenant } = await arrangeTenant(
			"tenant-update-address-admin@example.com",
		);
		const response = await request(app)
			.patch(`/tenants/${tenant.id}`)
			.send({ name: "Updated tenant", address: "" })
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(400);
	});
});
