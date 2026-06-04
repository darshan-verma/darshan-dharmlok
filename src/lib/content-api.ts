import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const isInputJsonValue = (value: unknown): value is Prisma.InputJsonValue => {
	if (value === null) return true;
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return true;
	}
	if (Array.isArray(value)) {
		return value.every(
			(item) => item !== undefined && isInputJsonValue(item)
		);
	}
	if (typeof value === "object") {
		return Object.values(value as Record<string, unknown>).every(
			(item) => item !== undefined && isInputJsonValue(item)
		);
	}
	return false;
};

export const normalizeArrayInput = (value: unknown): Prisma.InputJsonValue => {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value.filter(
			(item): item is Prisma.InputJsonValue =>
				item !== undefined && isInputJsonValue(item)
		);
	}
	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value);
			if (Array.isArray(parsed)) {
				return parsed.filter(
					(item): item is Prisma.InputJsonValue =>
						item !== undefined && isInputJsonValue(item)
				);
			}
			return [];
		} catch {
			const trimmed = value.trim();
			return trimmed ? [trimmed] : [];
		}
	}
	return [];
};
import {
	buildTranslationsFromBody,
	finalizeTranslations,
	type ContentLang,
} from "@/lib/content-lang";
import {
	type LocalizableModel,
	TRANSLATABLE_FIELDS,
	flattenDocument,
} from "@/lib/localize-document";
import {
	buildTranslationSearchOr,
	mergeSearchIntoFilter,
} from "@/lib/translation-search";

/** Recursively convert MongoDB BSON extended JSON to plain JS values. */
export function normalizeMongoDoc(doc: unknown): unknown {
	if (doc === null || doc === undefined) return doc;

	if (doc instanceof Date) return doc;

	// Convert BSON date formats
	if (typeof doc === "object" && doc !== null && "$date" in doc) {
		const dateField = (doc as { $date: string | { $numberLong?: string } }).$date;
		if (typeof dateField === "string") return new Date(dateField);
		if (
			typeof dateField === "object" &&
			dateField !== null &&
			"$numberLong" in dateField
		) {
			return new Date(Number(dateField.$numberLong));
		}
	}

	// Convert BSON ObjectId
	if (typeof doc === "object" && doc !== null && "$oid" in doc) {
		return (doc as { $oid: string }).$oid;
	}

	// Convert BSON NumberLong/Int
	if (typeof doc === "object" && doc !== null && "$numberLong" in doc) {
		return Number((doc as { $numberLong: string }).$numberLong);
	}
	if (typeof doc === "object" && doc !== null && "$numberInt" in doc) {
		return Number((doc as { $numberInt: string }).$numberInt);
	}
	if (typeof doc === "object" && doc !== null && "$numberDouble" in doc) {
		return Number((doc as { $numberDouble: string }).$numberDouble);
	}

	// Recurse into arrays
	if (Array.isArray(doc)) return doc.map(normalizeMongoDoc);

	// Recurse into objects
	if (typeof doc === "object") {
		return Object.fromEntries(
			Object.entries(doc as Record<string, unknown>).map(([k, v]) => [
				k,
				normalizeMongoDoc(v),
			])
		);
	}

	return doc;
}

