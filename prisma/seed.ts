import "dotenv/config";

import config from "../src/app/config";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

async function seedSuperAdmin() {
	console.log("🌱 Seeding super admin...");

	// 1. Validate config
	if (!config.superAdmin.email || !config.superAdmin.password) {
		throw new Error(
			"❌ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env"
		);
	}

	// 2. Check if already exists
	const existing = await prisma.user.findUnique({
		where: { email: config.superAdmin.email },
	});

	if (existing) {
		if (existing.role !== "ADMIN") {
			await prisma.user.update({
				where: { id: existing.id },
				data: { role: "ADMIN", emailVerified: true },
			});
			console.log(`✅ Existing user promoted to ADMIN: ${existing.email}`);
		} else {
			console.log(`✅ Admin already exists: ${existing.email}`);
		}

		// Verify credential account exists
		const account = await prisma.account.findFirst({
			where: { userId: existing.id, providerId: "credential" },
		});

		if (!account || !account.password) {
			console.warn(
				"⚠️  Existing user has NO credential account. Password login may fail."
			);
		}

		return;
	}

	// 3. Sign up via Better Auth (creates User + credential Account)
	await auth.api.signUpEmail({
		body: {
			name: config.superAdmin.name ?? "Super Admin",
			email: config.superAdmin.email,
			password: config.superAdmin.password,
		},
	});

	// 4. Promote to ADMIN + mark email verified
	const updated = await prisma.user.update({
		where: { email: config.superAdmin.email },
		data: { role: "ADMIN", emailVerified: true },
	});

	// 5. Verify credential account was created
	const account = await prisma.account.findFirst({
		where: { userId: updated.id, providerId: "credential" },
	});

	if (!account || !account.password) {
		console.warn(
			"⚠️  User created but credential account missing. Password login may not work."
		);
		console.log("   Fix: run cleanup.ts then seed again, or check auth config.");
	} else {
		console.log("✅ Credential account created with password");
	}

	console.log(`✅ Admin created: ${updated.email} (role: ${updated.role})`);
	console.log(`📧 Email:    ${config.superAdmin.email}`);
	console.log(`🔑 Password: ${config.superAdmin.password}`);
}

async function main() {
	console.log("🌱 Starting database seed...");
	await seedSuperAdmin();
	console.log("🎉 Seed completed.");
}

main()
	.catch((error) => {
		console.error("❌ Seed failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});