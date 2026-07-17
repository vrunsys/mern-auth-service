import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import { Role } from "../../src/constants";
import { clearData, createManager, registerUser } from "../utils/http.ts";

describe("PATCH /users/:id", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should update a user", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"users-update-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);
		const { response: createResponse } = await createManager(
			accessToken,
			"users-update-manager@example.com",
		);
		expect(createResponse.statusCode).toBe(201);

		const response = await request(app)
			.patch(`/users/${createResponse.body.id}`)
			.send({
				firstName: "Updated",
				lastName: "Manager",
				role: Role.MANAGER,
			})
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(200);
		expect(response.body[0].firstName).toBe("Updated");
		expect(response.body[0].lastName).toBe("Manager");
		expect(response.body[0].role).toBe(Role.MANAGER);
		expect(response.body[0].password).toBeUndefined();
	});

	it("should return 400 for an invalid user id", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"users-invalid-update-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);

		const response = await request(app)
			.patch("/users/not-a-number")
			.send({
				firstName: "Updated",
				lastName: "Manager",
				role: Role.MANAGER,
			})
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(400);
		expect(response.body.errors[0].message).toBe("Invalid user id");
	});
});
