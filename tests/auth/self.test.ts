import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import { clearData, registerUser } from "../utils/http.ts";

describe("GET /auth/self", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should return the current user with an access-token cookie", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"self-cookie@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);
		expect(accessToken).not.toBeNull();

		const response = await request(app)
			.get("/auth/self")
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(200);
		expect(response.body.email).toBe("self-cookie@example.com");
	});

	it("should return the current user with a bearer token", async () => {
		const { response: registerResponse, accessToken } = await registerUser(
			"self-bearer@example.com",
		);
		expect(registerResponse.statusCode).toBe(201);
		expect(accessToken).not.toBeNull();

		const response = await request(app)
			.get("/auth/self")
			.set("Authorization", `Bearer ${accessToken}`);

		expect(response.statusCode).toBe(200);
		expect(response.body.email).toBe("self-bearer@example.com");
	});
});
