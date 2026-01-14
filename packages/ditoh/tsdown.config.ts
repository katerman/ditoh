import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	outDir: "dist",
	outExtensions: () => ({
		dts: ".d.ts",
		js: ".esm.js",
	}),
	format: "esm",
	sourcemap: true,
	clean: true,
});
