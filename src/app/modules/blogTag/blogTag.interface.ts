// Shared request/DTO shapes for the blogTag module.

export type CreateBlogTagInput = { name: string; slug: string };
export type UpdateBlogTagInput = { name?: string; slug?: string };