import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { BlogTag } from "../../../generated/prisma/client";
import { blogTagQueryConfig } from "./blogTag.constant";

const tagDelegate = prisma.blogTag as unknown as PrismaDelegate<BlogTag>;

const assertExists = async (id: string) => {
	const tag = await prisma.blogTag.findUnique({ where: { id } });
	if (!tag) {
		throw new AppError(StatusCodes.NOT_FOUND, "Blog tag not found.");
	}
	return tag;
};

export const createBlogTagInDB = async (payload: { name: string; slug: string }) => prisma.blogTag.create({ data: payload as Prisma.BlogTagUncheckedCreateInput });

export const getAllBlogTagsFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<BlogTag>(tagDelegate, blogTagQueryConfig);
	return queryBuilder.execute(query);
};

export const getBlogTagByIdFromDB = async (id: string) => assertExists(id);

export const updateBlogTagInDB = async (id: string, payload: { name?: string; slug?: string }) => {
	await assertExists(id);
	return prisma.blogTag.update({ where: { id }, data: payload as Prisma.BlogTagUncheckedUpdateInput });
};

export const deleteBlogTagFromDB = async (id: string) => {
	await assertExists(id);
	await prisma.blogTag.delete({ where: { id } });
};