export type FieldType = "string" | "number" | "decimal" | "boolean" | "date" | "enum";

export type FilterOperator =
	| "eq" | "not" | "gt" | "gte" | "lt" | "lte" | "in" | "notIn" | "contains" | "startsWith" | "endsWith";

export type EnumFilterConfig = { type: "enum"; enum: Record<string, string> };

export type FilterConfig = "string" | "number" | "decimal" | "boolean" | "date" | EnumFilterConfig;

export type QueryConfig = {
	searchableFields?: string[];
	filterableFields: Record<string, FilterConfig>;
	sortableFields: string[];
	includableRelations?: string[];
	defaultInclude?: Record<string, boolean>;
	softDelete?: boolean;
	maxLimit?: number;
	selectableFields?: string[];
	defaultSortField?: string;
	maxInclude?: number;
	maxNestedDepth?: number;
	maxSearchLength?: number;
};

export type ParsedFilter = { field: string; operator: FilterOperator; value: unknown };
export type ParsedSort = { field: string; order: "asc" | "desc" };

export type ParsedQuery = {
	page: number;
	limit: number;
	skip: number;
	search?: string;
	filters: ParsedFilter[];
	sorts: ParsedSort[];
	fields?: string[];
	include?: string[];
};

export type PrismaQueryArgs = {
	where: Record<string, unknown>;
	orderBy: Record<string, unknown>[];
	skip: number;
	take: number;
	select?: Record<string, unknown>;
	include?: Record<string, unknown>;
};

export type Meta = { page: number; limit: number; total: number; totalPage: number };
export type QueryResult<T> = { data: T[]; meta: Meta };

export type PrismaDelegate<T, TWhereInput = Record<string, unknown>> = {
	findMany: (args: {
		where?: TWhereInput;
		orderBy?: Record<string, unknown>[];
		skip?: number;
		take?: number;
		select?: Record<string, unknown>;
		include?: Record<string, unknown>;
	}) => Promise<T[]>;
	count: (args: { where?: TWhereInput }) => Promise<number>;
};