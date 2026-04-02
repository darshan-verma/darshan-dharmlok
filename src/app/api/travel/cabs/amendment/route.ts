import { NextRequest, NextResponse } from "next/server";
import {
	createTripjackAmendment,
	getTripjackAmendmentCharges,
} from "@/lib/tripjackClient";
import type { TripjackAmendmentRequest } from "@/types/tripjack";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { resolveTripjackError } from "@/lib/tripjackError";

const CANCELLATION = "CANCELLATION";

export async function GET(request: NextRequest) {
	try {
		const bookingId = request.nextUrl.searchParams.get("bookingId");
		const type = request.nextUrl.searchParams.get("type");

		if (!bookingId || !bookingId.trim()) {
			return NextResponse.json(
				{ success: false, error: "bookingId query param is required" },
				{ status: 400 },
			);
		}

		if (!type || type.toUpperCase() !== CANCELLATION) {
			return NextResponse.json(
				{ success: false, error: "type must be CANCELLATION" },
				{ status: 400 },
			);
		}

		const result = await getTripjackAmendmentCharges(bookingId, CANCELLATION);

		try {
			const session = await getServerSession(authOptions);
			await logTravelActivity({
				userId: session?.user?.id,
				userEmail: session?.user?.email || undefined,
				userName: session?.user?.name || undefined,
				logType: "cab",
				action: "selection",
				provider: "TRIPJACK",
				metadata: {
					bookingId,
					type: CANCELLATION,
					amendment: result?.data?.amendment,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			console.warn("Failed to log TripJack amendment charges fetch", error);
		}

		return NextResponse.json({
			success: true,
			message: result.message,
			data: result.data,
		});
	} catch (error) {
		console.error("TripJack amendment GET error:", error);

		const { status, message, providerError } = resolveTripjackError(
			error,
			"Failed to fetch amendment charges",
		);

		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}

function validateAmendmentPayload(
	body: Record<string, unknown>,
): string | null {
	if (typeof body.bookingId !== "string" || !body.bookingId.trim()) {
		return "bookingId is required";
	}

	if (body.amendmentType !== CANCELLATION) {
		return "amendmentType must be CANCELLATION";
	}

	return null;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const validationError = validateAmendmentPayload(body);

		if (validationError) {
			return NextResponse.json(
				{ success: false, error: validationError },
				{ status: 400 },
			);
		}

		const result = await createTripjackAmendment(
			body as unknown as TripjackAmendmentRequest,
		);

		try {
			const session = await getServerSession(authOptions);
			await logTravelActivity({
				userId: session?.user?.id,
				userEmail: session?.user?.email || undefined,
				userName: session?.user?.name || undefined,
				logType: "cab",
				action: "booking",
				provider: "TRIPJACK",
				bookingCode: body.bookingId as string,
				metadata: {
					amendmentType: body.amendmentType,
					result: result?.data,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			console.warn("Failed to log TripJack amendment creation", error);
		}

		return NextResponse.json({
			success: true,
			message: result.message,
			data: result.data,
		});
	} catch (error) {
		console.error("TripJack amendment POST error:", error);

		const { status, message, providerError } = resolveTripjackError(
			error,
			"Failed to create amendment",
		);

		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}
