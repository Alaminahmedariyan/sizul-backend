import { StatusCodes } from "http-status-codes";

import { Prisma } from "../../generated/prisma/client";
import AppError from "../errors/appError";
import {
	DATE_STRING_PATTERN, DEFAULT_LIMIT, DEFAULT_MAX_INCLUDE, DEFAULT_MAX_LIMIT,
	DEFAULT_MAX_NESTED_DEPTH, DEFAULT_MAX_SEARCH_LENGTH, DEFAULT_PAGE,
	OPERATORS_BY_TYPE, RESERVED_QUERY_KEYS, VALID_OPERATORS,
} from "./constants";
import type { FieldType, FilterConfig, FilterOperator, ParsedFilter, ParsedQuery, ParsedSort, QueryConfig } from "./types";

const getBaseType = (config: FilterConfig): FieldType => (typeof config === "string" ? config : "enum");

const assertValidDepth = (field: string, maxDepth: number) => {
	if (field.split(".").length > maxDepth) {
		throw new AppError(StatusCodes.BAD_REQUEST, `Field "${field}" exceeds the maximum allowed nesting depth of ${maxDepth}.`);
	}
};

const assertOperatorAllowedForType = (field: string, operator: string, type: FieldType) => {
	const allowed = OPERATORS_BY_TYPE[type] ?? [];
	if (!allowed.includes(operator)) {
		throw new AppError(StatusCodes.BAD_REQUEST, `Operator "${operator}" is not allowed on field "${field}" (type: ${type}).`);
	}
};

