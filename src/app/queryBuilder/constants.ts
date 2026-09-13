export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const DEFAULT_MAX_LIMIT = 100;
export const DEFAULT_SORT_FIELD = "createdAt";

export const DEFAULT_MAX_INCLUDE = 5;
export const DEFAULT_MAX_NESTED_DEPTH = 2;
export const DEFAULT_MAX_SEARCH_LENGTH = 150;

export const RESERVED_QUERY_KEYS = [
	"page", "limit", "search", "sortBy", "sortOrder", "sort", "fields", "include",
] as const;

export const OPERATOR_MAP: Record<string, string> = {
	eq: "equals", not: "not", gt: "gt", gte: "gte", lt: "lt", lte: "lte",
	in: "in", notIn: "notIn", contains: "contains", startsWith: "startsWith", endsWith: "endsWith",
};

export const VALID_OPERATORS = Object.keys(OPERATOR_MAP);
export const SORT_ORDERS = ["asc", "desc"] as const;

export const OPERATORS_BY_TYPE: Record<string, string[]> = {
	string: ["eq", "not", "in", "notIn", "contains", "startsWith", "endsWith"],
	number: ["eq", "not", "gt", "gte", "lt", "lte", "in", "notIn"],
	decimal: ["eq", "not", "gt", "gte", "lt", "lte", "in", "notIn"],
	date: ["eq", "not", "gt", "gte", "lt", "lte", "in", "notIn"],
	boolean: ["eq", "not"],
	enum: ["eq", "not", "in", "notIn"],
};

export const UNSAFE_KEYS = ["__proto__", "constructor", "prototype"];

export const DATE_STRING_PATTERN =
	/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;