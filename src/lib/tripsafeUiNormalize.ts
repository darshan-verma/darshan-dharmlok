/**
 * Best-effort extraction from TripJack TripSafe JSON (structures vary by environment).
 */

/** TripJack docs: start ≈ today + 1 month, end = start + 2 days (YYYY-MM-DD). */
export function getTripsafeDefaultTripDates(): { sd: string; ed: string } {
	const sd = new Date();
	sd.setMonth(sd.getMonth() + 1);
	const ed = new Date(sd);
	ed.setDate(ed.getDate() + 2);
	const fmt = (d: Date) => d.toISOString().split("T")[0];
	return { sd: fmt(sd), ed: fmt(ed) };
}

export interface ExtractedInsurancePlanProduct {
	plid: string;
	pid: string;
	title?: string;
	rawPlan?: unknown;
	rawProduct?: unknown;
}

function asRecord(v: unknown): Record<string, unknown> | null {
	return v && typeof v === "object" && !Array.isArray(v)
		? (v as Record<string, unknown>)
		: null;
}

/** Provider may return `{ isr }` or wrap once as `{ data: { isr } }`. */
function tripjackInsuranceRootCandidates(searchData: unknown): Record<string, unknown>[] {
	const root = asRecord(searchData);
	if (!root) return [];
	const nested = asRecord(root.data);
	const seen = new Set<unknown>();
	const out: Record<string, unknown>[] = [];
	for (const r of nested && nested !== root ? [root, nested] : [root]) {
		if (seen.has(r)) continue;
		seen.add(r);
		out.push(r);
	}
	return out;
}

function pushProductsFromPlan(plan: Record<string, unknown>, out: ExtractedInsurancePlanProduct[]) {
	const plid = plan.plid != null ? String(plan.plid) : "";
	const pi = plan.pi;
	if (!Array.isArray(pi) || !plid) return;
	const planTitle =
		typeof plan.pn === "string"
			? plan.pn
			: typeof plan.pln === "string"
				? plan.pln
				: undefined;
	for (const p of pi) {
		const pr = asRecord(p);
		if (!pr) continue;
		const pid = pr.pid != null ? String(pr.pid) : "";
		if (!pid) continue;
		const tier = typeof pr.pi === "string" ? pr.pi : undefined;
		const sumLabel = typeof pr.pn === "string" ? pr.pn : undefined;
		const title =
			[tier, sumLabel].filter(Boolean).join(" · ") ||
			(typeof pr.pt === "string" && pr.pt) ||
			planTitle;
		out.push({
			plid,
			pid,
			title,
			rawPlan: plan,
			rawProduct: pr,
		});
	}
}

function collectInsurancePlanProductsFromRoot(root: Record<string, unknown>): ExtractedInsurancePlanProduct[] {
	const local: ExtractedInsurancePlanProduct[] = [];

	const tryPli = (pli: unknown) => {
		if (!Array.isArray(pli)) return;
		for (const plan of pli) {
			const pr = asRecord(plan);
			if (pr) pushProductsFromPlan(pr, local);
		}
	};

	const isr = asRecord(root.isr);
	const iinfo = isr ? asRecord(isr.iinfo) : null;
	if (iinfo?.pli != null) tryPli(iinfo.pli);
	else if (isr?.pli != null) tryPli(isr.pli);
	else if (root.iinfo != null) tryPli(asRecord(root.iinfo)?.pli);
	else if (root.pli != null) tryPli(root.pli);

	return local;
}

/** Collect flat plan-product pairs from search (or similar) payloads */
export function extractInsurancePlanProducts(searchData: unknown): ExtractedInsurancePlanProduct[] {
	const seen = new Set<string>();
	const out: ExtractedInsurancePlanProduct[] = [];
	for (const root of tripjackInsuranceRootCandidates(searchData)) {
		for (const item of collectInsurancePlanProductsFromRoot(root)) {
			const key = `${item.plid}:${item.pid}`;
			if (seen.has(key)) continue;
			seen.add(key);
			out.push(item);
		}
	}
	return out;
}

/**
 * First plan/product ids — mirrors TripJack patterns:
 * `isr.iinfo.pli[0].plid` and `isr.iinfo.pli[0].pi[0].pid`, including `data.isr` wrapper.
 */
