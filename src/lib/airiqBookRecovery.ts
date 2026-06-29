/**
 * AIRiQ book PNR recovery — aligned with UAT runner (TrackStatus, RetrieveBooking).
 */

import { getBookingDetails, trackStatus } from "@/lib/airiqClient";
export { isRebookBookError, isRetryableSeatBookError } from "@/lib/airiqBookErrors";
import type {
	AiriqBookingResponse,
	AiriqRetrieveBookingResponse,
} from "@/types/airiq";

export interface AiriqResolvedPnrs {
	airIqPNR: string;
	airlinePNR: string;
}

const INVALID_PNRS = new Set([
	"n/a",
	"na",
	"-",
	"--",
	"none",
	"null",
	"",
	"pending",
	"pnr",
	"undefined",
]);

const ALREADY_BOOKED_PNR_RE = /booking reference no\. is ([\w]+)/i;

function isInvalidPnr(pnr: unknown): boolean {
	if (typeof pnr !== "string") return true;
	return INVALID_PNRS.has(pnr.toLowerCase().trim());
}

function airlinePnrFromSegmentInformation(node: Record<string, unknown>): string {
	const travellers = (node.TravellerInfo as Record<string, unknown> | undefined)
		?.Item;
	const travArr = Array.isArray(travellers)
		? travellers
		: travellers
			? [travellers]
			: [];
	for (const t of travArr) {
		const segments = (t as Record<string, unknown>).SegmentInformation as
			| Record<string, unknown>
			| undefined;
		const segItem = segments?.Item;
		const segArr = Array.isArray(segItem) ? segItem : segItem ? [segItem] : [];
		for (const seg of segArr) {
			const airlinePNR = (seg as Record<string, unknown>).AirlinePNR;
			if (typeof airlinePNR === "string" && !isInvalidPnr(airlinePNR)) {
				return airlinePNR;
			}
		}
	}
	return "";
}

function airlinePnrFromBookNode(node: Record<string, unknown>): string {
	const topPnr = node.AirlinePNR;
	if (typeof topPnr === "string" && !isInvalidPnr(topPnr)) return topPnr;
	const crsPnr = node.CRSPNR;
	if (typeof crsPnr === "string" && !isInvalidPnr(crsPnr)) return crsPnr;
	return airlinePnrFromSegmentInformation(node);
}

function collectItineraryItems(itinearyDetails: unknown): Record<string, unknown>[] {
	const nodes = Array.isArray(itinearyDetails)
		? itinearyDetails
		: itinearyDetails
			? [itinearyDetails]
			: [];
	const items: Record<string, unknown>[] = [];
	for (const n of nodes) {
		if (!n || typeof n !== "object") continue;
		const node = n as Record<string, unknown>;
		if (typeof node.AirIqPNR === "string" && node.AirIqPNR) items.push(node);
		const nested = node.Item;
		const nestedArr = Array.isArray(nested) ? nested : nested ? [nested] : [];
		for (const it of nestedArr) {
			if (it && typeof it === "object") items.push(it as Record<string, unknown>);
		}
	}
	return items;
}

function pnrsFromItineraryItem(
	it: Record<string, unknown>
): AiriqResolvedPnrs | null {
	if (typeof it.AirIqPNR !== "string" || !it.AirIqPNR) return null;
	return {
		airIqPNR: it.AirIqPNR,
		airlinePNR: airlinePnrFromBookNode(it),
	};
}

export function extractPnrsFromBookingResponse(
	response: AiriqBookingResponse
): AiriqResolvedPnrs | null {
	const details = response.Bookingresponse?.ItinearyDetails;
	if (!details || typeof details !== "object") return null;

	for (const item of collectItineraryItems(details)) {
		const pnrs = pnrsFromItineraryItem(item);
		if (pnrs) return pnrs;
	}

	if (!Array.isArray(details)) {
		const raw = details as Record<string, unknown>;
		if (typeof raw.AirIqPNR === "string" && raw.AirIqPNR) {
			return {
				airIqPNR: raw.AirIqPNR,
				airlinePNR: airlinePnrFromBookNode(raw),
			};
		}
	}

	return null;
}

