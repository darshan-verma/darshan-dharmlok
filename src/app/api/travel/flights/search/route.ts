import { randomUUID } from "crypto";
import { after } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { NextRequest } from "next/server";
import { searchFlights } from "@/lib/tboClient";
import { searchTripjackFlights } from "@/lib/tripjackClient";
import {
	searchFlights as searchAiriqFlights,
	convertTboToAiriqParams,
	convertAiriqToTboFormat,
} from "@/lib/airiqClient";
import {
	buildTripjackAirSearchRequest,
	convertTripjackSearchToTboFormat,
	isTripjackConfigured,
	type TripjackRouteRef,
} from "@/lib/tripjackFlightSearch";
import { calculateNetPayable } from "@/lib/tboFareCalculations";
import { countFlightsBySource } from "@/lib/flightSearchMerge";
import {
	mergeProviderResponses,
	withTimeout,
	type MergedFlightSearchResponse,
} from "@/lib/flightSearchMergePipeline";
import type { FlightResult, FlightSegment, FlightSearchResponse } from "@/types/tbo";
import type { AiriqFlightSearchResponse } from "@/types/airiq";
import {
	logTravelActivity,
	getIpAddress,
	getUserAgent,
	type FlightLogData,
} from "@/lib/travelLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	createFlightSearchSession,
	createPendingFlightSearchSession,
	finalizeFlightSearchSession,
} from "@/lib/flightSearchSessionCache";
import {
	buildTboFlightSegment,
	isReturnJourneyType,
	normalizeTboCabinClass,
	tboSourcesForSearch,
	validateTboPassengerCounts,
	type TboSpecialReturnChannel,
} from "@/lib/tboFlightSearch";

/** First page size; remainder loaded via GET /api/travel/flights/search/more */
const FLIGHT_FIRST_PAGE_SIZE = Math.max(
	1,
	parseInt(process.env.FLIGHT_FIRST_PAGE_SIZE || "25", 10) || 25,
);

const TBO_FIRST_MS = Math.max(
	1000,
	parseInt(process.env.FLIGHT_PROVIDER_TIMEOUT_TBO || "20000", 10) || 20000,
);
const AIRIQ_FIRST_MS = Math.max(
	1000,
	parseInt(process.env.FLIGHT_PROVIDER_TIMEOUT_AIRIQ || "18000", 10) || 18000,
);
const TRIPJACK_FIRST_MS = Math.max(
	1000,
	parseInt(process.env.FLIGHT_PROVIDER_TIMEOUT_TRIPJACK || "8000", 10) || 8000,
);
const PROVIDER_TIMEOUT_MS = Math.max(
	1000,
	parseInt(process.env.FLIGHT_PROVIDER_TIMEOUT_MS || "30000", 10) || 30000,
);

type ProviderState = "loading" | "done" | "failed";

interface RequestSegment {
	Origin: string;
	Destination: string;
	DepartureDateTime?: string;
	PreferredDepartureTime?: string;
	PreferredArrivalTime?: string;
}

function responseHasFlights(res: FlightSearchResponse | null | undefined): boolean {
	if (!res?.Response?.Results?.length) return false;
	for (const leg of res.Response.Results) {
		if (Array.isArray(leg) && leg.length > 0) return true;
	}
	return false;
}

function annotateTboFlights(flights: FlightSearchResponse | null) {
	if (!flights?.Response?.Results) return;
	for (const resultArray of flights.Response.Results) {
		if (resultArray && Array.isArray(resultArray)) {
			for (const flight of resultArray) {
				if (flight?.Fare) {
					flight.Fare.NetPayable = calculateNetPayable(flight.Fare);
					flight.ApiSource = "TBO";
				}
			}
		}
	}
}

function annotateAiriqFlights(flights: FlightSearchResponse | null) {
	if (!flights?.Response?.Results) return;
	for (const resultArray of flights.Response.Results) {
		if (resultArray && Array.isArray(resultArray)) {
			for (const flight of resultArray) {
				if (flight?.Fare) {
					flight.Fare.NetPayable = calculateNetPayable(flight.Fare);
					flight.ApiSource = "AIRiQ";
				}
			}
		}
	}
}

