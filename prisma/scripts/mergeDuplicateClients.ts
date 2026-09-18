import "dotenv/config";
import {prisma} from  "../../src/lib/prisma"

// One-off cleanup script — run this BEFORE applying the migration that adds
// `@unique` to Client.email, since Postgres will refuse to add a unique
// constraint while duplicate values still exist.
//
// Usage:  npx tsx prisma/scripts/mergeDuplicateClients.ts
//
// For each email with more than one Client row:
//  - The row with a non-null userId is kept as the "primary" (that's the one
//    the person actually logs in as). If none has a userId, the oldest row
//    is kept instead.
//  - Every duplicate's related records (Lead, Project, Proposal, ClientReview,
//    ClientAppreciation, Payment) are repointed to the primary's id.
//  - Any field the primary is missing (phone/company/website/location/notes)
//    is backfilled from the duplicates before they're deleted.
//  - If more than one row for the same email already has a userId set, that
//    email is skipped and printed as a warning — that needs a human decision,
//    not an automatic merge.

async function main() {
	console.log("🔍 Scanning for duplicate Client rows by email...\n");

	const clients = await prisma.client.findMany({ orderBy: { createdAt: "asc" } });

	const byEmail = new Map<string, typeof clients>();
	for (const client of clients) {
		const key = client.email.toLowerCase();
		const group = byEmail.get(key) ?? [];
		group.push(client);
		byEmail.set(key, group);
	}

	let mergedGroups = 0;
	let deletedRows = 0;
	let skippedGroups = 0;

	for (const [email, group] of byEmail) {
		if (group.length < 2) continue;

		const withUser = group.filter((c) => c.userId);
		if (withUser.length > 1) {
			console.warn(
				`⚠️  SKIPPING ${email}: ${withUser.length} Client rows already have a userId set — ` +
					`needs manual review. IDs: ${withUser.map((c) => c.id).join(", ")}`,
			);
			skippedGroups += 1;
			continue;
		}

		const primary = withUser[0] ?? group[0]!;
		const duplicates = group.filter((c) => c.id !== primary.id);

		console.log(`📧 ${email}: keeping ${primary.id} (userId: ${primary.userId ?? "none"}), merging ${duplicates.length} duplicate(s)`);

		// Accumulate any fields the primary is missing from the duplicates
		// up front, so a third+ duplicate doesn't get stale in-memory data.
		const filled = {
			email, // normalize casing on the surviving row too
			phone: primary.phone,
			company: primary.company,
			website: primary.website,
			location: primary.location,
			notes: primary.notes,
		};
		for (const dup of duplicates) {
			filled.phone ??= dup.phone;
			filled.company ??= dup.company;
			filled.website ??= dup.website;
			filled.location ??= dup.location;
			filled.notes ??= dup.notes;
		}

		await prisma.$transaction(async (tx) => {
			for (const dup of duplicates) {
				const [leads, projects, proposals, reviews, appreciations, payments] = await Promise.all([
					tx.lead.updateMany({ where: { clientId: dup.id }, data: { clientId: primary.id } }),
					tx.project.updateMany({ where: { clientId: dup.id }, data: { clientId: primary.id } }),
					tx.proposal.updateMany({ where: { clientId: dup.id }, data: { clientId: primary.id } }),
					tx.clientReview.updateMany({ where: { clientId: dup.id }, data: { clientId: primary.id } }),
					tx.clientAppreciation.updateMany({ where: { clientId: dup.id }, data: { clientId: primary.id } }),
					tx.payment.updateMany({ where: { clientId: dup.id }, data: { clientId: primary.id } }),
				]);

				console.log(
					`   ↳ repointed from ${dup.id}: ${leads.count} lead(s), ${projects.count} project(s), ` +
						`${proposals.count} proposal(s), ${reviews.count} review(s), ` +
						`${appreciations.count} appreciation(s), ${payments.count} payment(s)`,
				);

				await tx.client.delete({ where: { id: dup.id } });
				deletedRows += 1;
			}

			await tx.client.update({ where: { id: primary.id }, data: filled });
		});

		mergedGroups += 1;
		console.log("");
	}

	console.log(
		`✅ Done. Merged ${mergedGroups} duplicate group(s), deleted ${deletedRows} row(s), ` +
			`skipped ${skippedGroups} group(s) needing manual review.`,
	);

	if (skippedGroups > 0) {
		console.log(
			"\n⚠️  Re-run this script after manually resolving the skipped emails above " +
				"(decide which userId-linked row should stay, null out or delete the other).",
		);
	}
}

main()
	.catch((error) => {
		console.error("❌ Merge script failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});