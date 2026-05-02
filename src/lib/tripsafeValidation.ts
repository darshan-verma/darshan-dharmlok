import { z } from "zod";
import type {
	TripsafeAmendmentConfirmRequest,
	TripsafeAmendmentRaiseRequest,
	TripsafeBookRequest,
	TripsafeBookingDetailsRequest,
	TripsafeReviewRequest,
	TripsafeSearchRequest,
} from "@/types/tripsafe";

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

/** Indian mobile: optional +91, then 10 digits starting 6–9 */
export const INDIAN_MOBILE_REGEX =
	/^(\+91[\s-]?)?[6-9]\d{9}$|^[6-9]\d{9}$/;

const regionItemSchema = z.object({
	rkey: z.string().min(1),
	rt: z.enum(["POPULARREGION", "COUNTRY"]),
});

const searchIsqSchema = z
	.object({
		sd: z.string().regex(YYYY_MM_DD, "sd must be YYYY-MM-DD"),
		ed: z.string().regex(YYYY_MM_DD, "ed must be YYYY-MM-DD"),
		isc: z.object({
			iri: z.array(regionItemSchema).min(1, "At least one region is required"),
		}),
		iti: z
			.array(z.object({ age: z.number().int() }))
			.min(1)
			.max(10, "Max 10 travellers"),
		isp: z.record(z.unknown()).optional(),
		ict: z.literal("STUDENT").optional(),
		cd: z.union([
			z.literal(180),
			z.literal(365),
			z.literal(730),
			z.literal(1095),
		]).optional(),
	})
	.superRefine((val, ctx) => {
		const sd = new Date(`${val.sd}T00:00:00`);
		const ed = new Date(`${val.ed}T00:00:00`);
		if (Number.isNaN(sd.getTime()) || Number.isNaN(ed.getTime())) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Invalid date values",
			});
			return;
		}
		if (sd > ed) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "sd must be on or before ed",
			});
		}

		const student = val.ict === "STUDENT";
		const minAge = student ? 18 : 0;
		const maxAge = student ? 45 : 70;

		for (let i = 0; i < val.iti.length; i++) {
			const age = val.iti[i]?.age;
			if (age === undefined) continue;
			if (age < minAge || age > maxAge) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: student
						? `Traveller ${i + 1}: age must be 18–45 for STUDENT`
						: `Traveller ${i + 1}: age must be 0–70`,
					path: ["iti", i, "age"],
				});
			}
		}

		if (student && val.cd == null) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "cd (course duration days) is required when ict is STUDENT",
				path: ["cd"],
			});
		}
	});

const searchRequestSchema = z.object({
	isq: searchIsqSchema,
});

export function parseTripsafeSearch(
	body: unknown,
):
	| { ok: true; data: TripsafeSearchRequest }
	| { ok: false; error: string } {
	const parsed = searchRequestSchema.safeParse(body);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message || "Invalid search body",
		};
	}
	const base = parsed.data as TripsafeSearchRequest;
	const data: TripsafeSearchRequest = {
		isq: {
			...base.isq,
			isp: base.isq.isp ?? {},
		},
	};
	return { ok: true, data };
}

const reviewRequestSchema = z.object({
	pli: z
		.array(
			z.object({
				plid: z.string().min(1),
				pi: z
					.array(z.object({ pid: z.string().min(1) }))
					.min(1, "At least one product id per plan"),
			}),
		)
		.length(1, "Exactly one plan (plid) is allowed in review"),
});

export function parseTripsafeReview(
	body: unknown,
):
	| { ok: true; data: TripsafeReviewRequest }
	| { ok: false; error: string } {
	const parsed = reviewRequestSchema.safeParse(body);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message || "Invalid review body",
		};
	}
	return { ok: true, data: parsed.data as TripsafeReviewRequest };
}

const bookingDetailsSchema = z.object({
	bookingId: z.string().min(1, "bookingId is required"),
});

export function parseTripsafeBookingDetails(
	body: unknown,
):
	| { ok: true; data: TripsafeBookingDetailsRequest }
	| { ok: false; error: string } {
	const parsed = bookingDetailsSchema.safeParse(body);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message || "Invalid body",
		};
	}
	return { ok: true, data: parsed.data };
}

