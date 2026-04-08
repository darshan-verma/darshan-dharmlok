import type {
	TripjackHotelRoomType,
	TripjackHotelStaticDetailResponse,
} from "@/types/tripjack";

function isRecord(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function coerceNumber(v: unknown): number | undefined {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string" && v.trim() !== "") {
		const n = parseFloat(v);
		return Number.isFinite(n) ? n : undefined;
	}
	return undefined;
}

function pickHotelLike(obj: unknown): Record<string, unknown> | null {
	if (!isRecord(obj)) return null;
	if (
		obj.tjHotelId != null ||
		obj.hid != null ||
		(typeof obj.name === "string" && obj.name.length > 0) ||
		obj.locale != null ||
		obj.images != null ||
		obj.rooms != null ||
		obj.unicaId != null
	) {
		return obj;
	}
	return null;
}

/** Prefer nested `data` / `hotel` payloads over a thin wrapper that only has tjHotelId + status */
function scoreHotelRichness(o: Record<string, unknown>): number {
	let n = 0;
	if (typeof o.name === "string" && o.name.trim()) n += 25;
	if (isRecord(o.locale)) n += 10;
	if (Array.isArray(o.images) && o.images.length > 0)
		n += 8 + Math.min(o.images.length, 15);
	if (isRecord(o.rooms) && Object.keys(o.rooms).length > 0)
		n += 8 + Math.min(Object.keys(o.rooms).length, 30);
	if (isRecord(o.amenities) && Object.keys(o.amenities).length > 0)
		n += 6 + Math.min(Object.keys(o.amenities).length, 40);
	if (isRecord(o.descriptions) && Object.keys(o.descriptions).length > 0)
		n += 5;
	if (o.policies != null) n += 4;
	if (o.chain != null) n += 2;
	if (o.property_type != null) n += 2;
	if (o.tjHotelId != null || o.hid != null) n += 1;
	return n;
}

const UNWRAP_CHILD_KEYS = [
	"data",
	"result",
	"hotel",
	"payload",
	"body",
	"hotelDetail",
	"staticDetail",
	"content",
	"details",
	"property",
	"hotelStaticContent",
] as const;

/**
 * Unwrap nested TripJack / proxy envelopes. Picks the **richest** hotel-like node
 * (so we do not stop at `{ tjHotelId, status, data: { full hotel } }`).
 */
function unwrapStaticPayload(
	raw: unknown,
	requestedHid: string,
): Record<string, unknown> {
	if (!isRecord(raw)) return {};

	const queue: unknown[] = [raw];
	const seen = new Set<unknown>();
	let best: Record<string, unknown> | null = null;
	let bestScore = -1;

	while (queue.length > 0) {
		const cur = queue.shift();
		if (!isRecord(cur) || seen.has(cur)) continue;
		seen.add(cur);

		const hit = pickHotelLike(cur);
		if (hit) {
			const score = scoreHotelRichness(hit);
			if (score > bestScore) {
				bestScore = score;
				best = hit;
			}
		}

		for (const key of UNWRAP_CHILD_KEYS) {
			const inner = cur[key];
			if (isRecord(inner)) queue.push(inner);
		}
	}

	if (!best) return { ...raw };

	const root = raw;
	const merged: Record<string, unknown> = { ...best };
	merged.tjHotelId = String(
		best.tjHotelId ??
			best.hid ??
			(isRecord(root) ? root.tjHotelId ?? root.hid : null) ??
			requestedHid,
	);
	if (typeof merged.unicaId !== "string" && isRecord(root)) {
		const u = root.unicaId;
		if (typeof u === "string") merged.unicaId = u;
	}
	if (merged.status == null && isRecord(root) && root.status != null) {
		merged.status = root.status;
	}
	return merged;
}

function normalizeStringArray(v: unknown): string[] | undefined {
	if (!Array.isArray(v)) return undefined;
	const out = v.filter((x) => typeof x === "string") as string[];
	return out.length ? out : undefined;
}

function normalizeLinks(links: unknown): Record<string, { href: string }> {
	if (typeof links === "string" && links.trim())
		return { default: { href: links } };
	if (!isRecord(links)) return {};
	const out: Record<string, { href: string }> = {};
	for (const [k, val] of Object.entries(links)) {
		if (typeof val === "string" && val.trim()) {
			out[k] = { href: val };
		} else if (isRecord(val)) {
			const href =
				typeof val.href === "string"
					? val.href
					: typeof val.url === "string"
						? val.url
						: typeof val.link === "string"
							? val.link
							: undefined;
			if (href) out[k] = { href };
		}
	}
	return out;
}

function normalizeHotelImageEntry(
	img: unknown,
): TripjackHotelStaticDetailResponse["images"] extends (infer E)[] | undefined
	? E
	: never {
	if (!isRecord(img)) {
		return {
			links: {},
		} as never;
	}
	let links = normalizeLinks(img.links);
	if (Object.keys(links).length === 0) {
		if (typeof img.url === "string" && img.url.trim()) {
			links = { original: { href: img.url } };
		} else if (typeof img.href === "string" && img.href.trim()) {
			links = { original: { href: img.href } };
		} else if (typeof img.link === "string" && img.link.trim()) {
			links = { original: { href: img.link } };
		}
	}
	const isHero =
		img.is_hero_image === true ||
		img.hero_image === true ||
		img.isHeroImage === true;
	return {
		...(typeof img.caption === "string" ? { caption: img.caption } : {}),
		...(isHero ? { is_hero_image: true } : {}),
		...(typeof img.category === "number" ? { category: img.category } : {}),
		links,
	} as never;
}