export function extractPrimaryInsurancePlanIds(searchData: unknown): {
	plid: string;
	pid: string;
} | null {
	const list = extractInsurancePlanProducts(searchData);
	const first = list[0];
	return first?.plid && first?.pid ? { plid: first.plid, pid: first.pid } : null;
}

/** Best-effort first `pli[0]` ids (even if `pid` missing) — for diagnostics vs Review requirements. */
export function extractFirstInsurancePlanRawIds(searchData: unknown): {
	plid?: string;
	pid?: string;
} | null {
	for (const root of tripjackInsuranceRootCandidates(searchData)) {
		const isr = asRecord(root.isr);
		const iinfo = isr ? asRecord(isr.iinfo) : null;
		const pliRaw = iinfo?.pli ?? isr?.pli ?? asRecord(root.iinfo)?.pli ?? root.pli;
		if (!Array.isArray(pliRaw) || !pliRaw.length) continue;
		const plan = asRecord(pliRaw[0]);
		if (!plan) continue;
		const plid = plan.plid != null ? String(plan.plid).trim() : "";
		const pi = plan.pi;
		const firstPi = Array.isArray(pi) ? asRecord(pi[0]) : null;
		const pid = firstPi?.pid != null ? String(firstPi.pid).trim() : "";
		const out: { plid?: string; pid?: string } = {};
		if (plid) out.plid = plid;
		if (pid) out.pid = pid;
		return Object.keys(out).length ? out : null;
	}
	return null;
}

export function extractBookingIdFromReview(data: unknown): string | undefined {
	const r = asRecord(data);
	if (!r) return undefined;
	if (typeof r.bid === "string" && r.bid.trim()) return r.bid.trim();
	if (typeof r.bookingId === "string" && r.bookingId.trim()) return r.bookingId.trim();
	return undefined;
}

/** Surface a payable total from review/pricing blobs when possible */
export function extractSuggestedWalletAmount(data: unknown): number | undefined {
	const asRecord = (v: unknown): Record<string, unknown> | null =>
		v && typeof v === "object" && !Array.isArray(v)
			? (v as Record<string, unknown>)
			: null;

	const root = asRecord(data);
	const iinfo = asRecord(root?.iinfo);
	const pli = iinfo?.pli;
	if (Array.isArray(pli)) {
		for (const plan of pli) {
			const products = asRecord(plan)?.pi;
			if (!Array.isArray(products)) continue;
			for (const product of products) {
				const tfd = asRecord(product)?.tfd;
				const total = asRecord(asRecord(tfd)?.ifc)?.TF;
				if (typeof total === "number" && Number.isFinite(total) && total > 0) {
					return total;
				}
			}
		}
	}

	const walk = (v: unknown, depth: number): number | undefined => {
		if (depth > 20) return undefined;
		if (Array.isArray(v)) {
			for (const item of v) {
				const n = walk(item, depth + 1);
				if (n != null) return n;
			}
			return undefined;
		}
		const o = asRecord(v);
		if (!o) return undefined;
		for (const key of ["TF", "tf", "totalFare", "amount", "payable"]) {
			const x = o[key];
			if (typeof x === "number" && Number.isFinite(x) && x > 0) return x;
			if (typeof x === "string" && x.trim()) {
				const n = Number.parseFloat(x);
				if (Number.isFinite(n) && n > 0) return n;
			}
		}
		for (const val of Object.values(o)) {
			const n = walk(val, depth + 1);
			if (n != null) return n;
		}
		return undefined;
	};
	return walk(data, 0);
}

export interface TripsafeBookingTravellerSummary {
	id?: number;
	name: string;
	age?: number;
	email?: string;
	phone?: string;
	policyNumber?: string;
}

export interface TripsafeBookingSummary {
	bookingId?: string;
	status?: string;
	amount?: number;
	createdOn?: string;
	coverageStart?: string;
	coverageEnd?: string;
	planTitle?: string;
	travellers: TripsafeBookingTravellerSummary[];
}

export interface TripsafeCancellationTarget {
	plid: string;
	pid: string;
	travellerId: number;
	label: string;
}

function insuranceDetailsRoot(data: unknown): Record<string, unknown> | null {
	const root = asRecord(data);
	if (!root) return null;
	const nested = asRecord(root.data);
	return nested && nested !== root ? nested : root;
}

function insuranceItemInfo(data: unknown): Record<string, unknown> | null {
	const root = insuranceDetailsRoot(data);
	if (!root) return null;
	const itemInfos = asRecord(root.itemInfos);
	const insurance = asRecord(itemInfos?.INSURANCE);
	return asRecord(insurance?.iinfo) ?? insurance;
}

