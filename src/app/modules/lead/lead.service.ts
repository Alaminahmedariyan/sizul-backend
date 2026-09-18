import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { Lead } from "../../../generated/prisma/client";
import { leadQueryConfig } from "./lead.constant";
import { createNotification, notifyAdmins } from "../notification/notification.service";
import type { LeadSource, LeadPriority, LeadStatus, LeadActivityType, CreateLeadInput, UpdateLeadInput } from "./lead.interface";


const leadDelegate = prisma.lead as unknown as PrismaDelegate<Lead>;

const logLeadActivity = async (
	leadId: string,
	type: LeadActivityType,
	description: string,
	createdById?: string,
	metadata?: unknown,
) => {
	await prisma.leadActivity.create({
		data: {
			leadId,
			type,
			description,
			...(createdById !== undefined && { createdById }),
			...(metadata !== undefined && { metadata: metadata as Prisma.InputJsonValue }),
		},
	});
};

const assertLeadExists = async (id: string) => {
	const lead = await prisma.lead.findUnique({ where: { id } });
	if (!lead) {
		throw new AppError(StatusCodes.NOT_FOUND, "Lead not found.");
	}
	return lead;
};

 const createLeadInDB = async (payload: CreateLeadInput) => {
	if (payload.serviceId) {
		const service = await prisma.service.findUnique({ where: { id: payload.serviceId } });
		if (!service) {
			throw new AppError(StatusCodes.BAD_REQUEST, "The provided serviceId does not match any service.");
		}
	}

	const lead = await prisma.lead.create({ data: payload as Prisma.LeadUncheckedCreateInput });
	await logLeadActivity(lead.id, "CREATED", `Lead captured from ${payload.source}.`);

	try {
		await notifyAdmins({
			type: "LEAD_NEW",
			entityType: "LEAD",
			entityId: lead.id,
			title: "New lead received",
			message: `${lead.name} submitted a new lead via ${payload.source}.`,
		});
	} catch (error) {
		console.error("[Lead] Failed to notify admins of new lead:", error);
	}

	return lead;
};

 const getAllLeadsFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<Lead>(leadDelegate, leadQueryConfig);
	return queryBuilder.execute(query);
};

 const getLeadByIdFromDB = async (id: string) => {
	const lead = await prisma.lead.findUnique({
		where: { id },
		include: {
			service: true,
			client: true,
			assignedStaff: true,
			notes: { orderBy: { createdAt: "desc" } },
			activities: { orderBy: { createdAt: "desc" }, take: 20 },
			consultations: true,
			proposals: { select: { id: true, proposalNumber: true, title: true, status: true, total: true } },
		},
	});

	if (!lead) {
		throw new AppError(StatusCodes.NOT_FOUND, "Lead not found.");
	}

	return lead;
};

 const updateLeadInDB = async (id: string, payload: UpdateLeadInput, actorId?: string) => {
	await assertLeadExists(id);

	if (payload.serviceId) {
		const service = await prisma.service.findUnique({ where: { id: payload.serviceId } });
		if (!service) {
			throw new AppError(StatusCodes.BAD_REQUEST, "The provided serviceId does not match any service.");
		}
	}

	const updated = await prisma.lead.update({ where: { id }, data: payload as Prisma.LeadUncheckedUpdateInput });
	await logLeadActivity(id, "UPDATED", "Lead details updated.", actorId);
	return updated;
};

 const updateLeadStatusInDB = async (id: string, status: LeadStatus, actorId?: string) => {
	const existing = await assertLeadExists(id);

	const updated = await prisma.lead.update({ where: { id }, data: { status } });
	await logLeadActivity(id, "STATUS_CHANGED", `Status changed from ${existing.status} to ${status}.`, actorId);

	if (existing.assignedStaffId) {
		try {
			const staff = await prisma.staff.findUnique({ where: { id: existing.assignedStaffId }, select: { userId: true } });
			if (staff?.userId) {
				await createNotification({
					userId: staff.userId,
					type: "LEAD_STATUS_CHANGED",
					entityType: "LEAD",
					entityId: id,
					title: "Lead status updated",
					message: `${existing.name}'s lead status changed to ${status}.`,
				});
			}
		} catch (error) {
			console.error("[Lead] Failed to notify staff of status change:", error);
		}
	}

	return updated;
};

 const assignLeadToStaffInDB = async (id: string, staffId: string | null, actorId?: string) => {
	const lead = await assertLeadExists(id);

	let staff: { id: string; userId: string | null } | null = null;
	if (staffId) {
		staff = await prisma.staff.findUnique({ where: { id: staffId }, select: { id: true, userId: true } });
		if (!staff) {
			throw new AppError(StatusCodes.BAD_REQUEST, "The provided staffId does not match any staff member.");
		}
	}

	const updated = await prisma.lead.update({ where: { id }, data: { assignedStaffId: staffId } });
	await logLeadActivity(
		id,
		"ASSIGNED",
		staffId ? "Lead assigned to a staff member." : "Lead unassigned.",
		actorId,
	);

	if (staff?.userId) {
		try {
			await createNotification({
				userId: staff.userId,
				type: "LEAD_ASSIGNED",
				entityType: "LEAD",
				entityId: id,
				title: "A lead was assigned to you",
				message: `You've been assigned to follow up with ${lead.name}.`,
			});
		} catch (error) {
			console.error("[Lead] Failed to notify assigned staff:", error);
		}
	}

	return updated;
};

 const addLeadNoteInDB = async (leadId: string, content: string, actorId?: string) => {
	await assertLeadExists(leadId);

	const note = await prisma.leadNote.create({ data: { leadId, content } });
	await logLeadActivity(leadId, "NOTE_ADDED", "A note was added to this lead.", actorId);
	return note;
};

 const getLeadNotesFromDB = async (leadId: string) => {
	await assertLeadExists(leadId);
	return prisma.leadNote.findMany({ where: { leadId }, orderBy: { createdAt: "desc" } });
};

 const getLeadActivitiesFromDB = async (leadId: string) => {
	await assertLeadExists(leadId);
	return prisma.leadActivity.findMany({
		where: { leadId },
		orderBy: { createdAt: "desc" },
		include: { createdBy: { select: { id: true, name: true, email: true } } },
	});
};

 const convertLeadToClientInDB = async (id: string, actorId?: string) => {
	const lead = await assertLeadExists(id);

	if (lead.clientId) {
		throw new AppError(StatusCodes.CONFLICT, "This lead has already been converted to a client.");
	}

	const email = lead.email.toLowerCase();

	// A Client may already exist for this email — e.g. an earlier lead from the
	// same person was already converted, or a User account already auto-created
	// one (see the databaseHooks in lib/auth.ts). Reuse it instead of creating a
	// duplicate; fill in any gaps from this lead's data without overwriting
	// anything the existing record already has.
	const existingClient = await prisma.client.findUnique({ where: { email } });

	const client = existingClient
		? await prisma.client.update({
				where: { id: existingClient.id },
				data: {
					phone: existingClient.phone ?? lead.phone,
					company: existingClient.company ?? lead.company,
					website: existingClient.website ?? lead.website,
					location: existingClient.location ?? lead.location,
				},
			})
		: await prisma.client.create({
				data: {
					name: lead.name,
					email,
					phone: lead.phone,
					company: lead.company,
					website: lead.website,
					location: lead.location,
				},
			});

	const updatedLead = await prisma.lead.update({
		where: { id },
		data: { clientId: client.id, status: "CONVERTED" },
	});

	await logLeadActivity(id, "CONVERTED", "Lead converted to a client.", actorId);

	return { lead: updatedLead, client };
};

 const deleteLeadFromDB = async (id: string) => {
	await assertLeadExists(id);
	await prisma.lead.delete({ where: { id } });
};

 export const leadService = {
	createLeadInDB,
	getAllLeadsFromDB ,	
	getLeadByIdFromDB ,
	updateLeadInDB ,
	updateLeadStatusInDB ,
	assignLeadToStaffInDB ,
	addLeadNoteInDB ,
	getLeadNotesFromDB ,
	getLeadActivitiesFromDB ,
	convertLeadToClientInDB ,
	deleteLeadFromDB 
}
