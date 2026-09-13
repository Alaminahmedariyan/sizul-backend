import { z } from "zod";

const keyPattern = /^[a-z0-9_]+$/;
const keyField = z.string().min(1, "Key is required.").max(100).regex(keyPattern, "Key must be lowercase letters, numbers, and underscores only.");

export const upsertSiteSettingValidation = z.object({
	key: keyField,
	value: z.string().max(5000).optional(),
	description: z.string().max(500).optional(),
});