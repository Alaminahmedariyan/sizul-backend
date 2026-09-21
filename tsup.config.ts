import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/app.ts"],

	outDir: "dist",

	format: ["esm"],

	target: "es2023",

	clean: true,

	sourcemap: true,

	splitting: false,

	minify: false,

	bundle: true,

	skipNodeModulesBundle: true,

	noExternal: [],
});