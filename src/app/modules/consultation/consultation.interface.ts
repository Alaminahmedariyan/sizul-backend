// Shared request/DTO shapes for the consultation module.

export type ConsultationStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type CreateConsultationInput = {
	leadId: string;
	serviceId?: string;
	preferredDate?: Date;
	preferredTime?: string;
	notes?: string;
};
export type UpdateConsultationInput = {
	serviceId?: string | null;
	preferredDate?: Date | null;
	preferredTime?: string | null;
	notes?: string | null;
};