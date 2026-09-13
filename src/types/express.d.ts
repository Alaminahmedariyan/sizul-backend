import type { AuthenticatedUser } from "../app/middlewares/requireAuth";

declare global {
	namespace Express {
		interface Request {
			user?: AuthenticatedUser;
			files?: Express.Multer.File[];
		}
	}
}

export {};