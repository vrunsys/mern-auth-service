import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import { clearData, registerUser } from "../utils/http.ts";

describe("POST /auth/logout", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should clear the authentication cookies", async () => {
		const { response: registerResponse, accessToken } =
			await registerUser("logout@example.com");
		expect(registerResponse.statusCode).toBe(201);
		expect(accessToken).not.toBeNull();

		const response = await request(app)
			.post("/auth/logout")
			.set("Cookie", [`accessToken=${accessToken}`]);
		const cookies = (response.headers["set-cookie"] || []) as string[];
		const clearCookieHeader = cookies.join("; ");

		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({ message: "logged out" });
		expect(clearCookieHeader).toContain("refreshToken=");
		expect(clearCookieHeader).toContain("accessToken=");
	});
});
