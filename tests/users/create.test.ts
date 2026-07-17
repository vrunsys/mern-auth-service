import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import { clearData, createManager, registerUser } from "../utils/http.ts";

describe("POST /users", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should allow an admin to create a manager user", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"users-create-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);

		const { response } = await createManager(accessToken);

		expect(response.statusCode).toBe(201);
		expect(response.body.id).toBeNumber();
	});

	it("should reject unsupported roles", async () => {
		const { response: loginResponse, accessToken } = await registerUser(
			"users-role-admin@example.com",
		);
		expect(loginResponse.statusCode).toBe(201);

		const invalidRoleResponse = await request(app)
			.post("/users")
			.send({
				firstName: "Invalid",
				lastName: "Role",
				email: "invalid-role@example.com",
				password: "password123",
				role: "owner",
			})
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(invalidRoleResponse.statusCode).toBe(400);
	});
});
