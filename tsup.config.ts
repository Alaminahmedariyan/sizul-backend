import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/server.ts"],
	outDir: "dist",
	format: ["esm"],
	target: "es2023",
	clean: true,
	sourcemap: true,
	splitting: false,
	minify: false,
	noExternal: [],
});