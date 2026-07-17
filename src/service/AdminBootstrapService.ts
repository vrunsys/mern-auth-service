import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import db from "../config/db.ts";
import { Role } from "../constants/index.ts";
import { usersTable } from "../db/schema.ts";

const BCRYPT_ROUNDS = 12;
const MINIMUM_PASSWORD_LENGTH = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface BootstrapAdminConfig {
	email?: string;
	password?: string;
	firstName?: string;
	lastName?: string;
}

export interface BootstrapAdminResult {
	created: boolean;
	id: number;
}

const validateConfig = (adminConfig: BootstrapAdminConfig) => {
	const email = adminConfig.email?.trim().toLowerCase();
	const password = adminConfig.password;
	const firstName = adminConfig.firstName?.trim() || "System";
	const lastName = adminConfig.lastName?.trim() || "Administrator";

	if (!email || !password) {
		throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured");
	}
	if (!EMAIL_PATTERN.test(email)) {
		throw new Error("ADMIN_EMAIL must be a valid email address");
	}
	if (password.length < MINIMUM_PASSWORD_LENGTH) {
		throw new Error(
			`ADMIN_PASSWORD must be at least ${MINIMUM_PASSWORD_LENGTH} characters`,
		);
	}

	return { email, password, firstName, lastName };
};

const findUserByEmail = async (email: string) => {
	const users = await db
		.select({ id: usersTable.id, role: usersTable.role })
		.from(usersTable)
		.where(eq(usersTable.email, email))
		.limit(1);

	return users[0];
};

const ensureAdminRole = (
	user: { id: number; role: string } | undefined,
): BootstrapAdminResult => {
	if (!user) {
		throw new Error("Bootstrap admin could not be created or loaded");
	}
	if (user.role !== Role.ADMIN) {
		throw new Error(
			"ADMIN_EMAIL belongs to a non-admin account; refusing automatic privilege escalation",
		);
	}

	return { created: false, id: user.id };
};

export const ensureBootstrapAdmin = async (
	adminConfig: BootstrapAdminConfig,
): Promise<BootstrapAdminResult> => {
	const { email, password, firstName, lastName } = validateConfig(adminConfig);
	const existingUser = await findUserByEmail(email);

	if (existingUser) {
		return ensureAdminRole(existingUser);
	}

	const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
	const insertedUsers = await db
		.insert(usersTable)
		.values({
			firstName,
			lastName,
			email,
			password: hashedPassword,
			role: Role.ADMIN,
		})
		.onConflictDoNothing({ target: usersTable.email })
		.returning({ id: usersTable.id });

	if (insertedUsers[0]) {
		return { created: true, id: insertedUsers[0].id };
	}

	return ensureAdminRole(await findUserByEmail(email));
};