function tripjackRoutesForConvert(
	tripjackPayload: ReturnType<typeof buildTripjackAirSearchRequest> | null,
	body: { Segments?: Array<{ Origin: string; Destination: string }> },
): TripjackRouteRef[] {
	if (tripjackPayload?.searchQuery?.routeInfos?.length) {
		return tripjackPayload.searchQuery.routeInfos.map((r) => ({
			from: r.fromCityOrAirport.code,
			to: r.toCityOrAirport.code,
		}));
	}
	return (body.Segments || []).map((s) => ({
		from: s.Origin.toUpperCase(),
		to: s.Destination.toUpperCase(),
	}));
}

function annotateTripjackFlights(flights: FlightSearchResponse | null) {
	if (!flights?.Response?.Results) return;
	for (const resultArray of flights.Response.Results) {
		if (resultArray && Array.isArray(resultArray)) {
			for (const flight of resultArray) {
				if (flight?.Fare) {
					flight.Fare.NetPayable = calculateNetPayable(flight.Fare);
					flight.ApiSource = "TRIPJACK";
				}
			}
		}
	}
}

type FirstWin =
	| { source: "TBO"; raw: FlightSearchResponse }
	| { source: "AIRiQ"; raw: AiriqFlightSearchResponse }
	| { source: "TRIPJACK"; raw: NonNullable<Awaited<ReturnType<typeof searchTripjackFlights>>> };

function providersFromFirstWin(
	first: FirstWin,
	body: {
		JourneyType?: string;
		AdultCount?: string;
		ChildCount?: string;
		InfantCount?: string;
		Segments?: Array<{ Origin: string; Destination: string }>;
	},
	tripjackTraceId: string,
	tripjackPayload: ReturnType<typeof buildTripjackAirSearchRequest> | null,
): {
	tboFlights: FlightSearchResponse | null;
	airiqFlights: FlightSearchResponse | null;
	tripjackFlights: FlightSearchResponse | null;
} {
	let tboFlights: FlightSearchResponse | null = null;
	let airiqFlights: FlightSearchResponse | null = null;
	let tripjackFlights: FlightSearchResponse | null = null;
	const tripjackRoutes = tripjackRoutesForConvert(tripjackPayload, body);

	if (first.source === "TBO") {
		tboFlights = first.raw;
		annotateTboFlights(tboFlights);
	} else if (first.source === "AIRiQ") {
		airiqFlights = convertAiriqToTboFormat(
			first.raw,
			body.JourneyType,
		) as FlightSearchResponse;
		annotateAiriqFlights(airiqFlights);
	} else {
		if (!tripjackPayload) {
			throw new Error("TripJack payload missing");
		}
		const adults = parseInt(body.AdultCount || "1", 10);
		const children = parseInt(body.ChildCount || "0", 10);
		const infants = parseInt(body.InfantCount || "0", 10);
		tripjackFlights = convertTripjackSearchToTboFormat(
			first.raw,
			body.JourneyType || "1",
			tripjackTraceId,
			{ adults, children, infants },
			tripjackRoutes,
		) as FlightSearchResponse;
		annotateTripjackFlights(tripjackFlights);
	}

	return { tboFlights, airiqFlights, tripjackFlights };
}

