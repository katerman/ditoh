/** biome-ignore-all lint/suspicious/noExplicitAny: For mocking */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";

// Mock dependent modules
vi.mock("node:fs");
vi.mock("node:child_process");

describe("ditoh", () => {
	const originalArgv = [...process.argv];

	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
		process.argv = [...originalArgv];
	});

	afterEach(() => {
		process.argv = originalArgv;
	});

	const loadDitoh = async () => {
		const module = await import("./index");
		return module.default;
	};

	it("should find config in current directory and run script", async () => {
		const cwd = process.cwd();
		const configPath = path.resolve(cwd, "ditoh.config.json");

		(fs.existsSync as Mock).mockImplementation((p) => p === configPath);
		(fs.readFileSync as Mock).mockImplementation((p) => {
			if (p === configPath) {
				return JSON.stringify({ scripts: { test: "echo 'success'" } });
			}
			return "";
		});

		process.argv = ["node", "ditoh", "test"];

		const ditoh = await loadDitoh();
		ditoh();

		expect(execSync).toHaveBeenCalledWith(
			"echo 'success'",
			expect.objectContaining({
				stdio: "inherit",
				cwd: cwd,
			}),
		);
	});

	it("should find config in parent directory and run script", async () => {
		const cwd = process.cwd();
		const parentDir = path.dirname(cwd);
		const configPath = path.resolve(parentDir, "ditoh.config.json");

		// Mock path resolution search
		(fs.existsSync as Mock).mockImplementation((p) => {
			return p === configPath;
		});

		(fs.readFileSync as Mock).mockImplementation((p) => {
			if (p === configPath) {
				return JSON.stringify({ scripts: { parent: "echo 'parent success'" } });
			}
			return "";
		});

		process.argv = ["node", "ditoh", "parent"];

		const ditoh = await loadDitoh();
		ditoh();

		expect(execSync).toHaveBeenCalledWith(
			"echo 'parent success'",
			expect.objectContaining({
				stdio: "inherit",
				cwd: cwd,
			}),
		);
	});

	it("should warn and exit if script not found in config", async () => {
		const cwd = process.cwd();
		const configPath = path.resolve(cwd, "ditoh.config.json");
		const consoleWarnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation(() => {});
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation((() => undefined) as any);

		(fs.existsSync as Mock).mockImplementation((p) => p === configPath);
		(fs.readFileSync as Mock).mockImplementation((p) => {
			if (p === configPath) {
				return JSON.stringify({ scripts: { other: "echo 'other'" } });
			}
			return "";
		});

		process.argv = ["node", "ditoh", "missing"];

		const ditoh = await loadDitoh();
		ditoh();

		expect(execSync).not.toHaveBeenCalled();
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"[Ditoh] missing not found in ditoh.config.json",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it("should warn and exit if config not found", async () => {
		const consoleWarnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation(() => {});
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation((() => undefined) as any);

		(fs.existsSync as Mock).mockReturnValue(false);

		process.argv = ["node", "ditoh", "test"];

		const ditoh = await loadDitoh();
		ditoh();

		expect(execSync).not.toHaveBeenCalled();
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"[Ditoh] test not found in ditoh.config.json",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it("should handle malformed config gracefully", async () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const consoleWarnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation(() => {});
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation((() => undefined) as any);

		(fs.existsSync as Mock).mockReturnValue(true);
		(fs.readFileSync as Mock).mockReturnValue("invalid json");

		process.argv = ["node", "ditoh", "test"];

		const ditoh = await loadDitoh();
		ditoh();

		expect(execSync).not.toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();
		// If malformed, getDitohConfig returns null.
		// Then command lookup fails (undefined).
		// So it should warn and exit.
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"[Ditoh] test not found in ditoh.config.json",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it("should log when --debug flag is present", async () => {
		const cwd = process.cwd();
		const configPath = path.resolve(cwd, "ditoh.config.json");
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		(fs.existsSync as Mock).mockReturnValue(true);
		(fs.readFileSync as Mock).mockReturnValue(
			JSON.stringify({ scripts: { test: "echo 'success'" } }),
		);

		process.argv = ["node", "ditoh", "test", "--debug"];

		const ditoh = await loadDitoh();
		ditoh();

		expect(consoleLogSpy).toHaveBeenCalledWith(
			"[Ditoh]: Checking for ditoh.config.json at:",
			configPath,
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"[Ditoh]: Found ditoh.config.json at:",
			configPath,
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"[Ditoh] Running command: 'echo 'success''",
		);
	});

	it("should warn and exit if no script provided", async () => {
		const consoleWarnSpy = vi
			.spyOn(console, "warn")
			.mockImplementation(() => {});
		const processExitSpy = vi
			.spyOn(process, "exit")
			.mockImplementation((() => undefined) as any);

		(fs.existsSync as Mock).mockReturnValue(true);
		(fs.readFileSync as Mock).mockReturnValue(JSON.stringify({ scripts: {} }));

		process.argv = ["node", "ditoh"]; // No script argument

		const ditoh = await loadDitoh();
		ditoh();

		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"[Ditoh] undefined not found in ditoh.config.json",
		);
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});
});
