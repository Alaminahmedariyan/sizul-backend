// Shared request/DTO shapes for the user module.

export type UpdateUserRoleInput = "ADMIN" | "STAFF" | "CLIENT";
export type UpdateUserStatusInput = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type UpdateMyProfileInput = { name?: string; image?: string };