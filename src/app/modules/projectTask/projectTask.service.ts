import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { ProjectTask } from "../../../generated/prisma/client";
import { projectTaskQueryConfig } from "./projectTask.constant";
import { createNotification } from "../notification/notification.service";

type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "BLOCKED" | "COMPLETED" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type CreateTaskInput = {
	projectId: string;
	milestoneId?: string;
	assignedStaffId?: string;
	title: string;
	description?: string;
	priority: TaskPriority;
	dueDate?: Date;
};

type UpdateTaskInput = {
	milestoneId?: string | null;
	assignedStaffId?: string | null;
	title?: string;
	description?: string | null;
	priority?: TaskPriority;
	dueDate?: Date | null;
};

const taskDelegate = prisma.projectTask as unknown as PrismaDelegate<ProjectTask>;

const assertProjectExists = async (projectId: string) => {
	const project = await prisma.project.findUnique({ where: { id: projectId } });
	if (!project) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided projectId does not match any project.");
	}
};

// A task's milestone must belong to the same project — otherwise the task would
// show up under a milestone from an entirely different project.
const assertMilestoneBelongsToProject = async (milestoneId: string, projectId: string) => {
	const milestone = await prisma.projectMilestone.findUnique({ where: { id: milestoneId } });
	if (!milestone) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided milestoneId does not match any milestone.");
	}
	if (milestone.projectId !== projectId) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided milestone does not belong to this task's project.");
	}
};

const assertStaffExists = async (staffId: string) => {
	const staff = await prisma.staff.findUnique({ where: { id: staffId } });
	if (!staff) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided assignedStaffId does not match any staff member.");
	}
};

const assertTaskExists = async (id: string) => {
	const task = await prisma.projectTask.findUnique({ where: { id } });
	if (!task) {
		throw new AppError(StatusCodes.NOT_FOUND, "Task not found.");
	}
	return task;
};

const notifyStaffOfTaskAssignment = async (staffId: string, taskId: string, title: string) => {
	try {
		const staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { userId: true } });
		if (staff?.userId) {
			await createNotification({
				userId: staff.userId,
				type: "TASK_ASSIGNED",
				entityType: "TASK",
				entityId: taskId,
				title: "New task assigned",
				message: `You've been assigned to: ${title}`,
			});
		}
	} catch (error) {
		console.error("[ProjectTask] Failed to notify assigned staff:", error);
	}
};

export const createTaskInDB = async (payload: CreateTaskInput) => {
	await assertProjectExists(payload.projectId);

	if (payload.milestoneId) {
		await assertMilestoneBelongsToProject(payload.milestoneId, payload.projectId);
	}
	if (payload.assignedStaffId) {
		await assertStaffExists(payload.assignedStaffId);
	}

	const task = await prisma.projectTask.create({ data: payload as Prisma.ProjectTaskUncheckedCreateInput });

	if (payload.assignedStaffId) {
		await notifyStaffOfTaskAssignment(payload.assignedStaffId, task.id, task.title);
	}

	return task;
};

export const getAllTasksFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<ProjectTask>(taskDelegate, projectTaskQueryConfig);
	return queryBuilder.execute(query);
};

export const getTaskByIdFromDB = async (id: string) => {
	const task = await prisma.projectTask.findUnique({
		where: { id },
		include: { project: true, milestone: true, assignedStaff: true },
	});

	if (!task) {
		throw new AppError(StatusCodes.NOT_FOUND, "Task not found.");
	}

	return task;
};

export const updateTaskInDB = async (id: string, payload: UpdateTaskInput) => {
	const existing = await assertTaskExists(id);

	if (payload.milestoneId) {
		await assertMilestoneBelongsToProject(payload.milestoneId, existing.projectId);
	}
	if (payload.assignedStaffId) {
		await assertStaffExists(payload.assignedStaffId);
	}

	const updated = await prisma.projectTask.update({ where: { id }, data: payload as Prisma.ProjectTaskUncheckedUpdateInput });

	if (payload.assignedStaffId && payload.assignedStaffId !== existing.assignedStaffId) {
		await notifyStaffOfTaskAssignment(payload.assignedStaffId, id, updated.title);
	}

	return updated;
};

export const updateTaskStatusInDB = async (id: string, status: TaskStatus) => {
	const existing = await assertTaskExists(id);

	const completedAt = status === "COMPLETED" ? new Date() : existing.status === "COMPLETED" ? null : existing.completedAt;

	return prisma.projectTask.update({ where: { id }, data: { status, completedAt } });
};

export const deleteTaskFromDB = async (id: string) => {
	await assertTaskExists(id);
	await prisma.projectTask.delete({ where: { id } });
};

// ------------------------------------------------------------------
// Scheduled job entry point — NOT called from any HTTP route. Wire this up to
// a cron runner (see src/jobs/notifyDueTasks.ts) to run once or twice a day.
// Notifies the assigned staff member once per task per day when its dueDate
// falls within the next 24 hours and it isn't already COMPLETED/CANCELLED.
// ------------------------------------------------------------------
export const notifyDueTasksInDB = async () => {
	const now = new Date();
	const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	const dueSoonTasks = await prisma.projectTask.findMany({
		where: {
			dueDate: { gte: now, lte: in24h },
			status: { notIn: ["COMPLETED", "CANCELLED"] },
			assignedStaffId: { not: null },
		},
		include: { assignedStaff: { select: { userId: true } } },
	});

	let notified = 0;

	for (const task of dueSoonTasks) {
		if (!task.assignedStaff?.userId) continue;

		const alreadyNotifiedToday = await prisma.notification.findFirst({
			where: {
				userId: task.assignedStaff.userId,
				type: "TASK_DUE",
				entityId: task.id,
				createdAt: { gte: startOfToday },
			},
		});
		if (alreadyNotifiedToday) continue;

		try {
			await createNotification({
				userId: task.assignedStaff.userId,
				type: "TASK_DUE",
				entityType: "TASK",
				entityId: task.id,
				title: "Task due soon",
				message: `"${task.title}" is due within 24 hours.`,
			});
			notified += 1;
		} catch (error) {
			console.error("[ProjectTask] Failed to send due-task notification:", error);
		}
	}

	return { checked: dueSoonTasks.length, notified };
};