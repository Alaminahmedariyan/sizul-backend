import { z } from "zod";

// Multipart form fields always arrive as strings — file itself (fileName/fileUrl/
// mimeType/size) is derived server-side from the uploaded file, never from user input.
export const uploadProjectFileValidation = z.object({
	projectId: z.string().min(1, "projectId is required."),
	description: z.string().max(500).optional(),
});
