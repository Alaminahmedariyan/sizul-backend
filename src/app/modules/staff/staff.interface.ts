// Shared request/DTO shapes for the staff module.

export type CreateStaffInput = {
	userId?: string;
	employeeId?: string;
	fullName: string;
	email: string;
	phone?: string;
	role?: "OWNER" | "MANAGER" | "DEVELOPER" | "DESIGNER" | "MARKETING" | "SALES" | "SUPPORT";
	designation?: string;
	department?: string;
	bio?: string;
	avatar?: string;
	hireDate?: Date;
};

export type UpdateStaffInput = {
	userId?: string | null;
	employeeId?: string | null;
	fullName?: string;
	email?: string;
	phone?: string | null;
	role?: "OWNER" | "MANAGER" | "DEVELOPER" | "DESIGNER" | "MARKETING" | "SALES" | "SUPPORT";
	designation?: string | null;
	department?: string | null;
	bio?: string | null;
	avatar?: string | null;
	hireDate?: Date | null;
};

export type StaffStatusInput = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";