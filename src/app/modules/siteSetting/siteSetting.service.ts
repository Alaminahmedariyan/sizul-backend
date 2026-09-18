import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { prisma } from "../../../lib/prisma";
import type { UpsertSiteSettingInput } from "./siteSetting.interface";

const upsertSiteSettingInDB = async (payload: UpsertSiteSettingInput) => {
	return prisma.siteSetting.upsert({
		where: { key: payload.key },
		create: payload,
		update: {
			...(payload.value !== undefined && { value: payload.value }),
			...(payload.description !== undefined && { description: payload.description }),
		},
	});
};

 const getAllSiteSettingsFromDB = async () => {
	return prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
};

 const getSiteSettingByKeyFromDB = async (key: string) => {
	const setting = await prisma.siteSetting.findUnique({ where: { key } });
	if (!setting) {
		throw new AppError(StatusCodes.NOT_FOUND, "Setting not found.");
	}
	return setting;
};

 const deleteSiteSettingFromDB = async (key: string) => {
	const existing = await prisma.siteSetting.findUnique({ where: { key } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Setting not found.");
	}
	await prisma.siteSetting.delete({ where: { key } });
};

export const siteSettingService = {
	upsertSiteSettingInDB,
	getAllSiteSettingsFromDB,
	getSiteSettingByKeyFromDB,
	deleteSiteSettingFromDB,
};