function productTitle(product: Record<string, unknown>): string | undefined {
	const tier = typeof product.pi === "string" ? product.pi : undefined;
	const sumLabel = typeof product.pn === "string" ? product.pn : undefined;
	return [tier, sumLabel].filter(Boolean).join(" · ") || undefined;
}

/** Customer-facing booking summary from insurance booking-details payload. */
export function extractInsuranceBookingSummary(
	data: unknown,
): TripsafeBookingSummary | null {
	const root = insuranceDetailsRoot(data);
	if (!root) return null;

	const order = asRecord(root.order);
	const iinfo = insuranceItemInfo(data);
	const pli = Array.isArray(iinfo?.pli) ? iinfo!.pli : [];
	const firstPlan = pli.length ? asRecord(pli[0]) : null;
	const products = Array.isArray(firstPlan?.pi) ? firstPlan!.pi : [];
	const firstProduct = products.length ? asRecord(products[0]) : null;

	const insuranceBlock = asRecord(asRecord(root.itemInfos)?.INSURANCE);
	const isq = asRecord(insuranceBlock?.isq) ?? asRecord(iinfo?.isq);

	const travellers: TripsafeBookingTravellerSummary[] = [];
	const itiSource =
		(Array.isArray(firstProduct?.iti) && firstProduct!.iti) ||
		(Array.isArray(isq?.iti) && isq!.iti) ||
		[];
	for (const row of itiSource) {
		const t = asRecord(row);
		if (!t) continue;
		const fn = typeof t.fn === "string" ? t.fn.trim() : "";
		const ln = typeof t.ln === "string" ? t.ln.trim() : "";
		const name = [fn, ln].filter(Boolean).join(" ");
		if (!name) continue;
		travellers.push({
			id: typeof t.id === "number" ? t.id : undefined,
			name,
			age: typeof t.age === "number" ? t.age : undefined,
			email: typeof t.eid === "string" ? t.eid : undefined,
			phone: typeof t.pnum === "string" ? t.pnum : undefined,
			policyNumber:
				typeof t.policyId === "string" ? t.policyId : undefined,
		});
	}

	return {
		bookingId:
			(typeof order?.bookingId === "string" && order.bookingId) ||
			undefined,
		status: typeof order?.status === "string" ? order.status : undefined,
		amount: typeof order?.amount === "number" ? order.amount : undefined,
		createdOn:
			typeof order?.createdOn === "string" ? order.createdOn : undefined,
		coverageStart: typeof isq?.sd === "string" ? isq.sd : undefined,
		coverageEnd: typeof isq?.ed === "string" ? isq.ed : undefined,
		planTitle: firstProduct ? productTitle(firstProduct) : undefined,
		travellers,
	};
}

/** Rows usable for cancellation `travellerKeys` without exposing raw API ids in the UI. */
export function extractInsuranceCancellationTargets(
	data: unknown,
): TripsafeCancellationTarget[] {
	const iinfo = insuranceItemInfo(data);
	const pli = Array.isArray(iinfo?.pli) ? iinfo!.pli : [];
	const out: TripsafeCancellationTarget[] = [];

	for (const plan of pli) {
		const planRec = asRecord(plan);
		const plid = planRec?.plid != null ? String(planRec.plid).trim() : "";
		if (!plid) continue;
		const products = Array.isArray(planRec?.pi) ? planRec!.pi : [];
		for (const product of products) {
			const prod = asRecord(product);
			const pid = prod?.pid != null ? String(prod.pid).trim() : "";
			if (!pid) continue;
			const iti = Array.isArray(prod?.iti) ? prod!.iti : [];
			for (const row of iti) {
				const t = asRecord(row);
				const travellerId =
					typeof t?.id === "number" ? t.id : Number.parseInt(String(t?.id), 10);
				if (!Number.isFinite(travellerId)) continue;
				const fn = typeof t?.fn === "string" ? t.fn.trim() : "";
				const ln = typeof t?.ln === "string" ? t.ln.trim() : "";
				const age = typeof t?.age === "number" ? `, age ${t.age}` : "";
				const label = [fn, ln].filter(Boolean).join(" ") + age || `Traveller ${travellerId}`;
				out.push({ plid, pid, travellerId, label: label.trim() });
			}
		}
	}

	return out;
}
