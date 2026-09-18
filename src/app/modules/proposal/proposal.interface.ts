// Shared request/DTO shapes for the proposal module.

export type ProposalItemInput = {
	serviceId?: string;
	pricingPlanId?: string;
	title: string;
	description?: string;
	quantity: number;
	unitPrice: number;
};

export type CreateProposalInput = {
	leadId?: string;
	clientId?: string;
	projectId?: string;
	title: string;
	introduction?: string;
	terms?: string;
	notes?: string;
	discount: number;
	tax: number;
	currency: string;
	validUntil?: Date;
	items: ProposalItemInput[];
};

export type UpdateProposalInput = Partial<Omit<CreateProposalInput, "discount" | "tax" | "currency">> & {
	discount?: number;
	tax?: number;
	currency?: string;
};