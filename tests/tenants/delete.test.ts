import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import { clearData, createTenant, registerUser } from "../utils/http.ts";

describe("DELETE /tenants/:id", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should delete a tenant", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"tenants-delete-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);
		const createResponse = await createTenant(
			accessToken,
			"Delete tenant",
			"Delete address",
		);
		expect(createResponse.statusCode).toBe(201);

		const response = await request(app)
			.delete(`/tenants/${createResponse.body[0].id}`)
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(204);
		expect(response.body).toEqual({});
	});
});
