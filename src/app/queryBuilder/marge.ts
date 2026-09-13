import { DEFAULT_SORT_FIELD, OPERATOR_MAP, UNSAFE_KEYS } from "./constants";
import type { ParsedFilter, ParsedQuery, PrismaQueryArgs, QueryConfig } from "./types";

const buildNestedField = (path: string, condition: unknown): Record<string, unknown> => {
	const segments = path.split(".");
	for (const segment of segments) {
		if (UNSAFE_KEYS.includes(segment)) return {};
	}
	return segments.reduceRight((acc, part) => ({ [part]: acc }), condition as Record<string, unknown>);
};

const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
	for (const [key, value] of Object.entries(source)) {
		if (UNSAFE_KEYS.includes(key)) continue;
		const isPlainObj = (v: unknown) => v !== null && typeof v === "object" && !Array.isArray(v);
		if (isPlainObj(value) && isPlainObj(target[key])) {
			deepMerge(target[key] as Record<string, unknown>, value as Record<string, unknown>);
		} else {
			target[key] = value;
		}
	}
	return target;
};

const buildWhereFromFilters = (filters: ParsedFilter[]): Record<string, unknown> => {
	const grouped: Record<string, Record<string, unknown>> = {};
	for (const { field, operator, value } of filters) {
		const prismaOp = OPERATOR_MAP[operator];
		if (!prismaOp) continue;
		grouped[field] = { ...(grouped[field] ?? {}), [prismaOp]: value };
	}
	const where: Record<string, unknown> = {};
	for (const [field, condition] of Object.entries(grouped)) {
		deepMerge(where, buildNestedField(field, condition));
	}
	return where;
};

const buildSearchWhere = (search: string | undefined, searchableFields: string[] = []): Record<string, unknown> | undefined => {
	if (!search || searchableFields.length === 0) return undefined;
	return { OR: searchableFields.map((field) => buildNestedField(field, { contains: search, mode: "insensitive" })) };
};

const buildWhere = (parsed: ParsedQuery, config: QueryConfig, tenantScope?: Record<string, unknown>): Record<string, unknown> => {
	const conditions: Record<string, unknown>[] = [];

	const filterWhere = buildWhereFromFilters(parsed.filters);
	if (Object.keys(filterWhere).length > 0) conditions.push(filterWhere);

	const searchWhere = buildSearchWhere(parsed.search, config.searchableFields);
	if (searchWhere) conditions.push(searchWhere);

	if (config.softDelete) conditions.push({ deletedAt: null });
	if (tenantScope) conditions.push(tenantScope);

	if (conditions.length === 0) return {};
	if (conditions.length === 1) return conditions[0] ?? {};
	return { AND: conditions };
};

const buildOrderBy = (parsed: ParsedQuery, config: QueryConfig): Record<string, unknown>[] => {
	if (parsed.sorts.length === 0) {
		return [{ [config.defaultSortField ?? DEFAULT_SORT_FIELD]: "desc" }];
	}
	return parsed.sorts.map(({ field, order }) => buildNestedField(field, order));
};

const buildSelect = (fields?: string[]): Record<string, unknown> | undefined => {
	if (!fields || fields.length === 0) return undefined;
	const safeFields = fields.filter((f) => !UNSAFE_KEYS.includes(f));
	return safeFields.length > 0 ? Object.fromEntries(safeFields.map((f) => [f, true])) : undefined;
};

const buildInclude = (
	requested: string[] | undefined,
	defaultInclude: Record<string, boolean> | undefined,
): Record<string, unknown> | undefined => {
	const include: Record<string, boolean> = { ...(defaultInclude ?? {}) };
	for (const relation of requested ?? []) {
		if (UNSAFE_KEYS.includes(relation)) continue;
		include[relation] = true;
	}
	return Object.keys(include).length > 0 ? include : undefined;
};

export const buildPrismaArgs = (
	parsed: ParsedQuery,
	config: QueryConfig,
	tenantScope?: Record<string, unknown>,
): PrismaQueryArgs => {
	const select = buildSelect(parsed.fields);
	const include = select ? undefined : buildInclude(parsed.include, config.defaultInclude);

	return {
		where: buildWhere(parsed, config, tenantScope),
		orderBy: buildOrderBy(parsed, config),
		skip: parsed.skip,
		take: parsed.limit,
		...(select && { select }),
		...(include && { include }),
	};
};