const isValidCalendarDate = (raw: string): boolean => {
	const datePart = raw.split("T")[0];
	const match = datePart?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return false;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const castSingleValue = (raw: string, field: string, config: FilterConfig): unknown => {
	if (typeof config === "object" && config.type === "enum") {
		const validValues = Object.values(config.enum);
		if (!validValues.includes(raw)) {
			throw new AppError(StatusCodes.BAD_REQUEST, `Invalid value "${raw}" for "${field}". Expected one of: ${validValues.join(", ")}.`);
		}
		return raw;
	}

	switch (config) {
		case "number": {
			const num = Number(raw);
			if (raw.trim() === "" || Number.isNaN(num)) {
				throw new AppError(StatusCodes.BAD_REQUEST, `Invalid number value for "${field}": "${raw}"`);
			}
			return num;
		}
		case "decimal": {
			try {
				return new Prisma.Decimal(raw);
			} catch {
				throw new AppError(StatusCodes.BAD_REQUEST, `Invalid decimal value for "${field}": "${raw}"`);
			}
		}
		case "boolean": {
			if (raw !== "true" && raw !== "false") {
				throw new AppError(StatusCodes.BAD_REQUEST, `"${field}" must be "true" or "false".`);
			}
			return raw === "true";
		}
		case "date": {
			if (!DATE_STRING_PATTERN.test(raw)) {
				throw new AppError(StatusCodes.BAD_REQUEST, `Invalid date value for "${field}": "${raw}". Expected format YYYY-MM-DD.`);
			}
			if (!isValidCalendarDate(raw)) {
				throw new AppError(StatusCodes.BAD_REQUEST, `"${raw}" is not a real calendar date for "${field}".`);
			}
			const date = new Date(raw);
			if (Number.isNaN(date.getTime())) {
				throw new AppError(StatusCodes.BAD_REQUEST, `Invalid date value for "${field}": "${raw}"`);
			}
			return date;
		}
		default:
			return raw;
	}
};

const castValue = (raw: unknown, field: string, config: FilterConfig, operator: FilterOperator): unknown => {
	const str = String(raw);
	if (operator === "in" || operator === "notIn") {
		return str.split(",").map((v) => castSingleValue(v.trim(), field, config));
	}
	return castSingleValue(str, field, config);
};

const parsePagination = (query: Record<string, unknown>, maxLimit: number) => {
	const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
	const requestedLimit = Number(query.limit) || DEFAULT_LIMIT;
	const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
	const skip = (page - 1) * limit;
	return { page, limit, skip };
};

const parseFilters = (query: Record<string, unknown>, config: QueryConfig, maxNestedDepth: number): ParsedFilter[] => {
	const filters: ParsedFilter[] = [];

	for (const [key, rawValue] of Object.entries(query)) {
		if ((RESERVED_QUERY_KEYS as readonly string[]).includes(key)) continue;

		const fieldConfig = config.filterableFields[key];
		if (!fieldConfig) continue;

		assertValidDepth(key, maxNestedDepth);
		const baseType = getBaseType(fieldConfig);

		if (rawValue !== null && typeof rawValue === "object" && !Array.isArray(rawValue)) {
			for (const [op, val] of Object.entries(rawValue as Record<string, unknown>)) {
				if (!VALID_OPERATORS.includes(op)) continue;
				assertOperatorAllowedForType(key, op, baseType);
				filters.push({ field: key, operator: op as FilterOperator, value: castValue(val, key, fieldConfig, op as FilterOperator) });
			}
		} else {
			assertOperatorAllowedForType(key, "eq", baseType);
			filters.push({ field: key, operator: "eq", value: castValue(rawValue, key, fieldConfig, "eq") });
		}
	}

	return filters;
};

const parseSort = (query: Record<string, unknown>, config: QueryConfig, maxNestedDepth: number): ParsedSort[] => {
	const sorts: ParsedSort[] = [];
	const seenFields = new Set<string>();

	const pushSort = (field: string, order: "asc" | "desc") => {
		if (seenFields.has(field)) return;
		seenFields.add(field);
		assertValidDepth(field, maxNestedDepth);
		sorts.push({ field, order });
	};

	if (typeof query.sort === "string" && query.sort.trim() !== "") {
		for (const raw of query.sort.split(",")) {
			const trimmed = raw.trim();
			const desc = trimmed.startsWith("-");
			const field = desc ? trimmed.slice(1) : trimmed;
			if (config.sortableFields.includes(field)) pushSort(field, desc ? "desc" : "asc");
		}
		return sorts;
	}

	if (typeof query.sortBy === "string" && config.sortableFields.includes(query.sortBy)) {
		pushSort(query.sortBy, query.sortOrder === "desc" ? "desc" : "asc");
	}

	return sorts;
};

const parseCsvWhitelisted = (value: unknown, allowed: string[] | undefined, maxItems?: number): string[] | undefined => {
	if (typeof value !== "string" || value.trim() === "") return undefined;

	const requested = value.split(",").map((v) => v.trim()).filter(Boolean);
	const filtered = allowed ? requested.filter((f) => allowed.includes(f)) : requested;
	const unique = Array.from(new Set(filtered));
	if (unique.length === 0) return undefined;

	if (maxItems && unique.length > maxItems) {
		throw new AppError(StatusCodes.BAD_REQUEST, `A maximum of ${maxItems} items can be requested at once.`);
	}

	return unique;
};

const parseSearch = (query: Record<string, unknown>, maxSearchLength: number): string | undefined => {
	if (typeof query.search !== "string") return undefined;
	const trimmed = query.search.trim();
	if (trimmed === "") return undefined;
	if (trimmed.length > maxSearchLength) {
		throw new AppError(StatusCodes.BAD_REQUEST, `Search query is too long (max ${maxSearchLength} characters).`);
	}
	return trimmed;
};

export const parseQuery = (query: Record<string, unknown>, config: QueryConfig): ParsedQuery => {
	const maxLimit = config.maxLimit ?? DEFAULT_MAX_LIMIT;
	const maxInclude = config.maxInclude ?? DEFAULT_MAX_INCLUDE;
	const maxNestedDepth = config.maxNestedDepth ?? DEFAULT_MAX_NESTED_DEPTH;
	const maxSearchLength = config.maxSearchLength ?? DEFAULT_MAX_SEARCH_LENGTH;

	const { page, limit, skip } = parsePagination(query, maxLimit);

	const search = parseSearch(query, maxSearchLength);
	const fields = parseCsvWhitelisted(query.fields, config.selectableFields);
	const include = parseCsvWhitelisted(query.include, config.includableRelations, maxInclude);

	return {
		page,
		limit,
		skip,
		...(search !== undefined && { search }),
		filters: parseFilters(query, config, maxNestedDepth),
		sorts: parseSort(query, config, maxNestedDepth),
		...(fields !== undefined && { fields }),
		...(include !== undefined && { include }),
	};
};