function processSettledIntoProviders(
	tboResult: PromiseSettledResult<FlightSearchResponse>,
	airiqResult: PromiseSettledResult<AiriqFlightSearchResponse | null>,
	tripjackResult: PromiseSettledResult<unknown>,
	body: {
		JourneyType?: string;
		AdultCount?: string;
		ChildCount?: string;
		InfantCount?: string;
		Segments?: Array<{ Origin: string; Destination: string }>;
	},
	tripjackPayload: ReturnType<typeof buildTripjackAirSearchRequest> | null,
	tripjackTraceId: string,
): {
	tboFlights: FlightSearchResponse | null;
	airiqFlights: FlightSearchResponse | null;
	tripjackFlights: FlightSearchResponse | null;
} {
	const tripjackRoutes = tripjackRoutesForConvert(tripjackPayload, body);
	let tboFlights: FlightSearchResponse | null = null;
	if (tboResult.status === "fulfilled") {
		tboFlights = tboResult.value;
		annotateTboFlights(tboFlights);
	} else {
		console.error("TBO search failed:", tboResult.reason);
	}

	let airiqFlights: FlightSearchResponse | null = null;
	if (airiqResult.status === "fulfilled" && airiqResult.value) {
		airiqFlights = convertAiriqToTboFormat(
			airiqResult.value as AiriqFlightSearchResponse,
			body.JourneyType,
		) as FlightSearchResponse;
		annotateAiriqFlights(airiqFlights);
	} else if (airiqResult.status === "rejected") {
		console.error("AIRiQ search failed:", airiqResult.reason);
	}

	let tripjackFlights: FlightSearchResponse | null = null;
	if (
		tripjackResult.status === "fulfilled" &&
		tripjackResult.value &&
		tripjackPayload
	) {
		const adults = parseInt(body.AdultCount || "1", 10);
		const children = parseInt(body.ChildCount || "0", 10);
		const infants = parseInt(body.InfantCount || "0", 10);
		tripjackFlights = convertTripjackSearchToTboFormat(
			tripjackResult.value,
			body.JourneyType || "1",
			tripjackTraceId,
			{ adults, children, infants },
			tripjackRoutes,
		) as FlightSearchResponse;
		annotateTripjackFlights(tripjackFlights);
	} else if (tripjackResult.status === "rejected") {
		console.error("TripJack search rejected:", tripjackResult.reason);
	}

	return { tboFlights, airiqFlights, tripjackFlights };
}

function providerStatesFromSettled(
	tboResult: PromiseSettledResult<unknown>,
	airiqResult: PromiseSettledResult<unknown>,
	tripjackResult: PromiseSettledResult<unknown>,
): { tbo: ProviderState; airiq: ProviderState; tripjack: ProviderState } {
	return {
		tbo: tboResult.status === "fulfilled" ? "done" : "failed",
		airiq: airiqResult.status === "fulfilled" ? "done" : "failed",
		tripjack: tripjackResult.status === "fulfilled" ? "done" : "failed",
	};
}

type Pagination = {
	searchSessionId: string;
	total: number;
	loaded: number;
	pageSize: number;
	hasMore: boolean;
};

function applyPagination(
	mergedResults: MergedFlightSearchResponse,
	journeyType: string,
): { mergedResults: MergedFlightSearchResponse; pagination: Pagination | null } {
	let pagination: Pagination | null = null;
	const primaryLeg = mergedResults.Response.Results?.[0] as
		| FlightResult[]
		| undefined;
	if (primaryLeg && primaryLeg.length > FLIGHT_FIRST_PAGE_SIZE) {
		const fullSorted = [...primaryLeg];
		const sessionId = createFlightSearchSession({
			flights: fullSorted,
			traceId: mergedResults.Response.TraceId,
			journeyType,
		});
		mergedResults.Response.Results[0] = fullSorted.slice(
			0,
			FLIGHT_FIRST_PAGE_SIZE,
		);
		pagination = {
			searchSessionId: sessionId,
			total: fullSorted.length,
			loaded: FLIGHT_FIRST_PAGE_SIZE,
			pageSize: FLIGHT_FIRST_PAGE_SIZE,
			hasMore: true,
		};
	}
	return { mergedResults, pagination };
}