function normalizeRoomImageEntry(img: unknown): TripjackHotelRoomType["images"] extends
	| (infer E)[]
	| undefined
	? E
	: never {
	if (!isRecord(img)) return { links: {} } as never;
	let links = normalizeLinks(img.links);
	if (Object.keys(links).length === 0) {
		if (typeof img.url === "string" && img.url.trim()) {
			links = { original: { href: img.url } };
		} else if (typeof img.href === "string" && img.href.trim()) {
			links = { original: { href: img.href } };
		} else if (typeof img.link === "string" && img.link.trim()) {
			links = { original: { href: img.link } };
		}
	}
	const hero =
		img.hero_image === true ||
		img.is_hero_image === true ||
		img.isHeroImage === true;
	return {
		...(hero ? { hero_image: true } : {}),
		...(typeof img.caption === "string" ? { caption: img.caption } : {}),
		...(typeof img.category === "number" ? { category: img.category } : {}),
		links,
	} as never;
}

function normalizeLocale(
	loc: unknown,
): TripjackHotelStaticDetailResponse["locale"] {
	if (!isRecord(loc)) return undefined;
	const coordsRaw = loc.coordinates;
	let coordinates: { lat: number; long: number } | undefined;
	if (isRecord(coordsRaw)) {
		const lat = coerceNumber(coordsRaw.lat);
		const long = coerceNumber(coordsRaw.long ?? coordsRaw.lng);
		if (lat != null && long != null) coordinates = { lat, long };
	}
	const address = isRecord(loc.address)
		? (loc.address as NonNullable<
				NonNullable<TripjackHotelStaticDetailResponse["locale"]>["address"]
			>)
		: undefined;
	const phone = normalizeStringArray(loc.phone);
	const fax = normalizeStringArray(loc.fax);
	const email = normalizeStringArray(loc.email);
	const out: NonNullable<TripjackHotelStaticDetailResponse["locale"]> = {};
	if (address && Object.keys(address).length > 0) out.address = address;
	if (coordinates) out.coordinates = coordinates;
	if (phone?.length) out.phone = phone;
	if (fax?.length) out.fax = fax;
	if (email?.length) out.email = email;
	return Object.keys(out).length > 0 ? out : undefined;
}

function normalizePolicies(
	pol: unknown,
): TripjackHotelStaticDetailResponse["policies"] {
	if (!isRecord(pol)) return undefined;
	const out = { ...pol } as Record<string, unknown>;
	const hr = out.houseRules ?? out.house_rules;
	if (hr && isRecord(hr)) {
		out.houseRules = hr as Record<string, string>;
		delete out.house_rules;
	}
	const cico =
		out.checkInCheckOut ??
		out.check_in_check_out ??
		out.checkin_checkout;
	if (cico && isRecord(cico)) {
		out.checkInCheckOut = cico as NonNullable<
			NonNullable<TripjackHotelStaticDetailResponse["policies"]>["checkInCheckOut"]
		>;
		delete out.check_in_check_out;
		delete out.checkin_checkout;
	}
	return out as TripjackHotelStaticDetailResponse["policies"];
}

function normalizeDescriptions(
	desc: unknown,
): TripjackHotelStaticDetailResponse["descriptions"] {
	if (!isRecord(desc)) return undefined;
	const out: Record<string, string> = {};
	for (const [k, v] of Object.entries(desc)) {
		if (typeof v === "string") out[k] = v;
	}
	return Object.keys(out).length ? out : undefined;
}

function normalizeAmenities(
	am: unknown,
): TripjackHotelStaticDetailResponse["amenities"] {
	if (!isRecord(am)) return undefined;
	const out: Record<string, { id: string; name: string }> = {};
	for (const [k, v] of Object.entries(am)) {
		if (!isRecord(v)) continue;
		const label =
			(typeof v.name === "string" && v.name) ||
			(typeof v.text === "string" && v.text) ||
			(typeof v.label === "string" && v.label) ||
			(typeof v.title === "string" && v.title);
		if (label) {
			out[k] = {
				id: String(v.id ?? k),
				name: label,
			};
		}
	}
	return Object.keys(out).length ? out : undefined;
}

