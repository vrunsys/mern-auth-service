const isProduction = process.env.NODE_ENV === "production";
const isDockerBuild = process.env.HUSKY === "0";

if (isProduction || isDockerBuild) {
	// biome-ignore lint/suspicious/noConsole: Skipping Husky installation
	console.log("Skipping Husky installation");
	process.exit(0);
}

const processResult = Bun.spawnSync(["bunx", "husky"], {
	stdout: "inherit",
	stderr: "inherit",
});

process.exit(processResult.exitCode);
