// Shared request/DTO shapes for the client module.

export type CreateClientInput = {
	userId?: string;
	name: string;
	email: string;
	phone?: string;
	company?: string;
	website?: string;
	location?: string;
	notes?: string;
};
export type UpdateClientInput = {
	userId?: string | null;
	name?: string;
	email?: string;
	phone?: string | null;
	company?: string | null;
	website?: string | null;
	location?: string | null;
	notes?: string | null;
};
export type UpdateMyClientProfileInput = Omit<UpdateClientInput, "userId" | "email">;