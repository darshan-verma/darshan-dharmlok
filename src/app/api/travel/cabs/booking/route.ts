import { NextRequest, NextResponse } from "next/server";
import { createTripjackBooking } from "@/lib/tripjackClient";
import type { TripjackBookingRequest } from "@/types/tripjack";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { resolveTripjackError } from "@/lib/tripjackError";

function validateBookingPayload(body: Record<string, unknown>): string | null {
	const requiredTopLevel = [
		"journeyInfo",
		"routeDetail",
		"quotationInfo",
		"pricingInfo",
		"passengerDetail",
		"consent",
		"agentEmail",
		"agentPhone",
		"agentId",
		"vendorId",
	];

	for (const field of requiredTopLevel) {
		if (!(field in body)) {
			return `Missing required field: ${field}`;
		}
	}

	if (body.consent !== "yes") {
		return "consent must be 'yes'";
	}

	if (typeof body.agentEmail !== "string" || !body.agentEmail.includes("@")) {
		return "agentEmail must be a valid email";
	}

	if (
		typeof body.agentPhone !== "string" ||
		body.agentPhone.trim().length < 8
	) {
		return "agentPhone must be a valid phone number";
	}

	const quotationInfo = body.quotationInfo as Record<string, unknown>;
	const pricingInfo = body.pricingInfo as Record<string, unknown>;
	const passengerDetail = body.passengerDetail as Record<string, unknown>;
	const routeDetail = body.routeDetail as Record<string, unknown>;

	if (
		!quotationInfo ||
		typeof quotationInfo !== "object" ||
		!quotationInfo.quoteId ||
		!quotationInfo.childQuoteId ||
		typeof quotationInfo.vendorId !== "number"
	) {
		return "quotationInfo must include quoteId, childQuoteId and numeric vendorId";
	}

	if (
		!pricingInfo ||
		typeof pricingInfo !== "object" ||
		!pricingInfo.netAmount ||
		!pricingInfo.grossAmount
	) {
		return "pricingInfo must include netAmount and grossAmount";
	}

	if (
		!passengerDetail ||
		typeof passengerDetail !== "object" ||
		!passengerDetail.firstName ||
		!passengerDetail.lastName ||
		!passengerDetail.email ||
		!passengerDetail.phone
	) {
		return "passengerDetail must include firstName, lastName, email and phone";
	}

	if (
		!routeDetail ||
		typeof routeDetail !== "object" ||
		!routeDetail.origin ||
		!routeDetail.destination
	) {
		return "routeDetail must include origin and destination";
	}

	return null;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const validationError = validateBookingPayload(body);

		if (validationError) {
			return NextResponse.json(
				{
					success: false,
					error: validationError,
				},
				{ status: 400 },
			);
		}

		const result = await createTripjackBooking(
			body as unknown as TripjackBookingRequest,
		);

		try {
			const session = await getServerSession(authOptions);
			const userId = session?.user?.id;
			const userEmail = session?.user?.email || undefined;
			const userName = session?.user?.name || undefined;
			const quotationInfo = body.quotationInfo as Record<string, unknown>;

			await logTravelActivity({
				userId,
				userEmail,
				userName,
				logType: "cab",
				action: "booking",
				provider: "TRIPJACK",
				bookingCode: result?.data?.id,
				totalAmount: result?.data?.totalPrice,
				currency: result?.data?.currency || "INR",
				metadata: {
					quoteId: quotationInfo.quoteId,
					childQuoteId: quotationInfo.childQuoteId,
					vendorId: quotationInfo.vendorId,
					status: result?.data?.status,
					trackingLink: result?.data?.trackingLink,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			console.warn("Failed to log TripJack booking", error);
		}

		return NextResponse.json({
			success: true,
			data: result.data,
			message: result.message,
		});
	} catch (error) {
		console.error("TripJack booking error:", error);

		const { status, message, providerError } = resolveTripjackError(
			error,
			"Failed to create cab booking",
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
