// Shared request/DTO shapes for the blogCategory module.

export type CreateInput = { name: string; slug: string; description?: string; isActive: boolean };
export type UpdateInput = { name?: string; slug?: string; description?: string | null; isActive?: boolean };