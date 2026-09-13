import { prisma } from "./src/lib/prisma";

async function main() {
  const email = "alaminahmedariyan2025@gmail.com";

  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (!user) {
    console.log("❌ User not found:", email);
    return;
  }

  console.log("✅ User found");
  console.log("  id:", user.id);
  console.log("  email:", user.email);
  console.log("  role:", user.role);
  console.log("  emailVerified:", user.emailVerified);
  console.log("  passwordHash (User table):", user.passwordHash ? "SET" : "NULL");

  console.log("\n🔑 Accounts in DB:");
  if (user.accounts.length === 0) {
    console.log("  ❌ NO ACCOUNTS FOUND — this is the problem!");
  }

  for (const acc of user.accounts) {
    console.log({
      id: acc.id,
      providerId: acc.providerId,
      accountId: acc.accountId,
      hasPassword: Boolean(acc.password),
      passwordLength: acc.password?.length ?? 0,
      passwordPreview: acc.password?.substring(0, 40) ?? "(none)",
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());