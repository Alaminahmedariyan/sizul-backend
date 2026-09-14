import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { ContactMessage } from "../../../generated/prisma/client";
import { contactMessageQueryConfig } from "./contactMessage.constant";
import { notifyAdmins } from "../notification/notification.service";

type ContactMessageStatus = "UNREAD" | "READ" | "REPLIED" | "ARCHIVED" | "SPAM";

const delegate = prisma.contactMessage as unknown as PrismaDelegate<ContactMessage>;

const assertExists = async (id: string) => {
	const message = await prisma.contactMessage.findUnique({ where: { id } });
	if (!message) {
		throw new AppError(StatusCodes.NOT_FOUND, "Message not found.");
	}
	return message;
};

export const createContactMessageInDB = async (payload: {
	name: string;
	email: string;
	phone?: string;
	company?: string;
	subject?: string;
	message: string;
}) => {
	const contactMessage = await prisma.contactMessage.create({ data: payload as Prisma.ContactMessageUncheckedCreateInput });

	try {
		await notifyAdmins({
			type: "MESSAGE_RECEIVED",
			entityType: "MESSAGE",
			entityId: contactMessage.id,
			title: "New contact message",
			message: `${payload.name} sent a message${payload.subject ? `: "${payload.subject}"` : "."}`,
		});
	} catch (error) {
		console.error("[ContactMessage] Failed to notify admins:", error);
	}

	return contactMessage;
};

export const getAllContactMessagesFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<ContactMessage>(delegate, contactMessageQueryConfig);
	return queryBuilder.execute(query);
};

export const getContactMessageByIdFromDB = async (id: string) => {
	const message = await assertExists(id);

	// Reading a message for the first time transitions it out of UNREAD.
	if (message.status === "UNREAD") {
		return prisma.contactMessage.update({ where: { id }, data: { status: "READ" } });
	}

	return message;
};

export const updateContactMessageStatusInDB = async (id: string, status: ContactMessageStatus) => {
	const existing = await assertExists(id);

	const repliedAt = status === "REPLIED" && !existing.repliedAt ? new Date() : existing.repliedAt;

	return prisma.contactMessage.update({ where: { id }, data: { status, repliedAt } });
};

export const deleteContactMessageFromDB = async (id: string) => {
	await assertExists(id);
	await prisma.contactMessage.delete({ where: { id } });
};