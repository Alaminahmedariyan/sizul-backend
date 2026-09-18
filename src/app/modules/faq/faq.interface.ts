// Shared request/DTO shapes for the faq module.

export type CreateFaqInput = {
  question: string;
  answer: string;
  category?: string;
  isActive: boolean;
  order: number;
};
export type UpdateFaqInput = {
  question?: string;
  answer?: string;
  category?: string | null;
  isActive?: boolean;
  order?: number;
};
