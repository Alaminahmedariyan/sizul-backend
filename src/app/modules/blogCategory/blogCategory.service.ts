import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { BlogCategory } from "../../../generated/prisma/client";
import { blogCategoryQueryConfig } from "./blogCategory.constant";

type CreateInput = { name: string; slug: string; description?: string; isActive: boolean };
type UpdateInput = { name?: string; slug?: string; description?: string | null; isActive?: boolean };

const categoryDelegate = prisma.blogCategory as unknown as PrismaDelegate<BlogCategory>;

const assertExists = async (id: string) => {
	const category = await prisma.blogCategory.findUnique({ where: { id } });
	if (!category) {
		throw new AppError(StatusCodes.NOT_FOUND, "Blog category not found.");
	}
	return category;
};

export const createBlogCategoryInDB = async (payload: CreateInput) => prisma.blogCategory.create({ data: payload as Prisma.BlogCategoryUncheckedCreateInput });

export const getAllBlogCategoriesFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };
	if (publicOnly) {
		effectiveQuery.isActive = "true";
	}

	const queryBuilder = new QueryBuilder<BlogCategory>(categoryDelegate, blogCategoryQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

export const getBlogCategoryByIdFromDB = async (id: string) => assertExists(id);

export const updateBlogCategoryInDB = async (id: string, payload: UpdateInput) => {
	await assertExists(id);
	return prisma.blogCategory.update({ where: { id }, data: payload as Prisma.BlogCategoryUncheckedUpdateInput });
};

export const deleteBlogCategoryFromDB = async (id: string) => {
	await assertExists(id);
	await prisma.blogCategory.delete({ where: { id } });
};