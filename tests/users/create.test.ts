import { afterEach, beforeEach, describe, expect, it } from "bun:test";
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
});
