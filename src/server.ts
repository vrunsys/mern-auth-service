import app from "./app";
import { config } from "./config";
import logger from "./config/logger";
import {
	type BootstrapAdminConfig,
	type BootstrapAdminResult,
	ensureBootstrapAdmin,
} from "./service/AdminBootstrapService.ts";

interface ServerHandle {
	on(event: "error", listener: (error: Error) => void): unknown;
}

interface StartupLogger {
	error(message: string, metadata?: Record<string, unknown>): unknown;
	info(message: string, metadata?: Record<string, unknown>): unknown;
}

export interface ServerDependencies {
	adminConfig: BootstrapAdminConfig;
	ensureAdmin(adminConfig: BootstrapAdminConfig): Promise<BootstrapAdminResult>;
	exit(code: number): void;
	listen(port: string | undefined, onListening: () => void): ServerHandle;
	log: StartupLogger;
	port: string | undefined;
}

const defaultDependencies: ServerDependencies = {
	adminConfig: {
		email: config.ADMIN_EMAIL,
		password: config.ADMIN_PASSWORD,
		firstName: config.ADMIN_FIRST_NAME,
		lastName: config.ADMIN_LAST_NAME,
	},
	ensureAdmin: ensureBootstrapAdmin,
	exit: process.exit,
	listen: (port, onListening) => app.listen(port, onListening),
	log: logger,
	port: config.PORT,
};

export const startServer = async (
	dependencies: ServerDependencies = defaultDependencies,
) => {
	const admin = await dependencies.ensureAdmin(dependencies.adminConfig);

	dependencies.log.info(
		admin.created
			? "Bootstrap admin created"
			: "Bootstrap admin already exists",
		{ id: admin.id },
	);

	const server = dependencies.listen(dependencies.port, () => {
		dependencies.log.info(`Server is running on port ${dependencies.port}`);
	});
	server.on("error", (error) => {
		dependencies.log.error("Server failed", { errorMessage: error.message });
		dependencies.exit(1);
	});
};

export const handleStartupFailure = (
	error: unknown,
	log: Pick<StartupLogger, "error"> = logger,
	exit: (code: number) => void = process.exit,
) => {
	log.error("Application startup failed", {
		errorMessage: error instanceof Error ? error.message : String(error),
	});
	exit(1);
};

if (import.meta.main) {
	startServer().catch(handleStartupFailure);
}
