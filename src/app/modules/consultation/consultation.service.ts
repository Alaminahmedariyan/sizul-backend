import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Consultation } from "../../../generated/prisma/client";
import { consultationQueryConfig } from "./consultation.constant";
import { createNotification } from "../notification/notification.service";

type ConsultationStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

type CreateConsultationInput = {
	leadId: string;
	serviceId?: string;
	preferredDate?: Date;
	preferredTime?: string;
	notes?: string;
};

type UpdateConsultationInput = {
	serviceId?: string | null;
	preferredDate?: Date | null;
	preferredTime?: string | null;
	notes?: string | null;
};

const consultationDelegate = prisma.consultation as unknown as PrismaDelegate<Consultation>;

const assertLeadExists = async (leadId: string) => {
	const lead = await prisma.lead.findUnique({ where: { id: leadId } });
	if (!lead) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided leadId does not match any lead.");
	}
};

const assertServiceExists = async (serviceId: string) => {
	const service = await prisma.service.findUnique({ where: { id: serviceId } });
	if (!service) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided serviceId does not match any service.");
	}
};

const assertConsultationExists = async (id: string) => {
	const consultation = await prisma.consultation.findUnique({ where: { id } });
	if (!consultation) {
		throw new AppError(StatusCodes.NOT_FOUND, "Consultation not found.");
	}
	return consultation;
};

export const createConsultationInDB = async (payload: CreateConsultationInput) => {
	await assertLeadExists(payload.leadId);
	if (payload.serviceId) {
		await assertServiceExists(payload.serviceId);
	}

	const consultation = await prisma.consultation.create({ data: payload as Prisma.ConsultationUncheckedCreateInput });

	await prisma.leadActivity.create({
		data: {
			leadId: payload.leadId,
			type: "MEETING_SCHEDULED",
			description: "A consultation was scheduled for this lead.",
		},
	});

	return consultation;
};

export const getAllConsultationsFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<Consultation>(consultationDelegate, consultationQueryConfig);
	return queryBuilder.execute(query);
};

export const getConsultationByIdFromDB = async (id: string) => {
	const consultation = await prisma.consultation.findUnique({
		where: { id },
		include: { lead: true, service: true, assignedStaff: true },
	});

	if (!consultation) {
		throw new AppError(StatusCodes.NOT_FOUND, "Consultation not found.");
	}

	return consultation;
};

export const updateConsultationInDB = async (id: string, payload: UpdateConsultationInput) => {
	await assertConsultationExists(id);

	if (payload.serviceId) {
		await assertServiceExists(payload.serviceId);
	}

	return prisma.consultation.update({ where: { id }, data: payload as Prisma.ConsultationUncheckedUpdateInput });
};

export const updateConsultationStatusInDB = async (id: string, status: ConsultationStatus) => {
	await assertConsultationExists(id);
	return prisma.consultation.update({ where: { id }, data: { status } });
};

export const assignConsultationToStaffInDB = async (id: string, staffId: string | null) => {
	await assertConsultationExists(id);

	let staff: { id: string; userId: string | null } | null = null;
	if (staffId) {
		staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true, userId: true } });
		if (!staff) {
			throw new AppError(StatusCodes.BAD_REQUEST, "The provided staffId does not match any staff member.");
		}
	}

	const updated = await prisma.consultation.update({ where: { id }, data: { assignedStaffId: staffId } });

	if (staff?.userId) {
		try {
			await createNotification({
				userId: staff.userId,
				type: "CONSULTATION_SCHEDULED",
				entityType: "CONSULTATION",
				entityId: id,
				title: "Consultation assigned to you",
				message: "You've been assigned to handle a scheduled consultation.",
			});
		} catch (error) {
			console.error("[Consultation] Failed to notify assigned staff:", error);
		}
	}

	return updated;
};

export const deleteConsultationFromDB = async (id: string) => {
	await assertConsultationExists(id);
	await prisma.consultation.delete({ where: { id } });
};