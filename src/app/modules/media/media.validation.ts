import { z } from "zod";

// Multipart form fields arrive as strings; the file itself (fileName/url/mimeType/
// size/width/height) is derived server-side from the uploaded file.
export const uploadMediaValidation = z.object({
	altText: z.string().max(200).optional(),
	caption: z.string().max(300).optional(),
});

export const updateMediaValidation = z
	.object({
		altText: z.string().max(200).nullable().optional(),
		caption: z.string().max(300).nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided." });