function normalizeRooms(
	rooms: unknown,
): TripjackHotelStaticDetailResponse["rooms"] {
	if (!isRecord(rooms)) return undefined;
	const out: Record<string, TripjackHotelRoomType> = {};
	for (const [key, rv] of Object.entries(rooms)) {
		if (!isRecord(rv)) continue;
		const id = String(rv.id ?? key);
		const name = typeof rv.name === "string" ? rv.name : id;
		const rawImages = rv.images;
		const images = Array.isArray(rawImages)
			? rawImages
					.map(normalizeRoomImageEntry)
					.filter((im) => im && Object.keys(im.links || {}).length > 0)
			: undefined;
		const roomAmenities = isRecord(rv.amenities)
			? normalizeAmenities(rv.amenities)
			: undefined;
		out[key] = {
			id,
			name,
			...(typeof rv.room_count === "number" ? { room_count: rv.room_count } : {}),
			...(typeof rv.living_room_count === "number"
				? { living_room_count: rv.living_room_count }
				: {}),
			...(typeof rv.room_inventory === "string"
				? { room_inventory: rv.room_inventory }
				: {}),
			...(isRecord(rv.descriptions) ? { descriptions: rv.descriptions as { overview?: string } } : {}),
			...(roomAmenities ? { amenities: roomAmenities } : {}),
			...(images?.length ? { images } : {}),
			...(isRecord(rv.bed_config) ? { bed_config: rv.bed_config as TripjackHotelRoomType["bed_config"] } : {}),
			...(isRecord(rv.area) ? { area: rv.area as TripjackHotelRoomType["area"] } : {}),
			...(isRecord(rv.views) ? { views: rv.views as TripjackHotelRoomType["views"] } : {}),
			...(isRecord(rv.occupancy) ? { occupancy: rv.occupancy as TripjackHotelRoomType["occupancy"] } : {}),
		};
	}
	return Object.keys(out).length ? out : undefined;
}

function isProviderCoreMissing(src: Record<string, unknown>): boolean {
	const hasName = Boolean(String(src.name ?? "").trim());
	let hasLocale = false;
	if (isRecord(src.locale)) {
		const a = src.locale.address;
		if (isRecord(a)) {
			hasLocale = Object.values(a).some(
				(v) => typeof v === "string" && v.trim().length > 0,
			);
		}
		if (!hasLocale && src.locale.coordinates) hasLocale = true;
		if (!hasLocale && normalizeStringArray(src.locale.phone)?.length)
			hasLocale = true;
	}
	const hasImages = Array.isArray(src.images) && src.images.length > 0;
	const desc = src.descriptions;
	let hasDesc = false;
	if (isRecord(desc)) {
		hasDesc = Object.values(desc).some(
			(v) => typeof v === "string" && v.trim().length > 0,
		);
	}
	return !hasName && !hasLocale && !hasImages && !hasDesc;
}

export type TripjackStaticDetailNormalizeResult = {
	data: TripjackHotelStaticDetailResponse;
	/** True when the supplier payload lacked name, locale, images, and descriptions */
	providerCoreMissing: boolean;
};

/**
 * Normalize raw TripJack static-detail JSON to the shape expected by the app UI.
 */
export function normalizeTripjackStaticDetail(
	raw: unknown,
	requestedHid: string,
): TripjackStaticDetailNormalizeResult {
	const src = unwrapStaticPayload(raw, requestedHid);
	const providerCoreMissing = isProviderCoreMissing(src);

	const tjHotelId = String(src.tjHotelId ?? src.hid ?? requestedHid);
	const name = typeof src.name === "string" ? src.name : "";
	const is_active = src.is_active !== false;

	let rawImages: unknown = src.images;
	if (isRecord(rawImages)) rawImages = [rawImages];
	const images = Array.isArray(rawImages)
		? rawImages
				.map(normalizeHotelImageEntry)
				.filter((im) => im && Object.keys(im.links || {}).length > 0)
		: undefined;

	const statusRaw = src.status;
	const status =
		isRecord(statusRaw) && typeof statusRaw.success === "boolean"
			? { success: statusRaw.success }
			: { success: true };

	const localeNorm = normalizeLocale(src.locale);
	const policiesNorm = normalizePolicies(src.policies);
	const amenitiesNorm = normalizeAmenities(src.amenities);
	const descriptionsNorm = normalizeDescriptions(src.descriptions);
	const roomsNorm = normalizeRooms(src.rooms);

	const data: TripjackHotelStaticDetailResponse = {
		tjHotelId,
		name,
		is_active,
		status,
		...(typeof src.unicaId === "string" ? { unicaId: src.unicaId } : {}),
		...(typeof src.star_rating === "string" || typeof src.star_rating === "number"
			? { star_rating: String(src.star_rating) }
			: {}),
		...(isRecord(src.property_type) &&
		(src.property_type.name != null || src.property_type.id != null)
			? {
					property_type: {
						id: String(src.property_type.id ?? ""),
						name: String(src.property_type.name ?? ""),
					},
				}
			: {}),
		...(isRecord(src.chain) ? { chain: src.chain as TripjackHotelStaticDetailResponse["chain"] } : {}),
		...(localeNorm ? { locale: localeNorm } : {}),
		...(policiesNorm ? { policies: policiesNorm } : {}),
		...(amenitiesNorm ? { amenities: amenitiesNorm } : {}),
		...(images?.length ? { images } : {}),
		...(descriptionsNorm ? { descriptions: descriptionsNorm } : {}),
		...(roomsNorm ? { rooms: roomsNorm } : {}),
	};

	return { data, providerCoreMissing };
}
