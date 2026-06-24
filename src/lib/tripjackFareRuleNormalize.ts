import type {
	TripjackFareRuleResponse,
	TripjackFareRuleTfr,
	TripjackFareRuleTfrCategory,
	TripjackFareRulePolicy,
} from "@/types/tripjackFlight";
import type { FareRuleItem, FareRuleResponse } from "@/types/tbo";

const TFR_ORDER: TripjackFareRuleTfrCategory[] = [
	"CANCELLATION",
	"DATECHANGE",
	"NO_SHOW",
	"SEAT_CHARGEABLE",
];

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function formatFcs(fcs: Record<string, number> | undefined): string {
	if (!fcs || Object.keys(fcs).length === 0) return "";
	return Object.entries(fcs)
		.map(([k, v]) => `${k}: ${v}`)
		.join("; ");
}

function policyWindow(policy: TripjackFareRulePolicy): {
	from: string;
	to: string;
	unit: string;
} {
	if (policy.pp != null && policy.pp !== "") {
		return {
			from: "",
			to: "",
			unit: String(policy.pp).replace(/_/g, " "),
		};
	}
	const st = policy.st != null && policy.st !== "" ? String(policy.st) : "";
	const et = policy.et != null && policy.et !== "" ? String(policy.et) : "";
	if (st || et) {
		return {
			from: st ? `${st}h` : "",
			to: et ? `${et}h` : "",
			unit: st || et ? "before departure" : "",
		};
	}
	return { from: "", to: "", unit: "" };
}

function policyDetails(policy: TripjackFareRulePolicy): string {
	const parts: string[] = [];
	if (policy.policyInfo) parts.push(policy.policyInfo);
	if (typeof policy.amount === "number")
		parts.push(`Airline fee: ${policy.amount}`);
	if (typeof policy.additionalFee === "number")
		parts.push(`Dharmlok fee: ${policy.additionalFee}`);
	const fcsLine = formatFcs(policy.fcs);
	if (fcsLine) parts.push(fcsLine);
	return parts.join(". ") || "—";
}

function displayType(cat: TripjackFareRuleTfrCategory): string {
	switch (cat) {
		case "CANCELLATION":
			return "Cancellation";
		case "DATECHANGE":
			return "Reissue";
		case "NO_SHOW":
			return "No Show";
		case "SEAT_CHARGEABLE":
			return "Seat";
		default:
			return cat;
	}
}

function miniRowsForLeg(
	legKey: string,
	tfr: TripjackFareRuleTfr,
): Array<{
	JourneyPoints: string;
	Type: string;
	From: string;
	To: string;
	Unit: string;
	Details: string;
	OnlineReissueAllowed: boolean;
	OnlineRefundAllowed: boolean;
}> {
	const rows: Array<{
		JourneyPoints: string;
		Type: string;
		From: string;
		To: string;
		Unit: string;
		Details: string;
		OnlineReissueAllowed: boolean;
		OnlineRefundAllowed: boolean;
	}> = [];

	for (const cat of TFR_ORDER) {
		const policies = tfr[cat];
		if (!policies?.length) continue;
		for (const p of policies) {
			const { from, to, unit } = policyWindow(p);
			rows.push({
				JourneyPoints: legKey,
				Type: displayType(cat),
				From: from,
				To: to,
				Unit: unit,
				Details: policyDetails(p),
				OnlineReissueAllowed: false,
				OnlineRefundAllowed: false,
			});
		}
	}
	return rows;
}

function parseLegCodes(legKey: string): { origin: string; destination: string } {
	const idx = legKey.indexOf("-");
	if (idx <= 0) return { origin: legKey, destination: "" };
	return {
		origin: legKey.slice(0, idx),
		destination: legKey.slice(idx + 1),
	};
}

function fareRuleItemsFromMisc(
	legKey: string,
	miscInfo: string[],
): FareRuleItem[] {
	const { origin, destination } = parseLegCodes(legKey);
	const raw = miscInfo.filter(Boolean).join("\n\n");
	const safe = escapeHtml(raw);
	return [
		{
			Airline: "",
			Origin: origin,
			Destination: destination,
			FareBasisCode: "—",
			FareRuleDetail: `<pre class="whitespace-pre-wrap text-sm">${safe}</pre>`,
		},
	];
}

export function convertTripjackFareRuleToTboResponse(
	raw: TripjackFareRuleResponse,
	traceId: string = "",
): FareRuleResponse {
	const status = raw.status;
	const ok =
		status?.success !== false && (status?.httpStatus == null || status.httpStatus === 200);

	if (!ok) {
		const msg =
			status?.message ||
			(typeof raw === "object" &&
			raw &&
			"message" in raw &&
			typeof (raw as { message?: string }).message === "string"
				? (raw as { message: string }).message
				: "TripJack fare rule request was not successful");
		return {
			Response: {
				Error: { ErrorCode: 1, ErrorMessage: msg },
				ResponseStatus: 0,
				TraceId: traceId,
			},
		};
	}

	const fareRule = raw.fareRule;
	if (!fareRule || Object.keys(fareRule).length === 0) {
		return {
			Response: {
				Error: { ErrorCode: 0, ErrorMessage: "" },
				ResponseStatus: 1,
				TraceId: traceId,
				FareRules: [],
			},
		};
	}

	const miniGroups: Array<
		Array<{
			JourneyPoints: string;
			Type: string;
			From: string;
			To: string;
			Unit: string;
			Details: string;
			OnlineReissueAllowed: boolean;
			OnlineRefundAllowed: boolean;
		}>
	> = [];
	const fareRulesFlat: FareRuleItem[] = [];

	for (const legKey of Object.keys(fareRule)) {
		const entry = fareRule[legKey];
		if (!entry) continue;

		const hasTfr =
			entry.tfr &&
			Object.values(entry.tfr).some((arr) => Array.isArray(arr) && arr.length > 0);

		if (hasTfr && entry.tfr) {
			const rows = miniRowsForLeg(legKey, entry.tfr);
			if (rows.length) miniGroups.push(rows);
		} else if (entry.miscInfo?.length) {
			fareRulesFlat.push(...fareRuleItemsFromMisc(legKey, entry.miscInfo));
		}
	}

	const out: FareRuleResponse = {
		Response: {
			Error: { ErrorCode: 0, ErrorMessage: "" },
			ResponseStatus: 1,
			TraceId: traceId,
		},
	};

	if (miniGroups.length > 0) {
		out.Response.MiniFareRules = miniGroups;
	}
	if (fareRulesFlat.length > 0) {
		out.Response.FareRules = fareRulesFlat;
	}

	return out;
}
