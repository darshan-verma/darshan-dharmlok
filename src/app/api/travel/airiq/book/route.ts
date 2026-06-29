import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { bookFlight, issueTicket } from "@/lib/airiqClient";
import {
	logTravelActivity,
	getIpAddress,
	getUserAgent,
	type FlightLogData,
} from "@/lib/travelLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { linkSnapshotsToBooking } from "@/lib/audit/linkSnapshots";
import {
	resolveBlockPNRForBook,
	resolveFareMaskingForBook,
} from "@/lib/airiqBookingHelpers";
import {
	buildItineraryFlightsInfoFromPricing,
	detectReturnModeFromPricing,
	isInternationalRoute,
	parseAiriqAmount,
	resolveBookBaseEndpoints,
	sumBookPaymentFromItinerary,
} from "@/lib/airiqBookPayload";
import {
	extractPnrsFromBookingResponse,
	isRebookBookError,
	resolvePnrsAfterBook,
} from "@/lib/airiqBookRecovery";
import { resolveAiriqTripBookContext } from "@/lib/airiqTripContext";
import { saveAiriqTravelBooking } from "@/lib/saveAiriqTravelBooking";
import { flightLegDates, flightRouteSummary } from "@/lib/flightTripMeta";
import type { FlightResult } from "@/types/tbo";
import type {
	AiriqBookingRequest,
	AiriqPaxDetailsInfo,
	AiriqPricingResponse,
} from "@/types/airiq";

interface IncomingPassenger {
	Title: string;
	FirstName: string;
	LastName: string;
	DateOfBirth: string;
	Gender: number | string; // 1=Male, 2=Female or "Male"/"Female"
	PaxType: number | string; // 1/2/3 or "ADT"/"CHD"/"INF"
	PassportNo?: string;
	PassportExpiry?: string;
	PassportIssuedDate?: string;
	PassportIssueDate?: string;
	PassportCountryCode?: string;
	PassportIssueCountryCode?: string;
	Nationality?: string;
	AddressLine1?: string;
	City?: string;
	CountryCode?: string;
	CountryName?: string;
	ContactNo?: string;
	Email?: string;
	IsLeadPax?: boolean;
	FFAirlineCode?: string;
	FFNumber?: string;
}

interface SSRSelection {
	baggage: Record<string, { Id: string; Price: number } | null>;
	meals: Record<string, { Id: string; Price: number } | null>;
	seats: Record<string, { SeatID: string; Price: number } | null>;
	otherServices?: Record<string, { Id: string; Price: number } | null>;
}

interface ContactInfo {
	countryCode: string;
	contactNumber: string;
	emailId: string;
}

interface GSTInfoInput {
	gstNumber?: string;
	gstCompanyName?: string;
	gstAddress?: string;
	gstEmailId?: string;
	gstMobileNumber?: string;
}

function convertGender(gender: number | string): string {
	if (typeof gender === "string") return gender;
	return gender === 1 ? "Male" : "Female";
}

function convertPaxType(paxType: number | string): string {
	if (typeof paxType === "string") {
		if (["ADT", "CHD", "INF"].includes(paxType)) return paxType;
		return "ADT";
	}
	switch (paxType) {
		case 1: return "ADT";
		case 2: return "CHD";
		case 3: return "INF";
		default: return "ADT";
	}
}

function formatDateToDDMMYYYY(dateStr: string): string {
	if (!dateStr) return "";
	if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;

	try {
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;
		const dd = String(date.getDate()).padStart(2, "0");
		const mm = String(date.getMonth() + 1).padStart(2, "0");
		const yyyy = date.getFullYear();
		return `${dd}/${mm}/${yyyy}`;
	} catch {
		return dateStr;
	}
}

