import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { Role } from "../../src/constants";
import { usersTable } from "../../src/db/schema.ts";

describe("POST auth/register", () => {
	const clearUsers = async () => {
		await db.delete(usersTable);
	};

	beforeEach(clearUsers);
	afterEach(clearUsers);

	describe("Given all fields", () => {
		it("should return the 201 status code", async () => {
			const userData = {
				firstName: "Rakesh",
				lastName: "k",
				email: "rakesh@gmail.com",
				password: "secret",
			};
			const response = await request(app).post("/auth/register").send(userData);
			expect(response.statusCode).toBe(201);
		});

		it("should return the valid json response", async () => {
			const userData = {
				firstName: "Rakesh",
				lastName: "k",
				email: "rakesh@gmail.com",
				password: "secret",
			};
			const response = await request(app).post("/auth/register").send(userData);
			expect(response.headers["content-type"]).toEqual(
				expect.stringContaining("json"),
			);
		});

		it("should persist the user in the database", async () => {
			const userData = {
				firstName: "Rakesh",
				lastName: "k",
				email: "rakesh@gmail.com",
				password: "secret",
			};
			const response = await request(app).post("/auth/register").send(userData);
			const users = await db.select().from(usersTable);
			expect(users).toHaveLength(1);
			expect(users[0]?.firstName).toEqual(userData.firstName);
			expect(users[0]?.lastName).toEqual(userData.lastName);
			expect(users[0]?.email).toEqual(userData.email);
		});

		it("should return id of the created user", async () => {
			const userData = {
				firstName: "Rakesh",
				lastName: "k",
				email: "rakesh@gmail.com",
				password: "secret",
			};
			const response = await request(app).post("/auth/register").send(userData);
			const users = await db.select().from(usersTable);
			expect(users).toHaveLength(1);
			expect(users[0]?.id).not.toBeNull();
		});

		it("should return role of the user", async () => {
			const userData = {
				firstName: "Rakesh",
				lastName: "k",
				role: Role.CUSTOMER,
				email: "rakesh@gmail.com",
				password: "secret",
			};
			const response = await request(app).post("/auth/register").send(userData);
			const users = await db.select().from(usersTable);
			expect(users).toHaveLength(1);
			expect(users[0]?.role).toEqual(Role.CUSTOMER);
		});
	});
	describe("Fields are missing", () => {});
});
