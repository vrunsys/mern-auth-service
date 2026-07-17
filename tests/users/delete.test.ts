import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import { clearData, createManager, registerUser } from "../utils/http.ts";

describe("DELETE /users/:id", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should delete a user", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"users-delete-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);
		const { response: createResponse } = await createManager(
			accessToken,
			"users-delete-manager@example.com",
		);
		expect(createResponse.statusCode).toBe(201);

		const response = await request(app)
			.delete(`/users/${createResponse.body.id}`)
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({ message: "User deleted" });
	});

	it("should return 400 for an invalid user id", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"users-invalid-delete-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);

		const response = await request(app)
			.delete("/users/not-a-number")
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(400);
		expect(response.body.errors[0].message).toBe("Invalid user id");
	});
});
