import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import request from "supertest";
import app from "../../src/app.ts";
import db from "../../src/config/db.ts";
import { Role } from "../../src/constants";
import { usersTable } from "../../src/db/schema.ts";
import {
	type BootstrapAdminConfig,
	ensureBootstrapAdmin,
} from "../../src/service/AdminBootstrapService.ts";
import { clearData } from "../utils/http.ts";
import { getCookieValue } from "../utils/index.ts";

const ADMIN_EMAIL = "bootstrap-admin@example.com";
const ADMIN_PASSWORD = "BootstrapAdmin@1190";
const adminConfig = {
	email: ADMIN_EMAIL,
	password: ADMIN_PASSWORD,
	firstName: "Bootstrap",
	lastName: "Admin",
} satisfies BootstrapAdminConfig;

describe("Bootstrap admin", () => {
	beforeEach(clearData);
	afterEach(clearData);

	it("should create exactly one admin during concurrent startup", async () => {
		const results = await Promise.all([
			ensureBootstrapAdmin(adminConfig),
			ensureBootstrapAdmin(adminConfig),
			ensureBootstrapAdmin(adminConfig),
		]);
		const admins = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, ADMIN_EMAIL));
		const admin = admins[0];

		expect(admins).toHaveLength(1);
		expect(admin).toBeDefined();
		expect(results.filter((result) => result.created)).toHaveLength(1);
		if (!admin) {
			throw new Error("Expected bootstrap admin to exist");
		}
		expect(admin.role).toBe(Role.ADMIN);
		expect(await bcrypt.compare(ADMIN_PASSWORD, admin.password)).toBe(true);
	});

	it("should log in and create another admin through HTTP", async () => {
		await ensureBootstrapAdmin(adminConfig);
		const loginResponse = await request(app).post("/auth/login").send({
			email: adminConfig.email,
			password: adminConfig.password,
		});
		const accessToken = getCookieValue(loginResponse.headers, "accessToken");

		expect(loginResponse.statusCode).toBe(201);
		expect(accessToken).not.toBeNull();

		const createResponse = await request(app)
			.post("/users")
			.send({
				firstName: "Second",
				lastName: "Admin",
				email: "second-admin@example.com",
				password: "SecondAdmin@1190",
				role: Role.ADMIN,
			})
			.set("Cookie", [`accessToken=${accessToken}`]);
		const createdAdmin = await db
			.select()
			.from(usersTable)
			.where(eq(usersTable.email, "second-admin@example.com"));

		expect(createResponse.statusCode).toBe(201);
		expect(createdAdmin).toHaveLength(1);
		expect(createdAdmin[0]?.role).toBe(Role.ADMIN);
	});

	it("should refuse to promote an existing customer automatically", async () => {
		const registerResponse = await request(app).post("/auth/register").send({
			firstName: "Existing",
			lastName: "Customer",
			email: adminConfig.email,
			password: adminConfig.password,
		});
		expect(registerResponse.statusCode).toBe(201);

		await expect(ensureBootstrapAdmin(adminConfig)).rejects.toThrow(
			"refusing automatic privilege escalation",
		);
	});
});
