import { NextRequest, NextResponse } from "next/server";
import { createTripjackPayment } from "@/lib/tripjackClient";
import type { TripjackPaymentRequest } from "@/types/tripjack";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getIpAddress,
	getUserAgent,
	logTravelActivity,
} from "@/lib/travelLogger";
import { resolveTripjackError } from "@/lib/tripjackError";

function validatePayload(body: Record<string, unknown>): string | null {
	const required = [
		"amount",
		"payUserId",
		"paymentMedium",
		"bookingId",
		"opType",
		"product",
		"transactionType",
	];

	for (const field of required) {
		if (!(field in body)) {
			return `Missing required field: ${field}`;
		}
	}

	if (typeof body.amount !== "number" || body.amount <= 0) {
		return "amount must be a positive number";
	}

	if (body.product !== "CAB") {
		return "product must be CAB";
	}

	return null;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as Record<string, unknown>;
		const validationError = validatePayload(body);

		if (validationError) {
			return NextResponse.json(
				{ success: false, error: validationError },
				{ status: 400 },
			);
		}

		const result = await createTripjackPayment(
			body as unknown as TripjackPaymentRequest,
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
				totalAmount: body.amount as number,
				currency: "INR",
				metadata: {
					payUserId: body.payUserId,
					paymentMedium: body.paymentMedium,
					opType: body.opType,
					transactionType: body.transactionType,
					result: result?.data,
				},
				ipAddress: getIpAddress(request),
				userAgent: getUserAgent(request),
			});
		} catch (error) {
			console.warn("Failed to log TripJack payment creation", error);
		}

		return NextResponse.json({
			success: true,
			message: result.message,
			data: result.data,
		});
	} catch (error) {
		console.error("TripJack payment create error:", error);

		const { status, message, providerError } = resolveTripjackError(
			error,
			"Failed to create payment",
		);

		return NextResponse.json(
			{ success: false, error: message, providerError },
			{ status },
		);
	}
}