/** ISO string for API responses; empty string when missing or invalid. */
export function safeFormatDate(value: unknown): string {
	if (!value) return "";
	const d = value instanceof Date ? value : new Date(value as string);
	return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** Date-only (YYYY-MM-DD) for API responses. */
export function safeFormatDateOnly(value: unknown): string {
	const iso = safeFormatDate(value);
	return iso ? iso.split("T")[0] : "";
}

export const parseJsonArrayField = <T = unknown>(fieldValue: unknown): T[] => {
	if (!fieldValue) return [];
	if (Array.isArray(fieldValue)) return fieldValue as T[];
	if (typeof fieldValue !== "string") return [];
	try {
		const parsed = JSON.parse(fieldValue);
		return Array.isArray(parsed) ? (parsed as T[]) : [];
	} catch {
		const trimmed = fieldValue.trim();
		return trimmed ? ([trimmed] as T[]) : [];
	}
};

export function prepareTranslationsForSave(
	model: LocalizableModel,
	body: Record<string, unknown>,
	existing?: { translations?: unknown }
) {
	const fields = TRANSLATABLE_FIELDS[model];
	const built = buildTranslationsFromBody(body, fields, existing);
	return finalizeTranslations(built, fields);
}

export function pickTranslationSlice(
	body: Record<string, unknown>,
	fields: string[],
	locale: ContentLang = "en"
): Record<string, unknown> {
	const translations = body.translations as
		| { en?: Record<string, unknown>; hi?: Record<string, unknown> }
		| undefined;
	const fromNested = translations?.[locale];
	if (fromNested && typeof fromNested === "object") {
		return { ...fromNested };
	}
	const slice: Record<string, unknown> = {};
	for (const field of fields) {
		if (body[field] !== undefined) slice[field] = body[field];
	}
	return slice;
}

export function withTranslationMeta(
	doc: Record<string, unknown>,
	flat: Record<string, unknown>
): Record<string, unknown> {
	return {
		...flat,
		translations: doc.translations ?? {},
		translationStatus: doc.translationStatus ?? "none",
	};
}

export function formatTempleResponse(
	temple: Record<string, unknown>,
	locale: ContentLang
) {
	const flat = flattenDocument(temple, "temple", locale) as Record<
		string,
		unknown
	>;
	return withTranslationMeta(temple, {
		...flat,
		date: safeFormatDate(temple.date),
		createdAt: safeFormatDate(temple.createdAt),
		updatedAt: safeFormatDate(temple.updatedAt),
		amenities: parseJsonArrayField(flat.amenities),
		imageFile: parseJsonArrayField(flat.imageFile),
		videoFile: parseJsonArrayField(flat.videoFile),
		travelByAir: parseJsonArrayField(flat.travelByAir),
		travelByTrain: parseJsonArrayField(flat.travelByTrain),
		travelByBus: parseJsonArrayField(flat.travelByBus),
		travelByRoad: parseJsonArrayField(flat.travelByRoad),
	});
}

export function formatBlogResponse(
	blog: Record<string, unknown>,
	locale: ContentLang
) {
	const flat = flattenDocument(blog, "blog", locale) as Record<string, unknown>;
	return withTranslationMeta(blog, {
		...flat,
		coverImage: flat.coverImage ?? "",
		bannerImage: flat.bannerImage ?? "",
		createdAt: safeFormatDate(blog.createdAt),
		updatedAt: safeFormatDate(blog.updatedAt),
	});
}

export function formatEventResponse(
	event: Record<string, unknown>,
	locale: ContentLang,
	opts?: {
		formatDateOnly?: (v: unknown) => string;
		formatIsoDateTime?: (v: unknown) => string | undefined;
		parseArrayField?: (v: unknown) => string[];
	}
) {
	const flat = flattenDocument(event, "event", locale) as Record<string, unknown>;
	const formatDateOnly = opts?.formatDateOnly ?? safeFormatDateOnly;
	const formatIso = opts?.formatIsoDateTime ?? safeFormatDate;
	const parseArr = opts?.parseArrayField ?? parseJsonArrayField;

	return withTranslationMeta(event, {
		...flat,
		id: event.id,
		title: flat.title ?? "",
		description: flat.description ?? "",
		bookingUrl: event.bookingUrl ?? "",
		address: flat.address ?? "",
		fromDate: formatDateOnly(event.fromDate),
		fromTime: flat.fromTime ?? "",
		toDate: formatDateOnly(event.toDate),
		toTime: flat.toTime ?? "",
		place: flat.place ?? "",
		location: flat.location ?? "",
		category: event.category,
		type: event.type,
		price: event.price ?? undefined,
		bannerImage: event.bannerImage ?? "",
		relatedImages: parseArr(event.relatedImages),
		status: event.status,
		createdAt: formatIso(event.createdAt) || undefined,
		updatedAt: formatIso(event.updatedAt) || undefined,
	});
}

export function formatPoojaCategoryResponse(
	row: Record<string, unknown>,
	locale: ContentLang
) {
	const flat = flattenDocument(row, "poojaCategory", locale) as Record<
		string,
		unknown
	>;
	return withTranslationMeta(row, {
		id: row.id,
		...flat,
		date: safeFormatDate(row.date),
		price: typeof row.price === "number" ? row.price : undefined,
		status: row.status ?? "Inactive",
		images: parseJsonArrayField(row.images ?? flat.images),
		videos: parseJsonArrayField(row.videos ?? flat.videos),
	});
}

export function formatPanditjiResponse(
	user: Record<string, unknown>,
	locale: ContentLang
) {
	const flat = flattenDocument(user, "panditji", locale) as Record<string, unknown>;
	return withTranslationMeta(user, flat);
}

export function formatDharamshalaResponse(
	row: Record<string, unknown>,
	locale: ContentLang
) {
	const flat = flattenDocument(row, "dharamshala", locale) as Record<
		string,
		unknown
	>;
	return withTranslationMeta(row, {
		...flat,
		date: safeFormatDate(row.date),
		createdAt: safeFormatDate(row.createdAt),
		updatedAt: safeFormatDate(row.updatedAt),
		amenities: parseJsonArrayField(flat.amenities),
		imageFile: parseJsonArrayField(flat.imageFile),
		videoFile: parseJsonArrayField(flat.videoFile),
		travelByAir: parseJsonArrayField(flat.travelByAir),
		travelByTrain: parseJsonArrayField(flat.travelByTrain),
		travelByBus: parseJsonArrayField(flat.travelByBus),
		travelByRoad: parseJsonArrayField(flat.travelByRoad),
	});
}

function normalizeRawDocuments(batch: unknown[]): Record<string, unknown>[] {
	return batch.map((doc) => {
		const row = normalizeMongoDoc(doc) as Record<string, unknown>;
		if (row._id && typeof row._id === "object" && "$oid" in row._id) {
			return { ...row, id: (row._id as { $oid: string }).$oid };
		}
		if (row._id) {
			return { ...row, id: String(row._id) };
		}
		return row;
	});
}

function parseRawCursorId(id: unknown): number | null {
	if (id == null || id === 0) return null;
	if (typeof id === "number") return id === 0 ? null : id;
	if (typeof id === "object" && "$numberLong" in id) {
		const n = Number((id as { $numberLong: string }).$numberLong);
		return Number.isFinite(n) && n !== 0 ? n : null;
	}
	const n = Number(id);
	return Number.isFinite(n) && n !== 0 ? n : null;
}

function parseRawCursorBatch(result: unknown): {
	docs: Record<string, unknown>[];
	cursorId: number | null;
} {
	if (!result || typeof result !== "object") {
		return { docs: [], cursorId: null };
	}
	const cursor = (result as {
		cursor?: { firstBatch?: unknown[]; nextBatch?: unknown[]; id?: unknown };
	}).cursor;
	if (!cursor) return { docs: [], cursorId: null };

	const batch = cursor.firstBatch ?? cursor.nextBatch;
	const docs = Array.isArray(batch) ? normalizeRawDocuments(batch) : [];
	return { docs, cursorId: parseRawCursorId(cursor.id) };
}

/** MongoDB defaults find batchSize to 101 — firstBatch is capped without an explicit batchSize. */
const RAW_FIND_MAX_BATCH = 10_000;

/**
 * Raw Mongo find — passes through only the caller's filter (no status/lang defaults).
 * Uses a single find + large batchSize (getMore is unreliable via Prisma $runCommandRaw).
 */
export async function rawFindCollection(params: {
	collection: string;
	filter: Record<string, unknown>;
	skip?: number;
	limit?: number;
	sort?: Record<string, 1 | -1>;
}): Promise<Record<string, unknown>[]> {
	const maxDocs = params.limit;
	const batchSize = maxDocs != null ? maxDocs : RAW_FIND_MAX_BATCH;

	const command: Record<string, unknown> = {
		find: params.collection,
		filter: params.filter,
		batchSize,
	};
	if (params.sort) command.sort = params.sort;
	if (params.skip != null) command.skip = params.skip;
	if (maxDocs != null) command.limit = maxDocs;

	const result = await prisma.$runCommandRaw(command as Prisma.InputJsonObject);
	const { docs } = parseRawCursorBatch(result);
	return maxDocs != null ? docs.slice(0, maxDocs) : docs;
}

/** Load one document by id via raw Mongo (includes pre-migration root fields). */
export async function rawFindById(
	collection: string,
	id: string
): Promise<Record<string, unknown> | null> {
	const rows = await rawFindCollection({
		collection,
		filter: { _id: { $oid: id } },
		limit: 1,
	});
	return rows[0] ?? null;
}

export async function rawCountCollection(
	collection: string,
	filter: Record<string, unknown>
): Promise<number> {
	const result = await prisma.$runCommandRaw({
		count: collection,
		query: filter,
	} as Prisma.InputJsonObject);
	const n = (result as { n?: number })?.n;
	return typeof n === "number" ? n : 0;
}

export function buildPrismaStatusFilter(
	status?: string
): Prisma.TempleWhereInput | undefined {
	if (!status) return undefined;
	return {
		status: { equals: status, mode: "insensitive" },
	};
}

export async function findTemplesWithOptionalSearch(params: {
	locale: ContentLang;
	search?: string;
	state?: string;
	city?: string;
	status?: string;
	skip?: number;
	limit?: number;
}): Promise<{ rows: Record<string, unknown>[]; total: number }> {
	const baseFilter: Record<string, unknown> = {};
	if (params.status) {
		baseFilter.status = { $regex: `^${params.status}$`, $options: "i" };
	}
	if (params.state) {
		baseFilter.state = { $regex: params.state, $options: "i" };
	}
	if (params.city) {
		baseFilter.city = { $regex: params.city, $options: "i" };
	}

	const searchOr = buildTranslationSearchOr("temple", params.search ?? "");
	const filter = mergeSearchIntoFilter(baseFilter, searchOr);

	// Raw Mongo read preserves legacy root fields (name, etc.) until migration completes.
	const [rows, total] = await Promise.all([
		rawFindCollection({
			collection: "Temple",
			filter,
			skip: params.skip,
			limit: params.limit,
			sort: { createdAt: -1 },
		}),
		rawCountCollection("Temple", filter),
	]);

	return { rows, total };
}

export async function findDharamshalasWithOptionalSearch(params: {
	search?: string;
	state?: string;
	city?: string;
	status?: string;
	skip?: number;
	limit?: number;
}): Promise<{ rows: Record<string, unknown>[]; total: number }> {
	const baseFilter: Record<string, unknown> = {};
	if (params.status) {
		baseFilter.status = { $regex: `^${params.status}$`, $options: "i" };
	}
	if (params.state) {
		baseFilter.state = { $regex: params.state, $options: "i" };
	}
	if (params.city) {
		baseFilter.city = { $regex: params.city, $options: "i" };
	}

	const searchOr = buildTranslationSearchOr("dharamshala", params.search ?? "");
	const filter = mergeSearchIntoFilter(baseFilter, searchOr);

	const [rows, total] = await Promise.all([
		rawFindCollection({
			collection: "Dharamshala",
			filter,
			skip: params.skip,
			limit: params.limit,
			sort: { createdAt: -1 },
		}),
		rawCountCollection("Dharamshala", filter),
	]);

	return { rows, total };
}

export async function findEventsWithOptionalSearch(params: {
	search?: string;
	category?: string;
	type?: string;
	status?: string;
	skip?: number;
	limit?: number;
}): Promise<{ rows: Record<string, unknown>[]; total: number }> {
	const baseFilter: Record<string, unknown> = {};
	if (params.status) {
		baseFilter.status = { $regex: `^${params.status}$`, $options: "i" };
	}
	if (params.category) {
		baseFilter.category = { $regex: params.category, $options: "i" };
	}
	if (params.type) {
		baseFilter.type = { $regex: params.type, $options: "i" };
	}

	const searchOr = buildTranslationSearchOr("event", params.search ?? "");
	if (params.search?.trim()) {
		searchOr.push(
			{ category: { $regex: params.search, $options: "i" } },
			{ type: { $regex: params.search, $options: "i" } }
		);
	}
	const filter = mergeSearchIntoFilter(baseFilter, searchOr);

	const [rows, total] = await Promise.all([
		rawFindCollection({
			collection: "Event",
			filter,
			skip: params.skip,
			limit: params.limit,
			sort: { createdAt: -1 },
		}),
		rawCountCollection("Event", filter),
	]);
	return { rows, total };
}

export async function findBlogs(params?: {
	skip?: number;
	limit?: number;
}): Promise<{ rows: Record<string, unknown>[]; total: number }> {
	const filter: Record<string, unknown> = {};
	const [rows, total] = await Promise.all([
		rawFindCollection({
			collection: "Blog",
			filter,
			skip: params?.skip,
			limit: params?.limit,
			sort: { createdAt: -1 },
		}),
		rawCountCollection("Blog", filter),
	]);
	return { rows, total };
}
