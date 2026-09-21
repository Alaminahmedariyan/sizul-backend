import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["api/index.ts"],
	outDir: "api",
	format: ["esm"],
	target: "es2023",
	clean: false,
	sourcemap: true,
	splitting: false,
	minify: false,
	bundle: true,
	skipNodeModulesBundle: true,
	noExternal: [],
	esbuildOptions(options) {
		options.resolveExtensions = [".ts", ".js", ".json"];
	},
});