async function logFlightMerge(
	request: NextRequest,
	body: Record<string, unknown>,
	searchParams: { Segments: FlightSegment[] },
	mergedResults: MergedFlightSearchResponse,
	meta: {
		tboResult: PromiseSettledResult<unknown>;
		airiqResult: PromiseSettledResult<unknown>;
		tripjackResult: PromiseSettledResult<unknown>;
		preMergeFlat: FlightResult[];
		preCounts: ReturnType<typeof countFlightsBySource>;
		tboFlightCount: number;
		airiqFlightCount: number;
		tripjackFlightCount: number;
		totalFlightOptions: number;
		pagination: Pagination | null;
		phase?: string;
	},
) {
	try {
		const session = await getServerSession(authOptions);
		const userId = session?.user?.id;
		const userEmail = session?.user?.email || undefined;
		const userName = session?.user?.name || undefined;

		const firstSegment = searchParams.Segments?.[0];
		const flightLogData: FlightLogData = {
			origin: firstSegment?.Origin || (body.Origin as string) || undefined,
			destination:
				firstSegment?.Destination || (body.Destination as string) || undefined,
			departureDate:
				firstSegment?.PreferredDepartureTime ||
				(body.PreferredDepartureTime as string) ||
				undefined,
			returnDate:
				searchParams.Segments?.[1]?.PreferredDepartureTime ||
				(body.ReturnPreferredDepartureTime as string) ||
				undefined,
			cabinClass:
				firstSegment?.FlightCabinClass ||
				(body.FlightCabinClass as string) ||
				undefined,
			adultCount: parseInt((body.AdultCount as string) || "1"),
			childCount: parseInt((body.ChildCount as string) || "0"),
			infantCount: parseInt((body.InfantCount as string) || "0"),
		};

		const providers: string[] = [];
		if (meta.tboResult.status === "fulfilled") providers.push("TBO");
		if (meta.airiqResult.status === "fulfilled" && meta.airiqResult.value)
			providers.push("AIRiQ");
		if (meta.tripjackResult.status === "fulfilled" && meta.tripjackResult.value)
			providers.push("TripJack");

		logTravelActivity({
			userId,
			userEmail,
			userName,
			logType: "flight",
			action: "search",
			provider: providers.length ? providers.join("+") : undefined,
			flightData: flightLogData,
			traceId: mergedResults?.Response?.TraceId || undefined,
			metadata: {
				journeyType: (body.JourneyType as string) || "1",
				resultCount:
					meta.tboFlightCount + meta.airiqFlightCount + meta.tripjackFlightCount,
				tboResults: meta.tboFlightCount,
				airiqResults: meta.airiqFlightCount,
				tripjackResults: meta.tripjackFlightCount,
				totalFlightOptions: meta.totalFlightOptions,
				paginatedFirstPage: Boolean(meta.pagination),
				preMergeTotal: meta.preMergeFlat.length,
				preMergeTbo: meta.preCounts.tbo,
				preMergeAiriq: meta.preCounts.airiq,
				preMergeTripjack: meta.preCounts.tripjack,
				searchPhase: meta.phase,
			},
			ipAddress: getIpAddress(request),
			userAgent: getUserAgent(request),
		});
	} catch (error) {
		console.warn("Failed to log flight search:", error);
	}
}

