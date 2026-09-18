// Shared request/DTO shapes for the clientAppreciation module.

export type AppreciationType = "THANK_YOU_NOTE" | "GIFT" | "REFERRAL" | "BONUS" | "TESTIMONIAL" | "OTHER";
export type CreateAppreciationInput = {
	clientId: string;
	projectId?: string;
	type: AppreciationType;
	amount?: number;
	currency?: string;
	title?: string;
	description?: string;
	receivedAt?: Date;
};
export type UpdateAppreciationInput = {
	projectId?: string | null;
	type?: AppreciationType;
	amount?: number | null;
	currency?: string | null;
	title?: string | null;
	description?: string | null;
	receivedAt?: Date;
};