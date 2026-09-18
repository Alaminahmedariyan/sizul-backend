import "dotenv/config";

import { projectTaskService } from "../app/modules/projectTask/projectTask.service";
import { prisma } from "../lib/prisma";

// Standalone script — run this on a schedule (cron, Vercel Cron, a hosting
// platform's "scheduled job" feature, or node-cron if you'd rather keep the
// scheduler inside the app itself). Example crontab entry (twice a day):
//   0 9,18 * * *  cd /path/to/project && npm run notify:due-tasks
async function main() {
	const result = await projectTaskService.notifyDueTasksInDB();
	console.log(`[notifyDueTasks] Checked ${result.checked} due-soon task(s), sent ${result.notified} notification(s).`);
}

main()
	.catch((error) => {
		console.error("[notifyDueTasks] Failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});