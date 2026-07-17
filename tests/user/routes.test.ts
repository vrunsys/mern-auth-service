import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { Role } from "../../src/constants";
import {
	refreshTokensTable,
	tenantsTable,
	usersTable,
} from "../../src/db/schema.ts";
import { getCookieValue } from "../utils/index.ts";

describe("User routes", () => {
	const clearData = async () => {
		await db.delete(refreshTokensTable);
		await db.delete(usersTable);
		await db.delete(tenantsTable);
	};

	const registerAndLogin = async (
		email: string,
		role = Role.ADMIN,
		password = "Test@1190",
	) => {
		const userData = {
			firstName: "Route",
			lastName: "Admin",
			email,
			password,
			role,
		};

		const registerResponse = await request(app)
			.post("/auth/register")
			.send(userData);
		expect(registerResponse.statusCode).toBe(201);

		const loginResponse = await request(app).post("/auth/login").send({
			email,
			password,
		});
		expect(loginResponse.statusCode).toBe(201);

		return getCookieValue(loginResponse.headers, "accessToken");
	};

	const createManager = async (accessToken: string | null) => {
		const managerData = {
			firstName: "Manager",
			lastName: "User",
			email: "manager@example.com",
			password: "password123",
		};

		const response = await request(app)
			.post("/users")
			.send(managerData)
			.set("Cookie", [`accessToken=${accessToken}`]);

		return { response, managerData };
	};

	beforeEach(clearData);
	afterEach(clearData);

	it("should allow admins to create manager users", async () => {
		const accessToken = await registerAndLogin("admin-create@example.com");
		const { response } = await createManager(accessToken);

		expect(response.statusCode).toBe(201);
		expect(response.body.id).not.toBeNull();
	});

	it("should list users without returning password fields", async () => {
		const accessToken = await registerAndLogin("admin-list@example.com");
		const { managerData } = await createManager(accessToken);

		const response = await request(app)
			.get("/users")
			.set("Cookie", [`accessToken=${accessToken}`]);
		const users = response.body as Array<{
			email?: string;
			password?: string;
		}>;
		const manager = users.find((user) => user.email === managerData.email);

		expect(response.statusCode).toBe(200);
		expect(manager).toBeDefined();
		expect(manager?.password).toBeUndefined();
	});

	it("should return a user by id", async () => {
		const accessToken = await registerAndLogin("admin-get@example.com");
		const { response: createResponse, managerData } =
			await createManager(accessToken);

		const response = await request(app)
			.get(`/users/${createResponse.body.id}`)
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(200);
		expect(response.body.email).toBe(managerData.email);
		expect(response.body.password).toBeUndefined();
	});

	it("should update users by id", async () => {
		const accessToken = await registerAndLogin("admin-update@example.com");
		const { response: createResponse } = await createManager(accessToken);

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

	it("should return 400 when updating with an invalid user id", async () => {
		const accessToken = await registerAndLogin(
			"admin-invalid-update@example.com",
		);

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

	it("should delete users by id", async () => {
		const accessToken = await registerAndLogin("admin-delete@example.com");
		const { response: createResponse } = await createManager(accessToken);

		const response = await request(app)
			.delete(`/users/${createResponse.body.id}`)
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(200);
		expect(response.body).toEqual({ message: "User deleted" });
	});

	it("should return 400 when deleting with an invalid user id", async () => {
		const accessToken = await registerAndLogin(
			"admin-invalid-delete@example.com",
		);

		const response = await request(app)
			.delete("/users/not-a-number")
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(400);
		expect(response.body.errors[0].message).toBe("Invalid user id");
	});

	it("should forbid non-admin users from listing users", async () => {
		const accessToken = await registerAndLogin(
			"customer-users@example.com",
			Role.CUSTOMER,
		);

		const response = await request(app)
			.get("/users")
			.set("Cookie", [`accessToken=${accessToken}`]);

		expect(response.statusCode).toBe(403);
		expect(response.body.errors[0].message).toBe("Forbidden");
	});
});
