import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

import config from "../app/config";

const adapter = new PrismaPg({
	connectionString: config.database.url,
});

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
	});

if (config.app.env !== "production") {
	globalForPrisma.prisma = prisma;
}