import { z } from "zod";

const projectMemberRoleEnum = z.enum(["LEAD", "MEMBER", "REVIEWER", "OBSERVER"]);

export const addProjectMemberValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	staffId: z.string().min(1, "staffId is required."),
	role: projectMemberRoleEnum.default("MEMBER"),
});

export const updateProjectMemberRoleValidation = z.object({
	role: projectMemberRoleEnum,
});
