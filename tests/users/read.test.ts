import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { sign } from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app.ts";
import { config } from "../../src/config";
import { Role } from "../../src/constants";
import { clearData, createManager, registerUser } from "../utils/http.ts";

describe("GET /users", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should list users without password fields", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"users-list-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);
		const { response: createResponse, userData } = await createManager(
			accessToken,
			"users-list-manager@example.com",
		);
		expect(createResponse.statusCode).toBe(201);

		const response = await request(app)
			.get("/users")
			.set("Cookie", [`accessToken=${accessToken}`]);
		const users = response.body as Array<{
			email?: string;
			password?: string;
		}>;
		const manager = users.find((user) => user.email === userData.email);

		expect(response.statusCode).toBe(200);
		expect(manager).toBeDefined();
		expect(manager?.password).toBeUndefined();
	});

	it("should forbid a non-admin user", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"users-customer@example.com",
			Role.CUSTOMER,
		);
		expect(registerResponse.statusCode).toBe(201);

		const response = await request(app)
			.get("/users")
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(403);
		expect(response.body.errors[0].message).toBe("Forbidden");
	});

	it("should reject an access token without a role", async () => {
		if (!config.PRIVATE_KEY) {
			throw new Error("PRIVATE_KEY must be configured for HTTP tests");
		}
		const accessToken = sign({ id: 1 }, config.PRIVATE_KEY, {
			algorithm: "RS256",
			expiresIn: "15m",
		});

		const response = await request(app)
			.get("/users")
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(401);
		expect(response.body.errors[0].message).toBe("Unauthorized");
	});
});

describe("GET /users/:id", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should return a user without the password field", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"users-get-admin@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);
		const { response: createResponse, userData } = await createManager(
			accessToken,
			"users-get-manager@example.com",
		);
		expect(createResponse.statusCode).toBe(201);

		const response = await request(app)
			.get(`/users/${createResponse.body.id}`)
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(200);
		expect(response.body.email).toBe(userData.email);
		expect(response.body.password).toBeUndefined();
	});
});
