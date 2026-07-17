import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import { Role } from "../../src/constants";
import { clearData, registerUser } from "../utils/http.ts";
import { getCookieValue, isJwt } from "../utils/index.ts";

describe("POST /auth/refresh", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should rotate the refresh token and return new auth cookies", async () => {
		const { response: registerResponse, refreshToken } = await registerUser(
			"refresh@example.com",
			Role.CUSTOMER,
		);
		expect(registerResponse.statusCode).toBe(201);
		expect(refreshToken).not.toBeNull();

		const response = await request(app)
			.post("/auth/refresh")
			.set("Cookie", [`refreshToken=${refreshToken}`]);
		const accessToken = getCookieValue(response.headers, "accessToken");
		const rotatedRefreshToken = getCookieValue(
			response.headers,
			"refreshToken",
		);

		expect(response.statusCode).toBe(201);
		expect(response.body.id).toBeNumber();
		expect(isJwt(accessToken)).toBeTruthy();
		expect(isJwt(rotatedRefreshToken)).toBeTruthy();
	});
});
