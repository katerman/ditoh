import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface DitohConfig {
	scripts: Record<string, string>;
}

// get the current path of the called file
const subPackagePath = process.cwd();
const shouldLog = process.argv.includes("--debug");

// Resolve upward until we find one
const getDitohConfig = (): DitohConfig | null => {
	let currentPath = subPackagePath;
	while (true) {
		const configPath = path.resolve(currentPath, "ditoh.config.json");
		if (shouldLog) {
			console.log("[Ditoh]: Checking for ditoh.config.json at:", configPath);
		}
		if (fs.existsSync(configPath)) {
			try {
				const configFile = fs.readFileSync(configPath, "utf-8");
				if (shouldLog) {
					console.log("[Ditoh]: Found ditoh.config.json at:", configPath);
					console.log("[Ditoh]: Config:", configFile);
				}
				return JSON.parse(configFile) as DitohConfig;
			} catch (e) {
				console.error(
					"[Ditoh]: Error reading or parsing ditoh.config.json:",
					e,
				);
				return null;
			}
		}
		const parentPath = path.dirname(currentPath);
		if (parentPath === currentPath) {
			break;
		}
		currentPath = parentPath;
	}
	return null;
};

export default function ditoh() {
	const config = getDitohConfig();
	const script = process.argv[2];

	if (!config) {
		console.warn("[Ditoh] 🚨 No ditoh.config.json found");
		process.exit(1);
	}

	if (script) {
		const command = config?.scripts[script];

		console.log(`[Ditoh] Running command: '${command}'`);

		if (command) {
			execSync(command, { stdio: "inherit", cwd: subPackagePath });
		} else {
			console.warn(`[Ditoh] ${script} not found in ditoh.config.json`);
			process.exit(1);
		}
	} else {
		console.warn(`[Ditoh] ${script} not found in ditoh.config.json`);
		process.exit(1);
	}
}

// Dont run in a test environment
if (process.env.NODE_ENV !== "test") {
	ditoh();
}