function resolvePassportCountryCode(p: IncomingPassenger): string {
	const raw =
		p.PassportCountryCode?.trim() ||
		p.PassportIssueCountryCode?.trim() ||
		p.Nationality?.trim() ||
		"IN";
	const upper = raw.toUpperCase();
	if (/^[A-Z]{2}$/.test(upper)) return upper;
	if (upper === "91" || upper === "+91") return "IN";
	return upper.slice(0, 2) || "IN";
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			pricingData,
			passengers,
			ssrData,
			flightData,
			returnFlightData,
			adultCount,
			childCount,
			infantCount,
			contactInfo,
			gstInfo,
			blockPNR: blockPNRLegacy,
			preferBlockPNR,
			postAncillaryFlow,
			tripType: incomingTripType,
			searchJourneyType,
		} = body as {
			pricingData: AiriqPricingResponse;
			passengers: IncomingPassenger[];
			ssrData?: SSRSelection;
			flightData?: FlightResult;
			returnFlightData?: FlightResult | null;
			adultCount?: number;
			childCount?: number;
			infantCount?: number;
			contactInfo?: ContactInfo;
			gstInfo?: GSTInfoInput;
			/** @deprecated Use preferBlockPNR — server resolves against Pricing AllowBlockPNR */
			blockPNR?: boolean;
			preferBlockPNR?: boolean;
			postAncillaryFlow?: boolean; // when true, skip IssueTicket so frontend can do add-ons then payment
			tripType?: string;
			searchJourneyType?: string;
		};

		const preferBlock =
			preferBlockPNR ?? blockPNRLegacy ?? false;

		if (!pricingData || !passengers || passengers.length === 0) {
			return brandedFlightJson(
				{ error: "Missing required parameters: pricingData and passengers" },
				{ status: 400 }
			);
		}

		const agentId = process.env.AIRIQ_AGENT_ID;
		const airiqUserName = process.env.AIRIQ_USERNAME;

		if (!agentId || !airiqUserName) {
			return brandedFlightJson(
				{ error: "Missing AIRiQ credentials" },
				{ status: 500 }
			);
		}

		// --- Extract data from Pricing response ---
		const priceItenaryInfo = Array.isArray(pricingData.PriceItenaryInfo)
			? pricingData.PriceItenaryInfo
			: pricingData.PriceItenaryInfo
				? [pricingData.PriceItenaryInfo]
				: [];

		if (priceItenaryInfo.length === 0) {
			return brandedFlightJson(
				{ error: "Invalid pricing data: no PriceItenaryInfo found" },
				{ status: 400 }
			);
		}

		const trackId = priceItenaryInfo[0].Trackid;
		if (!trackId) {
			return brandedFlightJson(
				{ error: "Invalid pricing data: missing TrackId from pricing response" },
				{ status: 400 }
			);
		}

		const { blockPNR: resolvedBlockPNR, allowBlockPNR } = resolveBlockPNRForBook({
			preferBlockPNR: preferBlock,
			pricingData,
		});

		if (preferBlock && !allowBlockPNR) {
			console.warn(
				"AIRiQ Book: preferBlockPNR requested but Pricing AllowBlockPNR is not true; using BlockPNR=false (immediate ticket)."
			);
		}

		const resolvedTripType =
			incomingTripType ||
			resolveAiriqTripBookContext({
				flight: flightData ?? null,
				returnFlight: returnFlightData,
				searchJourneyType:
					typeof searchJourneyType === "string"
						? searchJourneyType
						: undefined,
			}).tripType ||
			(priceItenaryInfo.length > 1 ? "R" : "O");
		const hasSeparateReturnFlight = Boolean(returnFlightData);
		const returnMode = detectReturnModeFromPricing(
			pricingData,
			resolvedTripType,
			hasSeparateReturnFlight
		);
		const airportCodes = priceItenaryInfo.flatMap((pi) => {
			const flights =
				pi.AvailabilityResponse?.[0]?.Flights || pi.FlightDetails || [];
			return flights.flatMap((f) => [f.Origin, f.Destination]);
		});
		const bookPayloadCtx = {
			tripType: resolvedTripType,
			returnMode,
			isInternational: isInternationalRoute(airportCodes.filter(Boolean)),
		};

		const itineraryFlightsInfo = buildItineraryFlightsInfoFromPricing(
			pricingData,
			ssrData,
			bookPayloadCtx
		);

		if (itineraryFlightsInfo.length === 0) {
			return brandedFlightJson(
				{ error: "Could not build itinerary from pricing data" },
				{ status: 400 }
			);
		}

		const invalidPayment = itineraryFlightsInfo.find((it) => {
			const amt = parseFloat(it.PaymentInfo?.[0]?.TotalAmount || "0");
			return !amt || amt <= 0;
		});
		if (invalidPayment) {
			return brandedFlightJson(
				{
					error:
						"Could not determine booking amount from pricing. Please go back and refresh fare details.",
				},
				{ status: 400 }
			);
		}

		// --- Build PaxDetailsInfo ---
		const paxDetailsInfo: AiriqPaxDetailsInfo[] = passengers.map(
			(p, index) => ({
				PaxRefNumber: index + 1,
				Title: (p.Title || "Mr").toUpperCase(),
				FirstName: p.FirstName.toUpperCase(),
				LastName: p.LastName.toUpperCase(),
				DOB: formatDateToDDMMYYYY(p.DateOfBirth),
				Gender: convertGender(p.Gender),
				PaxType: convertPaxType(p.PaxType),
				PassportNo: p.PassportNo || "",
				PassportExpiry: p.PassportExpiry ? formatDateToDDMMYYYY(p.PassportExpiry) : "",
				PassportIssuedDate: (p.PassportIssuedDate || p.PassportIssueDate)
					? formatDateToDDMMYYYY(p.PassportIssuedDate || p.PassportIssueDate || "")
					: "",
				PassportCountryCode: resolvePassportCountryCode(p),
				InfantRef: "",
			})
		);

		// Link infants to their accompanying adult
		const adults = paxDetailsInfo.filter((p) => p.PaxType === "ADT");
		const infants = paxDetailsInfo.filter((p) => p.PaxType === "INF");
		for (let i = 0; i < infants.length; i++) {
			if (adults[i]) {
				infants[i].InfantRef = String(adults[i].PaxRefNumber);
			}
		}

		// --- Build AddressDetails ---
		const leadPax = passengers.find((p) => p.IsLeadPax) || passengers[0];
		const addressDetails = contactInfo
			? {
					CountryCode: contactInfo.countryCode || "91",
					ContactNumber: contactInfo.contactNumber,
					EmailID: contactInfo.emailId,
				}
			: {
					CountryCode: leadPax.CountryCode || "91",
					ContactNumber: leadPax.ContactNo || "",
					EmailID: leadPax.Email || "",
				};

		// --- Build GSTInfo ---
		const gstInfoPayload = {
			GSTNumber: gstInfo?.gstNumber || "",
			GSTCompanyName: gstInfo?.gstCompanyName || "",
			GSTAddress: gstInfo?.gstAddress || "",
			GSTEmailID: gstInfo?.gstEmailId || "",
			GSTMobileNumber: gstInfo?.gstMobileNumber || "",
		};

		// --- Build FFNumberInfo ---
		const ffNumberInfo = passengers
			.filter((p) => p.FFNumber && p.FFAirlineCode)
			.map((p, _idx) => {
				const paxIndex = passengers.indexOf(p);
				return {
					PaxRefNumber: paxIndex + 1,
					SegRefNumber: 1,
					AirlineCode: p.FFAirlineCode!,
					FlyerNumber: p.FFNumber!,
					Itinref: 0,
				};
			});

		// --- Determine TripType, BaseOrigin, BaseDestination ---
		const { baseOrigin, baseDestination } = resolveBookBaseEndpoints(
			pricingData,
			itineraryFlightsInfo,
			bookPayloadCtx
		);

		const firstFlightsInfo = itineraryFlightsInfo[0]?.FlightsInfo || [];

		const flightNumbers = itineraryFlightsInfo.flatMap((it) =>
			(it.FlightsInfo || []).map((f) => f.FlightNumber)
		);
		const fareMasking = resolveFareMaskingForBook({
			pricingData,
			flightNumbers,
		});

		// --- Construct the full AIRiQ Book request ---
		const bookingRequest: AiriqBookingRequest = {
			AgentInfo: {
				AgentId: agentId,
				UserName: airiqUserName,
				AppType: "API",
				Version: 2.0,
			},
			AdultCount: adultCount || 1,
			ChildCount: childCount || 0,
			InfantCount: infantCount || 0,
			ItineraryFlightsInfo: itineraryFlightsInfo,
			PaxDetailsInfo: paxDetailsInfo,
			AddressDetails: addressDetails,
			GSTInfo: gstInfoPayload,
			FFNumberInfo: ffNumberInfo.length > 0 ? ffNumberInfo : undefined,
			TripType: resolvedTripType,
			BlockPNR: resolvedBlockPNR,
			Faremasking: fareMasking,
			BaseOrigin: baseOrigin,
			BaseDestination: baseDestination,
			TrackId: trackId,
		};

		console.log("AIRiQ Booking Request:", JSON.stringify(bookingRequest, null, 2));

		// --- Call AIRiQ Book API ---
		const bookingResponse = await bookFlight(bookingRequest);

		console.log("AIRiQ Booking Response:", JSON.stringify(bookingResponse, null, 2));

		// --- Handle response status codes ---
		const resultCode = bookingResponse.Status?.ResultCode;
		const statusError = bookingResponse.Status?.Error;

		if (resultCode === "-1") {
			console.error("AIRiQ Booking Exception:", statusError);
			return brandedFlightJson(
				{ error: statusError || "Booking exception occurred", bookingResponse },
				{ status: 500 }
			);
		}

		if (resultCode === "0") {
			const bookError = statusError || "Booking failed";
			if (isRebookBookError(bookError)) {
				return brandedFlightJson(
					{
						error: bookError,
						rebook: true,
						bookingResponse,
					},
					{ status: 409 }
				);
			}
			console.error("AIRiQ Booking Failed:", statusError);
			return brandedFlightJson(
				{ error: bookError, bookingResponse },
				{ status: 400 }
			);
		}

		// ResultCode "1" = success, "2" = pending - both returned to frontend
		const isSuccess = resultCode === "1";
		const isPending = resultCode === "2";

		let pnrsForMeta = extractPnrsFromBookingResponse(bookingResponse);
		if (!pnrsForMeta?.airIqPNR && (isSuccess || isPending)) {
			pnrsForMeta =
				(await resolvePnrsAfterBook({
					agentId,
					userName: airiqUserName,
					bookingResponse,
					bookError: statusError || "",
				})) ?? pnrsForMeta;
		}

		// --- Ticketing (Section 9): confirm ticket for already blocked itinerary. Skip when postAncillaryFlow so frontend can add-ons then pay. ---
		let ticketingResponse: Awaited<ReturnType<typeof issueTicket>> | undefined;
		const skipIssueTicket = !!(postAncillaryFlow && resolvedBlockPNR);
		if (isSuccess && resolvedBlockPNR && !skipIssueTicket && agentId && airiqUserName) {
			const pnrs = pnrsForMeta;
			const bookingAmount = sumBookPaymentFromItinerary(itineraryFlightsInfo);
			if (pnrs && bookingResponse.TrackId && bookingAmount !== "0") {
				try {
					// Doc 9.4 Request: AgentInfo, BookingTrackId, AirIqPNR, AirlinePNR, BookingAmount, PaymentMode
					ticketingResponse = await issueTicket({
						AgentInfo: {
							AgentId: agentId,
							UserName: airiqUserName,
							AppType: "API",
							Version: 2.0,
						},
						BookingTrackId: bookingResponse.TrackId,
						AirIqPNR: pnrs.airIqPNR,
						AirlinePNR: pnrs.airlinePNR,
						BookingAmount: bookingAmount,
						PaymentMode: "T",
					});
					console.log("AIRiQ IssueTicket Response:", JSON.stringify(ticketingResponse, null, 2));
				} catch (ticketErr) {
					console.error("AIRiQ IssueTicket Error (booking already succeeded):", ticketErr);
				}
			}
		}

		// --- Logging (non-blocking) ---
		let userId: string | undefined;
		let userEmail: string | undefined;
		let userName: string | undefined;

		try {
			const session = await getServerSession(authOptions);
			userId = session?.user?.id;
			userEmail = session?.user?.email || undefined;
			userName = session?.user?.name || undefined;
		} catch (error) {
			console.warn("Could not fetch session for logging:", error);
		}

		const totalAmount = parseAiriqAmount(
			sumBookPaymentFromItinerary(itineraryFlightsInfo)
		);

		if (userId && pnrsForMeta?.airIqPNR && (isSuccess || isPending)) {
			const lead =
				passengers.find((p) => p.IsLeadPax) || passengers[0];
			const saveEmail =
				lead?.Email?.trim() ||
				contactInfo?.emailId?.trim() ||
				userEmail ||
				"";
			const displayName = [lead?.Title, lead?.FirstName, lead?.LastName]
				.filter(Boolean)
				.join(" ")
				.trim();
			const outbound = flightData ?? null;
			const returnFlight = returnFlightData ?? null;
			const legDates = outbound
				? flightLegDates(outbound, returnFlight)
				: null;
			const bookingStatus = isPending
				? "PENDING"
				: postAncillaryFlow && resolvedBlockPNR
					? "HOLD"
					: "CONFIRMED";

			if (saveEmail) {
			saveAiriqTravelBooking({
				userId,
				airIqPnr: pnrsForMeta.airIqPNR,
				airlinePnr: pnrsForMeta.airlinePNR,
				name:
					displayName ||
					`${lead?.FirstName ?? ""} ${lead?.LastName ?? ""}`.trim() ||
					"Flight passenger",
				email: saveEmail,
				phone: lead?.ContactNo?.trim() || contactInfo?.contactNumber?.trim() || null,
				leadFirstName: lead?.FirstName ?? null,
				leadLastName: lead?.LastName ?? null,
				routeSummary: outbound
					? flightRouteSummary(outbound, returnFlight)
					: baseOrigin && baseDestination
						? `${baseOrigin} → ${baseDestination}`
						: "Flight booking",
				travelDate: legDates?.travelDateIso,
				returnDate: legDates?.returnDateIso,
				departureTime: legDates?.departureTimeLabel,
				travelers: (adultCount || 1) + (childCount || 0) + (infantCount || 0),
				totalAmount,
				status: bookingStatus,
				bookingTrackId: bookingResponse.TrackId ?? null,
				flight: outbound,
				returnFlight,
			}).catch((err) => {
				console.warn("AIRiQ booking not saved to My Trips:", err);
			});
			}
		}

		const flightLogData: FlightLogData = {
			origin: baseOrigin || undefined,
			destination: baseDestination || undefined,
			departureDate: firstFlightsInfo[0]?.DepartureDateTime || undefined,
			airline: firstFlightsInfo[0]?.FlightNumber?.split(" ")[0] || undefined,
			flightNumber: firstFlightsInfo[0]?.FlightNumber || undefined,
			adultCount: adultCount || 1,
			childCount: childCount || 0,
			infantCount: infantCount || 0,
			totalFare: parseAiriqAmount(
				sumBookPaymentFromItinerary(itineraryFlightsInfo)
			) || undefined,
			bookingStatus: isSuccess ? "success" : isPending ? "pending" : "failed",
		};

		if (bookingResponse.TrackId) {
			linkSnapshotsToBooking(trackId, bookingResponse.TrackId).catch(() => {});
		}

		logTravelActivity({
			userId,
			userEmail,
			userName,
			logType: "flight",
			action: "booking",
			provider: "AIRiQ",
			flightData: flightLogData,
			bookingCode: bookingResponse.TrackId || undefined,
			traceId: trackId,
			totalAmount,
			currency: "INR",
			metadata: {
				resultCode,
				isPending,
				isBlockPNR: resolvedBlockPNR,
				allowBlockPNR,
				preferBlockPNR: preferBlock,
			},
			ipAddress: getIpAddress(req),
			userAgent: getUserAgent(req),
		});

		return brandedFlightJson({
			...bookingResponse,
			...(ticketingResponse && { ticketingResponse }),
			_meta: {
				isSuccess,
				isPending,
				isBlockPNR: resolvedBlockPNR,
				allowBlockPNR,
				preferBlockPNR: preferBlock,
				postAncillarySupported: !!(postAncillaryFlow && resolvedBlockPNR),
				fareMasking,
				...(pnrsForMeta && {
					pnrs: { airIqPNR: pnrsForMeta.airIqPNR, airlinePNR: pnrsForMeta.airlinePNR },
					bookingTrackId: bookingResponse.TrackId,
				}),
			},
		});
	} catch (error) {
		console.error("AIRiQ Booking API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return brandedFlightJson({ error: errorMessage }, { status: 500 });
	}
}
