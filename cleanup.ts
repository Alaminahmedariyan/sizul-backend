import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Deleting all auth data...\n");

  const sessions = await prisma.session.deleteMany({});
  console.log("Sessions deleted:", sessions.count);

  const accounts = await prisma.account.deleteMany({});
  console.log("Accounts deleted:", accounts.count);

  const twoFactors = await prisma.twoFactor.deleteMany({});
  console.log("TwoFactors deleted:", twoFactors.count);

  const users = await prisma.user.deleteMany({});
  console.log("Users deleted:", users.count);

  console.log("\n✅ All auth data cleared");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());