const amendmentRaiseSchema = z.object({
	bookingId: z.string().min(1),
	type: z.literal("CANCELLATION"),
	travellerKeys: z
		.record(
			z.record(z.array(z.object({ id: z.number().int().positive() })).min(1)),
		)
		.refine((o) => Object.keys(o).length > 0, "travellerKeys cannot be empty"),
});

export function parseTripsafeAmendmentRaise(
	body: unknown,
):
	| { ok: true; data: TripsafeAmendmentRaiseRequest }
	| { ok: false; error: string } {
	const parsed = amendmentRaiseSchema.safeParse(body);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message || "Invalid amendment body",
		};
	}
	return { ok: true, data: parsed.data };
}

const amendmentConfirmSchema = z.object({
	amendmentId: z.string().min(1),
	bookingId: z.string().min(1),
});

export function parseTripsafeAmendmentConfirm(
	body: unknown,
):
	| { ok: true; data: TripsafeAmendmentConfirmRequest }
	| { ok: false; error: string } {
	const parsed = amendmentConfirmSchema.safeParse(body);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message || "Invalid body",
		};
	}
	return { ok: true, data: parsed.data };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasNominee(ni: unknown): boolean {
	if (!isPlainObject(ni)) return false;
	return Object.keys(ni).length > 0;
}

/**
 * Validates each traveller under pli[].pi[].iti: fn/ln, nominee (ni), optional Indian pnum.
 */
export function validateTripsafeBookTravellers(payload: TripsafeBookRequest): string | null {
	const checkTraveller = (
		t: Record<string, unknown>,
		path: string,
	): string | null => {
		const fn = t.fn;
		const ln = t.ln;
		if (typeof fn !== "string" || typeof ln !== "string") {
			return `${path}: fn and ln are required`;
		}
		if (!fn.trim() || !ln.trim()) {
			return `${path}: fn and ln are required`;
		}
		if (!hasNominee(t.ni)) {
			return `${path}: nominee (ni) is required`;
		}
		const pnum = t.pnum;
		if (typeof pnum === "string" && pnum.trim()) {
			const normalized = pnum.replace(/\s/g, "");
			if (!INDIAN_MOBILE_REGEX.test(normalized)) {
				return `${path}: pnum must be a valid Indian mobile number`;
			}
		}
		return null;
	};

	for (let pi = 0; pi < payload.pli.length; pi++) {
		const plan = payload.pli[pi];
		const products = plan.pi;
		if (!Array.isArray(products)) continue;
		for (let pj = 0; pj < products.length; pj++) {
			const prod = products[pj] as Record<string, unknown>;
			const iti = prod.iti;
			if (!Array.isArray(iti)) continue;
			for (let k = 0; k < iti.length; k++) {
				const row = iti[k];
				if (!isPlainObject(row)) {
					return `pli[${pi}].pi[${pj}].iti[${k}]: invalid traveller object`;
				}
				const err = checkTraveller(row, `pli[${pi}].pi[${pj}].iti[${k}]`);
				if (err) return err;
			}
		}
	}

	return null;
}

const bookProductSchema = z
	.object({
		pid: z.string().min(1),
		iti: z
			.array(z.record(z.unknown()))
			.min(1, "Each product must include at least one traveller (iti)"),
	})
	.passthrough();

const bookBaseSchema = z
	.object({
		bookingId: z.string().min(1),
		paymentInfos: z.array(z.record(z.unknown())).min(1, "paymentInfos is required"),
		pli: z
			.array(
				z
					.object({
						plid: z.string().min(1),
						pi: z.array(bookProductSchema).min(1, "Each plan needs at least one product"),
					})
					.passthrough(),
			)
			.min(1, "pli is required"),
	})
	.passthrough();

export function parseTripsafeBook(
	body: unknown,
):
	| { ok: true; data: TripsafeBookRequest }
	| { ok: false; error: string } {
	const parsed = bookBaseSchema.safeParse(body);
	if (!parsed.success) {
		return {
			ok: false,
			error: parsed.error.issues[0]?.message || "Invalid book body",
		};
	}
	const data = parsed.data as TripsafeBookRequest;
	const travellerErr = validateTripsafeBookTravellers(data);
	if (travellerErr) {
		return { ok: false, error: travellerErr };
	}
	return { ok: true, data };
}
