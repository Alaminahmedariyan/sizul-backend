import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { prisma } from "../../../lib/prisma";

export const upsertSiteSettingInDB = async (payload: { key: string; value?: string; description?: string }) => {
	return prisma.siteSetting.upsert({
		where: { key: payload.key },
		create: payload,
		update: { value: payload.value, description: payload.description },
	});
};

export const getAllSiteSettingsFromDB = async () => {
	return prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
};

export const getSiteSettingByKeyFromDB = async (key: string) => {
	const setting = await prisma.siteSetting.findUnique({ where: { key } });
	if (!setting) {
		throw new AppError(StatusCodes.NOT_FOUND, "Setting not found.");
	}
	return setting;
};

export const deleteSiteSettingFromDB = async (key: string) => {
	const existing = await prisma.siteSetting.findUnique({ where: { key } });
	if (!existing) {
		throw new AppError(StatusCodes.NOT_FOUND, "Setting not found.");
	}
	await prisma.siteSetting.delete({ where: { key } });
};