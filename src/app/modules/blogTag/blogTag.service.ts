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

 const createBlogTagInDB = async (payload: { name: string; slug: string }) => prisma.blogTag.create({ data: payload as Prisma.BlogTagUncheckedCreateInput });

 const getAllBlogTagsFromDB = async (query: Record<string, unknown>) => {
	const queryBuilder = new QueryBuilder<BlogTag>(tagDelegate, blogTagQueryConfig);
	return queryBuilder.execute(query);
};

 const getBlogTagByIdFromDB = async (id: string) => assertExists(id);

 const updateBlogTagInDB = async (id: string, payload: { name?: string; slug?: string }) => {
	await assertExists(id);
	return prisma.blogTag.update({ where: { id }, data: payload as Prisma.BlogTagUncheckedUpdateInput });
};

 const deleteBlogTagFromDB = async (id: string) => {
	await assertExists(id);
	await prisma.blogTag.delete({ where: { id } });
};

export const blogTagService = {
	createBlogTagInDB,
	getAllBlogTagsFromDB,
	getBlogTagByIdFromDB,
	updateBlogTagInDB,
	deleteBlogTagFromDB,
};