// Shared request/DTO shapes for the project module.

export type ProjectType = "CLIENT_PROJECT" | "INTERNAL_PROJECT" | "RESEARCH" | "MAINTENANCE";
export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "REVIEW" | "COMPLETED" | "CANCELLED";
export type CreateProjectInput = {
	clientId?: string;
	name: string;
	slug: string;
	projectType: ProjectType;
	description?: string;
	budget?: number;
	currency: string;
	startDate?: Date;
	deadline?: Date;
};
export type UpdateProjectInput = {
	clientId?: string | null;
	name?: string;
	slug?: string;
	projectType?: ProjectType;
	description?: string | null;
	budget?: number | null;
	currency?: string;
	startDate?: Date | null;
	deadline?: Date | null;
};