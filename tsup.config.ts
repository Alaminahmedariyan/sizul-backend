import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/server.ts"],
	outDir: "dist",
	format: ["esm", "cjs"],
	target: "esnext",
	clean: true,
	sourcemap: true,
	splitting: false,
	minify: false,
	bundle: true,
	banner: {
		js: `import { createRequire } from "module";
		const require = createRequire(import.meta.url);`,
	}
});