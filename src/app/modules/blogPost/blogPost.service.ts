import { StatusCodes } from "http-status-codes";

import AppError from "../../errors/appError";
import { QueryBuilder } from "../../queryBuilder";
import type { PrismaDelegate } from "../../queryBuilder";
import { prisma } from "../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import type { BlogPost } from "../../../generated/prisma/client";
import { blogPostQueryConfig } from "./blogPost.constant";

type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type CreatePostInput = {
	categoryId?: string;
	title: string;
	slug: string;
	excerpt?: string;
	content: string;
	featuredImage?: string;
	seoTitle?: string;
	seoDescription?: string;
	canonicalUrl?: string;
	schemaMarkup?: unknown;
	tagIds: string[];
};

type UpdatePostInput = Partial<Omit<CreatePostInput, "tagIds">> & { tagIds?: string[] };

const postDelegate = prisma.blogPost as unknown as PrismaDelegate<BlogPost>;

const toPrismaData = <T extends { schemaMarkup?: unknown }>(payload: T) => ({
	...payload,
	...(payload.schemaMarkup !== undefined && {
		schemaMarkup: payload.schemaMarkup === null ? Prisma.JsonNull : (payload.schemaMarkup as Prisma.InputJsonValue),
	}),
});

const assertCategoryExists = async (categoryId: string) => {
	const category = await prisma.blogCategory.findUnique({ where: { id: categoryId } });
	if (!category) {
		throw new AppError(StatusCodes.BAD_REQUEST, "The provided categoryId does not match any category.");
	}
};

const assertTagsExist = async (tagIds: string[]) => {
	if (tagIds.length === 0) return;
	const uniqueIds = Array.from(new Set(tagIds));
	const found = await prisma.blogTag.findMany({ where: { id: { in: uniqueIds } } });
	if (found.length !== uniqueIds.length) {
		throw new AppError(StatusCodes.BAD_REQUEST, "One or more provided tagIds do not match any tag.");
	}
};

const assertPostExists = async (id: string) => {
	const post = await prisma.blogPost.findUnique({ where: { id } });
	if (!post) {
		throw new AppError(StatusCodes.NOT_FOUND, "Blog post not found.");
	}
	return post;
};

const setPostTags = async (postId: string, tagIds: string[]) => {
	await prisma.blogPostTag.deleteMany({ where: { postId } });
	const uniqueIds = Array.from(new Set(tagIds));
	if (uniqueIds.length > 0) {
		await prisma.blogPostTag.createMany({
			data: uniqueIds.map((tagId) => ({ postId, tagId })),
			skipDuplicates: true,
		});
	}
};

export const createBlogPostInDB = async (payload: CreatePostInput, authorId?: string) => {
	if (payload.categoryId) {
		await assertCategoryExists(payload.categoryId);
	}
	await assertTagsExist(payload.tagIds);

	const { tagIds, ...rest } = payload;

	const post = await prisma.blogPost.create({
		data: { ...toPrismaData(rest), ...(authorId !== undefined && { authorId }) } as Prisma.BlogPostUncheckedCreateInput,
	});

	if (tagIds.length > 0) {
		await setPostTags(post.id, tagIds);
	}

	return post;
};

export const getAllBlogPostsFromDB = async (query: Record<string, unknown>, { publicOnly }: { publicOnly: boolean }) => {
	const effectiveQuery: Record<string, unknown> = { ...query };
	if (publicOnly) {
		effectiveQuery.status = "PUBLISHED";
	}

	const queryBuilder = new QueryBuilder<BlogPost>(postDelegate, blogPostQueryConfig);
	return queryBuilder.execute(effectiveQuery);
};

export const getBlogPostBySlugFromDB = async (slug: string, { publicOnly }: { publicOnly: boolean }) => {
	const post = await prisma.blogPost.findUnique({
		where: { slug },
		include: {
			category: true,
			author: { select: { id: true, name: true, image: true } },
			tags: { include: { tag: true } },
		},
	});

	if (!post || (publicOnly && post.status !== "PUBLISHED")) {
		throw new AppError(StatusCodes.NOT_FOUND, "Blog post not found.");
	}

	return post;
};

export const getBlogPostByIdFromDB = async (id: string) => {
	const post = await prisma.blogPost.findUnique({
		where: { id },
		include: {
			category: true,
			author: { select: { id: true, name: true, image: true } },
			tags: { include: { tag: true } },
		},
	});

	if (!post) {
		throw new AppError(StatusCodes.NOT_FOUND, "Blog post not found.");
	}

	return post;
};

export const updateBlogPostInDB = async (id: string, payload: UpdatePostInput) => {
	await assertPostExists(id);

	if (payload.categoryId) {
		await assertCategoryExists(payload.categoryId);
	}
	if (payload.tagIds) {
		await assertTagsExist(payload.tagIds);
	}

	const { tagIds, ...rest } = payload;

	const updated = await prisma.blogPost.update({ where: { id }, data: toPrismaData(rest) as Prisma.BlogPostUncheckedUpdateInput });

	if (tagIds) {
		await setPostTags(id, tagIds);
	}

	return updated;
};

export const updateBlogPostStatusInDB = async (id: string, status: ContentStatus) => {
	const existing = await assertPostExists(id);

	const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? new Date() : existing.publishedAt;

	return prisma.blogPost.update({ where: { id }, data: { status, publishedAt } });
};

export const deleteBlogPostFromDB = async (id: string) => {
	await assertPostExists(id);
	await prisma.blogPost.delete({ where: { id } });
};