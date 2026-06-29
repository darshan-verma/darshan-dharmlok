import { NextRequest } from "next/server";
import { brandedFlightJson } from "@/lib/brandedFlightApiResponse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { reschedule } from "@/lib/airiqClient";
import type {
	AiriqRescheduleRequest,
	AiriqRescheduleResponse,
	AiriqRescheduleItineraryInfo,
} from "@/types/airiq";
import { resolveIntlConnectingRescheduleRoutes } from "@/lib/airiqRescheduleHelpers";

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return brandedFlightJson({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json().catch(() => null);
		if (!body || typeof body !== "object") {
			return brandedFlightJson(
				{ error: "Invalid JSON body" },
				{ status: 400 }
			);
		}

		const {
			segmentInfo,
			trackId,
			airIqPNR,
			remarks,
			flag,
			contactNo,
			itineraryInfo,
			deriveIntlConnecting,
			tripOrigin,
			tripDestination,
		} = body as {
			segmentInfo?: { baseOrigin?: string; baseDestination?: string; tripType?: string };
			trackId?: string;
			airIqPNR?: string;
			remarks?: string;
			flag?: string;
			contactNo?: string;
			itineraryInfo?: Array<{
				flightDetails?: Array<{
					flightID?: string;
					flightNumber?: string;
					origin?: string;
					destination?: string;
					departureDateTime?: string;
					arrivalDateTime?: string;
				}>;
				baseAmount?: string;
				grossAmount?: string;
			}>;
			deriveIntlConnecting?: boolean;
			tripOrigin?: string;
			tripDestination?: string;
		};

		if (
			!segmentInfo ||
			typeof segmentInfo !== "object" ||
			!segmentInfo.baseOrigin?.trim() ||
			!segmentInfo.baseDestination?.trim()
		) {
			return brandedFlightJson(
				{ error: "segmentInfo with baseOrigin and baseDestination is required" },
				{ status: 400 }
			);
		}

		if (!trackId || typeof trackId !== "string" || !trackId.trim()) {
			return brandedFlightJson(
				{ error: "trackId is required" },
				{ status: 400 }
			);
		}

		if (!airIqPNR || typeof airIqPNR !== "string" || !airIqPNR.trim()) {
			return brandedFlightJson(
				{ error: "airIqPNR is required" },
				{ status: 400 }
			);
		}

		const normalizedFlag = (flag || "").toString().toUpperCase();
		if (normalizedFlag !== "CHECKFARE" && normalizedFlag !== "CONFIRM") {
			return brandedFlightJson(
				{ error: 'Invalid flag. Expected "CHECKFARE" or "CONFIRM".' },
				{ status: 400 }
			);
		}

		if (!contactNo || typeof contactNo !== "string" || !contactNo.trim()) {
			return brandedFlightJson(
				{ error: "contactNo is required" },
				{ status: 400 }
			);
		}

		if (!Array.isArray(itineraryInfo) || itineraryInfo.length === 0) {
			return brandedFlightJson(
				{ error: "itineraryInfo (at least one segment) is required" },
				{ status: 400 }
			);
		}

		const mappedItinerary: AiriqRescheduleItineraryInfo[] = itineraryInfo.map(
			(it) => {
				const flightDetailsList = it.flightDetails || [];
				const fd = flightDetailsList[0];
				if (!fd) {
					throw new Error("Each itineraryInfo item must have flightDetails");
				}
				return {
					FlightDetails: flightDetailsList.map((seg) => ({
						FlightID: (seg.flightID ?? "").toString(),
						FlightNumber: (seg.flightNumber ?? "").toString(),
						Origin: (seg.origin ?? "").toString(),
						Destination: (seg.destination ?? "").toString(),
						DepartureDateTime: (seg.departureDateTime ?? "").toString(),
						ArrivalDateTime: (seg.arrivalDateTime ?? "").toString(),
					})),
					BaseAmount: (it.baseAmount ?? "").toString(),
					GrossAmount: (it.grossAmount ?? "").toString(),
				};
			}
		);

		let baseOrigin = segmentInfo.baseOrigin.trim();
		let baseDestination = segmentInfo.baseDestination.trim();
		const tripType = (segmentInfo.tripType ?? "O").toString();

		if (
			deriveIntlConnecting &&
			tripType === "R" &&
			mappedItinerary[0]?.FlightDetails?.length
		) {
			const { legOrigin, legDestination } = resolveIntlConnectingRescheduleRoutes(
				mappedItinerary[0].FlightDetails,
				tripOrigin || baseOrigin,
				tripDestination || baseDestination
			);
			baseOrigin = legOrigin;
			baseDestination = legDestination;
		}

		const agentId = process.env.AIRIQ_AGENT_ID;
		const userName = process.env.AIRIQ_USERNAME;
		if (!agentId || !userName) {
			return brandedFlightJson(
				{ error: "Missing AIRiQ credentials" },
				{ status: 500 }
			);
		}

		const agentInfo: AiriqRescheduleRequest["AgentInfo"] = {
			AgentId: agentId,
			UserName: userName,
			AppType: "API",
			Version: 2.0,
		};
		const terminalId = process.env.AIRIQ_TERMINAL_ID;
		if (terminalId?.trim()) {
			agentInfo.TerminalId = terminalId.trim();
		}

		const rescheduleRequest: AiriqRescheduleRequest = {
			AgentInfo: agentInfo,
			SegmentInfo: {
				BaseOrigin: baseOrigin,
				BaseDestination: baseDestination,
				TripType: tripType,
			},
			Trackid: trackId.trim(),
			AirIqPNR: airIqPNR.trim(),
			...(remarks?.trim() ? { Remarks: remarks.trim() } : {}),
			Flag: normalizedFlag as "CHECKFARE" | "CONFIRM",
			ContactNo: contactNo.trim(),
			ItineraryInfo: mappedItinerary,
		};

		const response: AiriqRescheduleResponse = await reschedule(rescheduleRequest);

		const resultCode = response.Status?.ResultCode ?? "";

		if (resultCode === "1") {
			return brandedFlightJson(
				{
					...response,
					newAirIqPNR: response.AirIqPNR,
					message:
						"Reschedule successful. Use the new PNR (newAirIqPNR) for all future actions and retrieve your updated booking with it.",
				},
				{ status: 200 }
			);
		}

		if (resultCode === "0") {
			return brandedFlightJson(
				{
					error:
						response.Status?.Error ??
						"Unable to reschedule for the requested PNR. Kindly contact customer care.",
					resultCode: response.Status?.ResultCode,
					sequenceID: response.Status?.SequenceID,
				},
				{ status: 400 }
			);
		}

		if (resultCode === "-1") {
			return brandedFlightJson(
				{
					error:
						response.Status?.Error ??
						"Exception while rescheduling. Kindly contact customer care.",
					resultCode: response.Status?.ResultCode,
					sequenceID: response.Status?.SequenceID,
				},
				{ status: 422 }
			);
		}

		// "-2" = pending
		return brandedFlightJson(
			{
				error:
					response.Status?.Error ??
					"Reschedule request is pending. Kindly contact customer care or try again later.",
				resultCode: response.Status?.ResultCode,
				sequenceID: response.Status?.SequenceID,
				status: response.Status,
			},
			{ status: 202 }
		);
	} catch (err) {
		const message =
			err instanceof Error
				? err.message
				: "Reschedule request failed. Please try again.";
		console.error("AIRiQ Reschedule API Error:", err);
		return brandedFlightJson({ error: message }, { status: 500 });
	}
}