function extractPnrsFromTrackStatusResponse(
	trackRes: Record<string, unknown>
): AiriqResolvedPnrs | null {
	const roots = [
		trackRes.Retrieveresponse,
		trackRes.Trackresponse,
		trackRes.TrackStatusresponse,
		trackRes.Bookingresponse,
		trackRes,
	];
	for (const root of roots) {
		if (!root || typeof root !== "object") continue;
		const items = collectItineraryItems(
			(root as Record<string, unknown>).ItinearyDetails
		);
		for (const it of items) {
			const pnrs = pnrsFromItineraryItem(it);
			if (pnrs) return pnrs;
		}
	}
	return null;
}

export function extractPnrsFromRetrieveResponse(
	retrieveRes: AiriqRetrieveBookingResponse
): AiriqResolvedPnrs | null {
	const root = retrieveRes.Retrieveresponse;
	if (!root || typeof root !== "object") return null;
	for (const it of collectItineraryItems(
		(root as Record<string, unknown>).ItinearyDetails
	)) {
		const pnrs = pnrsFromItineraryItem(it);
		if (pnrs) return pnrs;
	}
	return null;
}

export function extractAirIqPnrFromBookError(bookError: string): string | null {
	const match = String(bookError || "").match(ALREADY_BOOKED_PNR_RE);
	return match?.[1]?.trim() || null;
}

export function isAmbiguousPendingPnrBookError(
	bookError: string,
	bookRes?: AiriqBookingResponse
): boolean {
	if (/PNR might be created successfully/i.test(bookError)) return true;
	const code = bookRes?.Status?.ResultCode;
	return code === "2" && !extractPnrsFromBookingResponse(bookRes as AiriqBookingResponse);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retrievePnrs(
	agentId: string,
	userName: string,
	keys: { bookingTrackId?: string; airIqPNR?: string; airlinePNR?: string }
): Promise<AiriqResolvedPnrs | null> {
	const item: Record<string, string> = {};
	if (keys.bookingTrackId) item.BookingTrackId = keys.bookingTrackId;
	if (keys.airIqPNR) item.AirIqPNR = keys.airIqPNR;
	if (keys.airlinePNR) item.AirlinePNR = keys.airlinePNR;
	if (!Object.keys(item).length) return null;

	const response = await getBookingDetails({
		AgentInfo: {
			AgentId: agentId,
			UserName: userName,
			AppType: "API",
			Version: 2.0,
		},
		Item: [item],
	});
	if (response.Status?.ResultCode !== "1") return null;
	return extractPnrsFromRetrieveResponse(response);
}

/** Resolve PNRs after book when response is pending or missing itinerary PNRs. */
export async function resolvePnrsAfterBook(options: {
	agentId: string;
	userName: string;
	bookingResponse: AiriqBookingResponse;
	bookError?: string;
	pollTrackStatus?: boolean;
}): Promise<AiriqResolvedPnrs | null> {
	const { agentId, userName, bookingResponse, bookError = "" } = options;

	const direct = extractPnrsFromBookingResponse(bookingResponse);
	if (direct?.airIqPNR) return direct;

	const sequenceId = String(bookingResponse.Status?.SequenceID || "").trim();
	const bookTrackId = String(bookingResponse.TrackId || "").trim();

	if (
		options.pollTrackStatus !== false &&
		(isAmbiguousPendingPnrBookError(bookError, bookingResponse) ||
			bookingResponse.Status?.ResultCode === "2") &&
		sequenceId
	) {
		const trackRes = await trackStatus({
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			Item: [{ BookingTrackId: sequenceId }],
		});
		const fromTrack = extractPnrsFromTrackStatusResponse(
			trackRes as unknown as Record<string, unknown>
		);
		if (fromTrack?.airIqPNR) return fromTrack;

		await sleep(5_000);
		const trackRetry = await trackStatus({
			AgentInfo: {
				AgentId: agentId,
				UserName: userName,
				AppType: "API",
				Version: 2.0,
			},
			Item: [{ BookingTrackId: sequenceId }],
		});
		const fromRetry = extractPnrsFromTrackStatusResponse(
			trackRetry as unknown as Record<string, unknown>
		);
		if (fromRetry?.airIqPNR) return fromRetry;
	}

	if (bookTrackId) {
		const retrieved = await retrievePnrs(agentId, userName, {
			bookingTrackId: bookTrackId,
		});
		if (retrieved?.airIqPNR) return retrieved;
	}

	const fromError = extractAirIqPnrFromBookError(bookError);
	if (fromError) {
		return retrievePnrs(agentId, userName, { airIqPNR: fromError });
	}

	return null;
}
