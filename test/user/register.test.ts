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
				password: "Borravarun@1190",
			};
			const response = await request(app).post("/auth/register").send(userData);
			expect(response.statusCode).toBe(201);
		});

		it("should return the valid json response", async () => {
			const userData = {
				firstName: "Rakesh",
				lastName: "k",
				email: "rakesh@gmail.com",
				password: "Borravarun@1190",
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
				password: "Borravarun@1190",
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
				password: "Borravarun@1190",
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
				password: "Borravarun@1190",
			};
			const response = await request(app).post("/auth/register").send(userData);
			const users = await db.select().from(usersTable);
			expect(users).toHaveLength(1);
			expect(users[0]?.role).toEqual(Role.CUSTOMER);
		});

		it("should return hashed password of the user", async () => {
			const userData = {
				firstName: "Rakesh",
				lastName: "k",
				role: Role.CUSTOMER,
				email: "rakesh@gmail.com",
				password: "Borravarun@1190",
			};
			const response = await request(app).post("/auth/register").send(userData);
			const users = await db.select().from(usersTable);
			expect(users).toHaveLength(1);
			expect(users[0]?.password).not.toBe(userData.password);
		});

		it("should return 400 if email already exists", async () => {
			const userData = {
				firstName: "Rakesh",
				lastName: "k",
				role: Role.CUSTOMER,
				email: "rakesh@gmail.com",
				password: "Borravarun@1190",
			};
			await request(app).post("/auth/register").send(userData);
			const response = await request(app).post("/auth/register").send(userData);
			expect(response.statusCode).toBe(400);
		});
	});
	describe("Fields are missing", () => {});
	describe("Fields are not in proper format", () => {
		it("should trim the email field", async () => {
			// Arrange
			const userData = {
				firstName: "Rakesh",
				lastName: "K",
				email: " rakesh@mern.space ",
				password: "password",
			};
			// Act
			await request(app).post("/auth/register").send(userData);

			// Assert
			const users = await db.select().from(usersTable);
			const user = users[0];
			expect(user.email).toBe("rakesh@mern.space");
		});
		it("should return 400 status code if email is not a valid email", async () => {
			// Arrange
			const userData = {
				firstName: "Rakesh",
				lastName: "K",
				email: "rakesh_mern.space", // Invalid email
				password: "password",
			};
			// Act
			const response = await request(app).post("/auth/register").send(userData);

			// Assert
			expect(response.statusCode).toBe(400);
			const users = await db.select().from(usersTable);
			expect(users).toHaveLength(0);
		});
		it("should return 400 status code if password length is less than 8 chars", async () => {
			// Arrange
			const userData = {
				firstName: "Rakesh",
				lastName: "K",
				email: "rakesh@mern.space",
				password: "pass", // less than 8 chars
			};
			// Act
			const response = await request(app).post("/auth/register").send(userData);

			// Assert
			expect(response.statusCode).toBe(400);
			const users = await db.select().from(usersTable);
			expect(users).toHaveLength(0);
		});
		it("shoud return an array of error messages if email is missing", async () => {
			// Arrange
			const userData = {
				firstName: "Rakesh",
				lastName: "K",
				email: "",
				password: "password",
			};
			// Act
			const response = await request(app).post("/auth/register").send(userData);

			// Assert
			expect(response.body).toHaveProperty("errors");
			expect(
				(response.body as Record<string, string>).errors.length,
			).toBeGreaterThan(0);
		});
	});
});
