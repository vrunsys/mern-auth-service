import { describe, expect, it, mock } from "bun:test";
import {
	handleStartupFailure,
	type ServerDependencies,
	startServer,
} from "../src/server.ts";

const adminConfig = {
	email: "admin@example.com",
	password: "AdminPassword@1190",
};

describe("Server startup", () => {
	it("should initialize the admin before listening", async () => {
		const events: string[] = [];
		const dependencies: ServerDependencies = {
			adminConfig,
			ensureAdmin: mock(async () => {
				events.push("admin");
				return { created: true, id: 1 };
			}),
			exit: mock(() => {}),
			listen: mock((_port, onListening) => {
				events.push("listen");
				onListening();
				return { on: mock(() => {}) };
			}),
			log: {
				error: mock(() => {}),
				info: mock(() => {}),
			},
			port: "4000",
		};

		await startServer(dependencies);

		expect(events).toEqual(["admin", "listen"]);
		expect(dependencies.ensureAdmin).toHaveBeenCalledWith(adminConfig);
		expect(dependencies.listen).toHaveBeenCalledTimes(1);
	});

	it("should report listener errors and exit", async () => {
		let errorListener: ((error: Error) => void) | undefined;
		const error = mock(() => {});
		const exit = mock(() => {});
		const dependencies: ServerDependencies = {
			adminConfig,
			ensureAdmin: mock(async () => ({ created: false, id: 1 })),
			exit,
			listen: mock((_port, onListening) => {
				onListening();
				return {
					on: mock((_event, listener) => {
						errorListener = listener;
					}),
				};
			}),
			log: { error, info: mock(() => {}) },
			port: "4000",
		};

		await startServer(dependencies);
		errorListener?.(new Error("Address in use"));

		expect(error).toHaveBeenCalledWith("Server failed", {
			errorMessage: "Address in use",
		});
		expect(exit).toHaveBeenCalledWith(1);
	});

	it("should report fatal startup failures", () => {
		const error = mock(() => {});
		const exit = mock(() => {});

		handleStartupFailure(
			new Error("Missing admin credentials"),
			{ error },
			exit,
		);

		expect(error).toHaveBeenCalledWith("Application startup failed", {
			errorMessage: "Missing admin credentials",
		});
		expect(exit).toHaveBeenCalledWith(1);
	});
});
