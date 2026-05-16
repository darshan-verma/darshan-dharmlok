import type {
	TripjackBookingRequest,
	TripjackJourneyInfo,
	TripjackRouteDetails,
} from "@/types/tripjack";

/** Mirrors `TRIPJACK_PROVIDER_JOURNEY_TYPE_MAP` in quotes route — booking must use the same enums. */
const JOURNEY_TYPE_TO_PROVIDER: Record<string, string> = {
	airport_transfer: "AIRPORT_TRANSFER",
	AIRPORT_TRANSFER: "AIRPORT_TRANSFER",
	outstations: "OUTSTATION",
	OUTSTATION: "OUTSTATION",
	OUTSTATIONS: "OUTSTATION",
	local: "LOCAL",
	LOCAL: "LOCAL",
	rental: "RENTAL",
	RENTAL: "RENTAL",
};

const TRIP_TYPE_TO_PROVIDER: Record<string, string> = {
	oneway: "ONEWAY",
	ONEWAY: "ONEWAY",
	roundtrip: "ROUNDTRIP",
	ROUNDTRIP: "ROUNDTRIP",
	return: "RETURN",
	RETURN: "RETURN",
};

function stripNullFields<T extends Record<string, unknown>>(obj: T): T {
	const out = { ...obj } as Record<string, unknown>;
	for (const key of Object.keys(out)) {
		const v = out[key];
		if (v === null) {
			delete out[key];
		} else if (v && typeof v === "object" && !Array.isArray(v)) {
			out[key] = stripNullFields(v as Record<string, unknown>);
		}
	}
	return out as T;
}

function normalizeJourneyEnums(info: TripjackJourneyInfo): TripjackJourneyInfo {
	const jtRaw = String(info.journeyType || "").trim();
	const ttRaw = String(info.tripType || "").trim();
	const journeyType =
		JOURNEY_TYPE_TO_PROVIDER[jtRaw] ||
		JOURNEY_TYPE_TO_PROVIDER[jtRaw.toLowerCase()] ||
		jtRaw.toUpperCase();
	const tripType =
		TRIP_TYPE_TO_PROVIDER[ttRaw] ||
		TRIP_TYPE_TO_PROVIDER[ttRaw.toLowerCase()] ||
		ttRaw.toUpperCase();
	return {
		...info,
		journeyType,
		tripType,
	};
}

function formatMoneyString(value: unknown): string {
	const n =
		typeof value === "number"
			? value
			: typeof value === "string"
				? Number.parseFloat(value)
				: Number.NaN;
	if (!Number.isFinite(n)) {
		return "0.00";
	}
	return n.toFixed(2);
}

/**
 * TripJack's cab booking service can NPE (BigDecimal `intCompact`) when JSON contains explicit
 * `null` for optional numeric fields, or when journey/trip enums do not match the provider contract.
 */
export function normalizeTripjackCabBookingPayload(
	raw: TripjackBookingRequest,
): TripjackBookingRequest {
	const journeyInfoClean = stripNullFields({
		...(raw.journeyInfo as unknown as Record<string, unknown>),
	}) as unknown as TripjackJourneyInfo;
	const journeyInfo = normalizeJourneyEnums(journeyInfoClean);

	const routeDetail = stripNullFields({
		...(raw.routeDetail as unknown as Record<string, unknown>),
	}) as unknown as TripjackRouteDetails;

	const qVendor = Number(raw.quotationInfo.vendorId);
	const topVendor = Number(raw.vendorId);
	const safeVendorId = Number.isFinite(qVendor)
		? qVendor
		: Number.isFinite(topVendor)
			? topVendor
			: raw.vendorId;

	const agentIdRaw = raw.agentId;
	const agentId =
		typeof agentIdRaw === "number" && Number.isFinite(agentIdRaw)
			? agentIdRaw
			: (() => {
					const n = Number.parseInt(String(agentIdRaw).trim(), 10);
					return Number.isFinite(n) ? n : agentIdRaw;
				})();

	const netStr = formatMoneyString(raw.pricingInfo.netAmount);
	const grossStr = formatMoneyString(raw.pricingInfo.grossAmount);
	const netNum = Number.parseFloat(netStr);
	const grossNum = Number.parseFloat(grossStr);
	const impliedTjTax = Number.isFinite(netNum) && Number.isFinite(grossNum)
		? Math.max(0, Number((grossNum - netNum).toFixed(2)))
		: 0;

	const pi = raw.pricingInfo;
	const tjTaxRaw = pi.tjTaxAmount;
	const hasExplicitTjTax =
		tjTaxRaw !== undefined &&
		tjTaxRaw !== null &&
		String(tjTaxRaw).trim() !== "";
	const tjTaxAmount = hasExplicitTjTax
		? formatMoneyString(tjTaxRaw)
		: impliedTjTax.toFixed(2);

	const tjMfRaw = pi.tjManagementFee;
	const hasExplicitTjMf =
		tjMfRaw !== undefined &&
		tjMfRaw !== null &&
		String(tjMfRaw).trim() !== "";
	const tjManagementFee = hasExplicitTjMf
		? formatMoneyString(tjMfRaw)
		: "0.00";

	const pricingInfo = {
		...raw.pricingInfo,
		netAmount: netStr,
		addonsPrice: formatMoneyString(raw.pricingInfo.addonsPrice),
		grossAmount: grossStr,
		tjTaxAmount,
		tjManagementFee,
		agentMarkup: Number.isFinite(Number(raw.pricingInfo.agentMarkup))
			? Number(raw.pricingInfo.agentMarkup)
			: 0,
		agentMarkupSplitup: {
			onwardJourneyMarkup: Number(
				raw.pricingInfo.agentMarkupSplitup?.onwardJourneyMarkup ?? 0,
			),
			returnJourneyMarkup: Number(
				raw.pricingInfo.agentMarkupSplitup?.returnJourneyMarkup ?? 0,
			),
		},
	};

	return {
		...raw,
		journeyInfo,
		routeDetail,
		agentId,
		vendorId: safeVendorId,
		quotationInfo: {
			...raw.quotationInfo,
			vendorId: safeVendorId,
			paxCount: Number(raw.quotationInfo.paxCount) || 1,
			luggageCount: Math.max(0, Number(raw.quotationInfo.luggageCount) || 0),
		},
		pricingInfo,
		addons: Array.isArray(raw.addons) ? raw.addons : [],
	};
}