/**
 * POST /api/travel/flights/search
 * Search for available flights
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate dates are not in the past
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Set to start of today

		if (body.PreferredDepartureTime) {
			const departureDate = new Date(body.PreferredDepartureTime);
			if (departureDate < today) {
				return brandedFlightJson(
					{ error: "Departure date cannot be in the past" },
					{ status: 400 },
				);
			}
		}

		if (body.ReturnPreferredDepartureTime) {
			const returnDate = new Date(body.ReturnPreferredDepartureTime);
			if (returnDate < today) {
				return brandedFlightJson(
					{ error: "Return date cannot be in the past" },
					{ status: 400 },
				);
			}
		}

		// Validate multi-city segment dates and ordering per TBO docs
		if (body.JourneyType === "3" && body.Segments) {
			if (body.Segments.length > 6) {
				return brandedFlightJson(
					{ error: "Multi-city supports at most 6 legs" },
					{ status: 400 },
				);
			}
			let prevDepartureDate: Date | null = null;
			for (let i = 0; i < body.Segments.length; i++) {
				const segment = body.Segments[i];
				// Validate origin/destination not null
				if (!segment.Origin || !segment.Destination) {
					return brandedFlightJson(
						{ error: `Segment ${i + 1}: Origin and Destination are required` },
						{ status: 400 },
					);
				}
				if (segment.PreferredDepartureTime || segment.DepartureDateTime) {
					const departureDate = new Date(
						segment.PreferredDepartureTime || segment.DepartureDateTime,
					);
					if (departureDate < today) {
						return brandedFlightJson(
							{
								error: `Segment ${i + 1} departure date cannot be in the past`,
							},
							{ status: 400 },
						);
					}
					// Per TBO docs: 2nd segment date must be >= 1st segment arrival date
					if (prevDepartureDate && departureDate < prevDepartureDate) {
						return brandedFlightJson(
							{
								error: `Segment ${i + 1} departure date must be on or after previous segment departure`,
							},
							{ status: 400 },
						);
					}
					prevDepartureDate = departureDate;
				}
			}
		}

		const journeyType = String(body.JourneyType || "1");

		// TBO: max 9 passengers per search
		const paxError = validateTboPassengerCounts(
			parseInt(body.AdultCount || "1", 10),
			parseInt(body.ChildCount || "0", 10),
			parseInt(body.InfantCount || "0", 10),
		);
		if (paxError) {
			return brandedFlightJson({ error: paxError }, { status: 400 });
		}

		// Validate origin/destination for non-multi-city
		if (journeyType !== "3") {
			if (!body.Origin || !body.Destination) {
				return brandedFlightJson(
					{ error: "Origin and Destination are required" },
					{ status: 400 },
				);
			}
		}

		if (
			isReturnJourneyType(journeyType) &&
			(!body.ReturnPreferredDepartureTime ||
				String(body.ReturnPreferredDepartureTime).trim() === "")
		) {
			return brandedFlightJson(
				{ error: "Return date is required for return, advance search return, and special return journeys" },
				{ status: 400 },
			);
		}

		// Validate SpecialReturn constraints: cannot use with MultiCity
		if (journeyType === "3" && body.Sources?.includes("6E_SPECIAL_RETURN")) {
			return brandedFlightJson(
				{ error: "SpecialReturn (6E) is only available for Return journeys, not MultiCity" },
				{ status: 400 },
			);
		}

		// Helper function to format date as yyyy-MM-ddTHH:mm:ss
		const formatDate = (dateStr: string) => {
			const date = new Date(dateStr);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			const hours = String(date.getHours()).padStart(2, "0");
			const minutes = String(date.getMinutes()).padStart(2, "0");
			return `${year}-${month}-${day}T${hours}:${minutes}:00`;
		};

		const cabinClass = normalizeTboCabinClass(body.FlightCabinClass);

		const specialReturnChannel =
			body.SpecialReturnChannel === "GDS"
				? ("GDS" as TboSpecialReturnChannel)
				: body.SpecialReturnChannel === "LCC"
					? ("LCC" as TboSpecialReturnChannel)
					: undefined;

		// Format search parameters to match TBO API exactly
		const searchParams = {
			EndUserIp: "183.83.54.192", // Use the IP provided by user
			AdultCount: body.AdultCount || "1",
			ChildCount: body.ChildCount || "0",
			InfantCount: body.InfantCount || "0",
			DirectFlight: body.DirectFlight ?? "false",
			OneStopFlight: body.OneStopFlight ?? "false",
			JourneyType: journeyType,
			PreferredAirlines: body.PreferredAirlines || null,
			Segments: [] as FlightSegment[],
			Sources: tboSourcesForSearch(journeyType, {
				sources: body.Sources ?? null,
				specialReturnChannel,
			}),
			MaxResults: 100,
		};

		// Handle different journey types
		if (journeyType === "3" && body.Segments) {
			// Multi-city: use segments from request body
			searchParams.Segments = body.Segments.map((segment: RequestSegment) => {
				const dep =
					segment.DepartureDateTime || segment.PreferredDepartureTime || "";
				const depFormatted = dep ? formatDate(dep) : "";
				return buildTboFlightSegment(
					segment.Origin,
					segment.Destination,
					depFormatted,
					cabinClass,
					segment.PreferredArrivalTime
						? formatDate(segment.PreferredArrivalTime)
						: undefined,
				);
			});
		} else {
			const outboundDep = body.PreferredDepartureTime
				? formatDate(body.PreferredDepartureTime)
				: "";
			searchParams.Segments.push(
				buildTboFlightSegment(
					body.Origin,
					body.Destination,
					outboundDep,
					cabinClass,
					body.PreferredArrivalTime
						? formatDate(body.PreferredArrivalTime)
						: undefined,
				),
			);

			if (isReturnJourneyType(journeyType) && body.ReturnPreferredDepartureTime) {
				const returnDep = formatDate(body.ReturnPreferredDepartureTime);
				searchParams.Segments.push(
					buildTboFlightSegment(
						body.Destination,
						body.Origin,
						returnDep,
						cabinClass,
						body.ReturnPreferredArrivalTime
							? formatDate(body.ReturnPreferredArrivalTime)
							: undefined,
					),
				);
			}
		}

		let airiqParams;
		try {
			airiqParams = convertTboToAiriqParams(searchParams);
			// AIRiQ: no multi-city or TBO-only journey types (4 Advance, 5 Special Return)
			if (journeyType === "3" || journeyType === "4" || journeyType === "5") {
				airiqParams = null;
			}
		} catch (_err) {
			airiqParams = null;
		}

		const tripjackPayload =
			isTripjackConfigured() && journeyType !== "5" && journeyType !== "4"
				? buildTripjackAirSearchRequest(body)
				: null;
		const tripjackTraceId = randomUUID();

		const tboP = withTimeout(
			searchFlights(searchParams),
			PROVIDER_TIMEOUT_MS,
			"TBO",
		);
		const airiqP = airiqParams
			? withTimeout(searchAiriqFlights(airiqParams), PROVIDER_TIMEOUT_MS, "AIRiQ")
			: Promise.resolve(null);
		const tjP = tripjackPayload
			? withTimeout(
					searchTripjackFlights(tripjackPayload),
					PROVIDER_TIMEOUT_MS,
					"TRIPJACK",
				)
			: Promise.resolve(null);

		const firstCandidates: Promise<FirstWin>[] = [
			withTimeout(tboP, TBO_FIRST_MS, "TBO").then((raw) => {
				if (!responseHasFlights(raw)) throw new Error("TBO empty");
				return { source: "TBO" as const, raw };
			}),
		];

		if (airiqParams) {
			firstCandidates.push(
				withTimeout(airiqP, AIRIQ_FIRST_MS, "AIRiQ").then((raw) => {
					if (!raw) throw new Error("AIRiQ empty");
					return { source: "AIRiQ" as const, raw: raw as AiriqFlightSearchResponse };
				}),
			);
		}

		if (tripjackPayload) {
			firstCandidates.push(
				withTimeout(tjP, TRIPJACK_FIRST_MS, "TRIPJACK").then((raw) => {
					if (!raw) throw new Error("TRIPJACK empty");
					return { source: "TRIPJACK" as const, raw };
				}),
			);
		}

		let firstWin: FirstWin | null = null;
		try {
			firstWin = await Promise.any(firstCandidates);
		} catch {
			firstWin = null;
		}

		/** Early partial response: first successful provider within per-API timeouts */
		if (firstWin) {
			const { tboFlights, airiqFlights, tripjackFlights } = providersFromFirstWin(
				firstWin,
				body,
				tripjackTraceId,
				tripjackPayload,
			);

			const partial = mergeProviderResponses(
				tboFlights,
				airiqFlights,
				tripjackFlights,
				journeyType,
			);

			const mergeSessionId = createPendingFlightSearchSession({
				traceId: partial.mergedResults.Response.TraceId,
				journeyType,
			});

			const partialPrimaryFull = [
				...(partial.mergedResults.Response.Results[0] as FlightResult[]),
			];

			const displayMerged = {
				...partial.mergedResults,
				Response: {
					...partial.mergedResults.Response,
					Results: partial.mergedResults.Response.Results.map((leg) =>
						Array.isArray(leg) ? [...leg] : leg,
					) as FlightSearchResponse["Response"]["Results"],
				},
			} satisfies MergedFlightSearchResponse;

			const primary = displayMerged.Response.Results[0] as FlightResult[];
			if (primary.length > FLIGHT_FIRST_PAGE_SIZE) {
				displayMerged.Response.Results[0] = primary.slice(
					0,
					FLIGHT_FIRST_PAGE_SIZE,
				);
			}

			const tboDone = firstWin.source === "TBO";
			const airiqDone = firstWin.source === "AIRiQ";
			const tjDone = firstWin.source === "TRIPJACK";

			after(() => {
				void (async () => {
					try {
						const settled = await Promise.allSettled([tboP, airiqP, tjP]);
						const tboResult = settled[0] as PromiseSettledResult<FlightSearchResponse>;
						const airiqResult =
							settled[1] as PromiseSettledResult<AiriqFlightSearchResponse | null>;
						const tripjackResult = settled[2] as PromiseSettledResult<unknown>;

						const full = processSettledIntoProviders(
							tboResult,
							airiqResult,
							tripjackResult,
							body,
							tripjackPayload,
							tripjackTraceId,
						);

						const merged = mergeProviderResponses(
							full.tboFlights,
							full.airiqFlights,
							full.tripjackFlights,
							journeyType,
						);

						const primaryLeg = merged.mergedResults.Response.Results?.[0] as
							| FlightResult[]
							| undefined;
						if (!primaryLeg?.length) {
							finalizeFlightSearchSession(mergeSessionId, {
								flights: partialPrimaryFull,
								traceId: partial.mergedResults.Response.TraceId,
								journeyType,
							});
							return;
						}

						const fullSorted = [...primaryLeg];
						finalizeFlightSearchSession(mergeSessionId, {
							flights: fullSorted,
							traceId: merged.mergedResults.Response.TraceId,
							journeyType,
						});

						await logFlightMerge(
							request,
							body,
							searchParams,
							merged.mergedResults,
							{
								tboResult,
								airiqResult,
								tripjackResult,
								preMergeFlat: merged.preMergeFlat,
								preCounts: merged.preCounts,
								tboFlightCount: merged.tboFlightCount,
								airiqFlightCount: merged.airiqFlightCount,
								tripjackFlightCount: merged.tripjackFlightCount,
								totalFlightOptions: merged.totalFlightOptions,
								pagination: null,
								phase: "background_complete",
							},
						);
					} catch (err) {
						console.error("Flight search background merge:", err);
						finalizeFlightSearchSession(mergeSessionId, {
							flights: partialPrimaryFull,
							traceId: partial.mergedResults.Response.TraceId,
							journeyType,
						});
					}
				})();
			});

			try {
				const session = await getServerSession(authOptions);
				const firstSegment = searchParams.Segments?.[0];
				const flightLogData: FlightLogData = {
					origin: firstSegment?.Origin || body.Origin || undefined,
					destination:
						firstSegment?.Destination || body.Destination || undefined,
					departureDate:
						firstSegment?.PreferredDepartureTime ||
						body.PreferredDepartureTime ||
						undefined,
					returnDate:
						searchParams.Segments?.[1]?.PreferredDepartureTime ||
						body.ReturnPreferredDepartureTime ||
						undefined,
					cabinClass:
						firstSegment?.FlightCabinClass || body.FlightCabinClass || undefined,
					adultCount: parseInt(body.AdultCount || "1"),
					childCount: parseInt(body.ChildCount || "0"),
					infantCount: parseInt(body.InfantCount || "0"),
				};
				logTravelActivity({
					userId: session?.user?.id,
					userEmail: session?.user?.email || undefined,
					userName: session?.user?.name || undefined,
					logType: "flight",
					action: "search",
					provider: firstWin.source,
					flightData: flightLogData,
					traceId: displayMerged.Response.TraceId || undefined,
					metadata: {
						journeyType: body.JourneyType || "1",
						resultCount:
							partial.tboFlightCount +
							partial.airiqFlightCount +
							partial.tripjackFlightCount,
						tboResults: partial.tboFlightCount,
						airiqResults: partial.airiqFlightCount,
						tripjackResults: partial.tripjackFlightCount,
						totalFlightOptions: partial.totalFlightOptions,
						paginatedFirstPage: false,
						preMergeTotal: partial.preMergeFlat.length,
						preMergeTbo: partial.preCounts.tbo,
						preMergeAiriq: partial.preCounts.airiq,
						preMergeTripjack: partial.preCounts.tripjack,
						searchPhase: "partial_first_provider",
					},
					ipAddress: getIpAddress(request),
					userAgent: getUserAgent(request),
				});
			} catch {
				// logging must not break search
			}

			return brandedFlightJson({
				success: true,
				phase: "partial",
				mergePending: true,
				mergeSessionId,
				data: displayMerged,
				pagination: null,
				sources: {
					tbo: tboDone,
					airiq: airiqDone,
					tripjack: tjDone,
				},
				providerStates: {
					tbo: tboDone ? "done" : "loading",
					airiq: airiqDone ? "done" : "loading",
					tripjack: tjDone ? "done" : "loading",
				},
				stats: {
					tboFlightCount: partial.tboFlightCount,
					airiqFlightCount: partial.airiqFlightCount,
					tripjackFlightCount: partial.tripjackFlightCount,
					totalFlightCount: partial.totalFlightOptions,
				},
			});
		}

		// No fast provider: wait for all (remaining) calls to settle
		const [tboResult, airiqResult, tripjackResult] = await Promise.allSettled([
			tboP,
			airiqP,
			tjP,
		]);

		const { tboFlights, airiqFlights, tripjackFlights } =
			processSettledIntoProviders(
				tboResult as PromiseSettledResult<FlightSearchResponse>,
				airiqResult as PromiseSettledResult<AiriqFlightSearchResponse | null>,
				tripjackResult,
				body,
				tripjackPayload,
				tripjackTraceId,
			);

		const merged = mergeProviderResponses(
			tboFlights,
			airiqFlights,
			tripjackFlights,
			journeyType,
		);

		const { mergedResults, pagination } = applyPagination(
			merged.mergedResults,
			journeyType,
		);

		await logFlightMerge(request, body, searchParams, mergedResults, {
			tboResult,
			airiqResult,
			tripjackResult,
			preMergeFlat: merged.preMergeFlat,
			preCounts: merged.preCounts,
			tboFlightCount: merged.tboFlightCount,
			airiqFlightCount: merged.airiqFlightCount,
			tripjackFlightCount: merged.tripjackFlightCount,
			totalFlightOptions: merged.totalFlightOptions,
			pagination,
			phase: "complete",
		});

		return brandedFlightJson({
			success: true,
			phase: "complete",
			mergePending: false,
			data: mergedResults,
			pagination,
			sources: {
				tbo: tboResult.status === "fulfilled",
				airiq: airiqResult.status === "fulfilled" && !!airiqResult.value,
				tripjack:
					tripjackResult.status === "fulfilled" && !!tripjackResult.value,
			},
			providerStates: providerStatesFromSettled(
				tboResult,
				airiqResult,
				tripjackResult,
			),
			stats: {
				tboFlightCount: merged.tboFlightCount,
				airiqFlightCount: merged.airiqFlightCount,
				tripjackFlightCount: merged.tripjackFlightCount,
				totalFlightCount: merged.totalFlightOptions,
			},
		});
	} catch (error) {
		console.error("Flight search error:", error);
		return brandedFlightJson(
			{
				success: false,
				error: error instanceof Error ? error.message : "Flight search failed",
			},
			{ status: 500 },
		);
	}
}
