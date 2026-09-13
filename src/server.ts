import type { Server } from "node:http";

import app from "./app";
import config from "./app/config";
import { prisma } from "./lib/prisma";

const PORT = config.app.port;

let server: Server;

async function main() {
	try {
		await prisma.$connect();
		console.log("Connected to the database successfully.");

		server = app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
}

const shutdown = async (signal: string) => {
	console.log(`\n${signal} received. Shutting down gracefully...`);

	server?.close(async () => {
		await prisma.$disconnect();
		console.log("Server closed, database disconnected.");
		process.exit(0);
	});

	setTimeout(() => {
		console.error("Forced shutdown after timeout.");
		process.exit(1);
	}, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
	console.error("Unhandled Rejection:", reason);
	shutdown("unhandledRejection");
});
process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
	shutdown("uncaughtException");
});

main();