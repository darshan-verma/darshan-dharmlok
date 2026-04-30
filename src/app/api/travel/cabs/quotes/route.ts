import { NextRequest, NextResponse } from "next/server";
import { getTripjackQuotes } from "@/lib/tripjackClient";
import type {
	TripjackJourneyType,
	TripjackQuoteRequest,
	TripjackTripType,
} from "@/types/tripjack";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { resolveTripjackError } from "@/lib/tripjackError";

const VALID_JOURNEY_TYPES: TripjackJourneyType[] = [
	"airport_transfer",
	"outstations",
	"local",
	"rental",
];

const VALID_TRIP_TYPES: TripjackTripType[] = ["oneway", "roundtrip", "return"];
const TRIPJACK_PROVIDER_JOURNEY_TYPE_MAP: Record<TripjackJourneyType, string> = {
	airport_transfer: "AIRPORT_TRANSFER",
	outstations: "OUTSTATION",
	local: "LOCAL",
	rental: "RENTAL",
};

function isValidDateTime(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(value);
}

function parseDateTime(value: string): Date {
	return new Date(value.replace(" ", "T"));
}

function isValidLocation(location: unknown): boolean {
	if (!location || typeof location !== "object") {
		return false;
	}

	const candidate = location as Record<string, unknown>;
	return Boolean(
		candidate.displayAddress &&
		candidate.lat &&
		candidate.long &&
		candidate.type &&
		candidate.address &&
		typeof candidate.address === "object",
	);
}

function validateQuotesPayload(body: Record<string, unknown>): string | null {
	const requiredFields = [
		"origin",
		"destination",
		"tripType",
		"journeyType",
		"pickupDate",
		"passengers",
	];

	for (const field of requiredFields) {
		if (!(field in body)) {
			return `Missing required field: ${field}`;
		}
	}

	if (!isValidLocation(body.origin)) {
		return "Invalid origin payload";
	}

	if (!isValidLocation(body.destination)) {
		return "Invalid destination payload";
	}

	if (!VALID_TRIP_TYPES.includes(body.tripType as TripjackTripType)) {
		return "tripType must be one of: oneway, roundtrip, return";
	}

	if (!VALID_JOURNEY_TYPES.includes(body.journeyType as TripjackJourneyType)) {
		return "journeyType must be one of: airport_transfer, outstations, local, rental";
	}

	if (
		typeof body.pickupDate !== "string" ||
		!isValidDateTime(body.pickupDate)
	) {
		return "pickupDate must be in yyyy-MM-dd HH:mm format";
	}

	if (
		typeof body.passengers !== "number" ||
		body.passengers < 1 ||
		body.passengers > 10
	) {
		return "passengers must be a number between 1 and 10";
	}

	const pickupDate = parseDateTime(body.pickupDate);
	const minPickupDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
	if (pickupDate < minPickupDate) {
		return "pickupDate must be at least 2 hours in the future";
	}

	const requiresReturnDate =
		body.tripType === "roundtrip" || body.tripType === "return";
	if (requiresReturnDate) {
		if (
			typeof body.returnDate !== "string" ||
			!isValidDateTime(body.returnDate)
		) {
			return "returnDate is required in yyyy-MM-dd HH:mm format for roundtrip/return";
		}

		const returnDate = parseDateTime(body.returnDate);
		const minReturnDate = new Date(pickupDate.getTime() + 30 * 60 * 1000);
		if (returnDate < minReturnDate) {
			return "returnDate must be at least 30 minutes after pickupDate";
		}
	}

	return null;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const validationError = validateQuotesPayload(body);

		if (validationError) {
			return NextResponse.json(
				{
					success: false,
					error: validationError,
				},
				{ status: 400 },
			);
		}

		// Strip extra fields (e.g. placeId) from location objects before
		// forwarding to TripJack — their API only expects LocationDto shape.
		const stripLocation = (loc: Record<string, unknown>) => {
			const { placeId: _p, ...rest } = loc;
			return rest;
		};

		const sanitisedBody = {
			...body,
			origin: stripLocation(body.origin as Record<string, unknown>),
			destination: stripLocation(body.destination as Record<string, unknown>),
			journeyType:
				TRIPJACK_PROVIDER_JOURNEY_TYPE_MAP[
					body.journeyType as TripjackJourneyType
				],
		};

		const result = await getTripjackQuotes(
			sanitisedBody as unknown as TripjackQuoteRequest,
		);

		try {
			const session = await getServerSession(authOptions);
			const userId = session?.user?.id;
			const userEmail = session?.user?.email || undefined;
			const userName = session?.user?.name || undefined;

			await logTravelActivity({
				userId,
				userEmail,
				userName,
				logType: "cab",
				action: "search",
				provider: "TRIPJACK",
				metadata: {
					tripType: body.tripType,
					journeyType: body.journeyType,
					origin: (body.origin as { displayAddress?: string })?.displayAddress,
					destination: (body.destination as { displayAddress?: string })
						?.displayAddress,
					pickupDate: body.pickupDate,
					returnDate: body.returnDate,
					passengers: body.passengers,
					quotesCount: result?.data?.quotesInfo?.length || 0,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			console.warn("Failed to log TripJack quote search", error);
		}

		return NextResponse.json({
			success: true,
			data: result.data,
			message: result.message,
		});
	} catch (error) {
		console.error("TripJack quotes error:", error);

		const { status, message, providerError } = resolveTripjackError(
			error,
			"Failed to fetch cab quotes",
		);

		return NextResponse.json(
			{
				success: false,
				error: message,
				providerError,
			},
			{ status },
		);
	}
}
