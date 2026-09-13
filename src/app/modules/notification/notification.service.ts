import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import type { Notification } from "../../../generated/prisma/client";
import { notificationQueryConfig } from "./notification.constant";

type NotificationType =
	| "LEAD_NEW" | "LEAD_ASSIGNED" | "LEAD_STATUS_CHANGED" | "PROPOSAL_SENT" | "PROPOSAL_ACCEPTED"
	| "PROPOSAL_REJECTED" | "PROJECT_UPDATE" | "TASK_ASSIGNED" | "TASK_DUE" | "CONSULTATION_SCHEDULED"
	| "MESSAGE_RECEIVED" | "REVIEW_RECEIVED" | "SEO_REPORT" | "SYSTEM";
type NotificationEntityType = "LEAD" | "PROPOSAL" | "PROJECT" | "TASK" | "CONSULTATION" | "MESSAGE" | "REVIEW" | "USER";

const notificationDelegate = prisma.notification as unknown as PrismaDelegate<Notification>;

// Exported for other modules' services to call directly (e.g. lead.service.ts
// notifying the assigned staff member) — this is the reusable building block,
// not just an HTTP-facing function.
export const createNotification = async (payload: {
	userId: string;
	type: NotificationType;
	entityType?: NotificationEntityType;
	entityId?: string;
	title: string;
	message: string;
}) => prisma.notification.create({ data: payload });

// Fan-out helper for events every Admin should see (new lead, new contact
// message, new review). Each Admin gets their own Notification row.
export const notifyAdmins = async (payload: {
	type: NotificationType;
	entityType?: NotificationEntityType;
	entityId?: string;
	title: string;
	message: string;
}) => {
	const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
	await Promise.all(admins.map((admin) => createNotification({ ...payload, userId: admin.id })));
};

export const createNotificationInDB = async (payload: {
	userId: string;
	type: NotificationType;
	entityType?: NotificationEntityType;
	entityId?: string;
	title: string;
	message: string;
}) => {
	const user = await prisma.user.findUnique({ where: { id: payload.userId } });
	if (!user) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided userId does not match any user.");
	}
	return createNotification(payload);
};

export const getMyNotificationsFromDB = async (userId: string, query: Record<string, unknown>) => {
	const effectiveQuery: Record<string, unknown> = { ...query, userId };
	const queryBuilder = new QueryBuilder<Notification>(notificationDelegate, notificationQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

const assertOwnedNotification = async (id: string, userId: string) => {
	const notification = await prisma.notification.findUnique({ where: { id } });
	if (!notification) {
		throw new AppError(StatusCodes.NOT_FOUND, "Notification not found.");
	}
	if (notification.userId !== userId) {
		throw new AppError(StatusCodes.FORBIDDEN, "You do not have access to this notification.");
	}
	return notification;
};

export const markNotificationReadInDB = async (id: string, userId: string) => {
	await assertOwnedNotification(id, userId);
	return prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
};

export const markAllNotificationsReadInDB = async (userId: string) => {
	await prisma.notification.updateMany({
		where: { userId, isRead: false },
		data: { isRead: true, readAt: new Date() },
	});
};

export const deleteMyNotificationFromDB = async (id: string, userId: string) => {
	await assertOwnedNotification(id, userId);
	await prisma.notification.delete({ where: { id } });
};