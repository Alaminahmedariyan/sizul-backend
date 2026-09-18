// Shared request/DTO shapes for the pricingPlan module.

export type BillingInterval = "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
export type CreatePricingPlanInput = {
	serviceId: string;
	slug: string;
	name: string;
	description?: string;
	price: number;
	currency: string;
	billingInterval: BillingInterval;
	features?: unknown;
	isPopular: boolean;
	isActive: boolean;
	order: number;
};
export type UpdatePricingPlanInput = Partial<Omit<CreatePricingPlanInput, "currency" | "isPopular" | "isActive" | "order">> & {
	currency?: string;
	isPopular?: boolean;
	isActive?: boolean;
	order?: number;
};