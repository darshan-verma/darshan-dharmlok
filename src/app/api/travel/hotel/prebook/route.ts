/**
 * API Route: Hotel PreBook
 * POST /api/travel/hotel/prebook
 *
 * PreBook a hotel room using TBO Hotel API
 */

import { NextRequest, NextResponse } from "next/server";
import { preBookHotel } from "@/lib/tboHotelClient";
import {
	logTravelActivity,
	getIpAddress,
	getUserAgent,
	type HotelLogData,
} from "@/lib/travelLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate required fields
		if (!body.bookingCode) {
			return NextResponse.json(
				{
					success: false,
					error: "bookingCode is required",
				},
				{ status: 400 }
			);
		}

		// Call TBO PreBook API
		const result = await preBookHotel({
			bookingCode: body.bookingCode,
			paymentMode: body.paymentMode || "Limit",
		});

		// Determine if the booking was successful
		let isSuccess = false;

		// The API might return a Status field - check for errors
		type ResultWithStatus = {
			Status?: {
				Code: number;
				Description?: string;
			};
		};

		// Check if the API returned an error status
		if (
			(result as ResultWithStatus).Status &&
			typeof (result as ResultWithStatus).Status === "object"
		) {
			const status = (result as ResultWithStatus).Status;
			if (status) {
				const statusCode = status.Code;
				const description = (status.Description || "").toLowerCase();

				isSuccess =
					statusCode === 1 ||
					statusCode === 0 ||
					(statusCode === 200 &&
						(description.includes("success") || description === "successful"));

				if (!isSuccess) {
					const errorMsg =
						status.Description || `API Error: Code ${statusCode}`;
					return NextResponse.json(
						{
							success: false,
							error: errorMsg,
							statusCode,
						},
						{ status: 400 }
					);
				}
			}
		} else {
			// If no status object, assume success if we got a result
			isSuccess = !!result;
		}

		// Log the booking activity (non-blocking)
		// Try to get user session, but don't block if it fails
		let userId: string | undefined;
		let userEmail: string | undefined;
		let userName: string | undefined;

		try {
			const session = await getServerSession(authOptions);
			userId = session?.user?.id;
			userEmail = session?.user?.email || undefined;
			userName = session?.user?.name || undefined;
		} catch (error) {
			// Session fetch failed, continue without user info
			console.warn("Could not fetch session for logging:", error);
		}

		// Extract hotel details for logging
		const hotelInfo = body.hotelData || {};
		const roomData = hotelInfo.roomData || {};

		const hotelLogData: HotelLogData = {
			hotelCode: hotelInfo.hotelCode || undefined,
			hotelName: hotelInfo.hotelName || undefined,
			cityName: hotelInfo.city || undefined,
			countryCode: hotelInfo.country || undefined,
			checkIn: roomData.checkIn || undefined,
			checkOut: roomData.checkOut || undefined,
			rooms: roomData.rooms || undefined,
			totalFare: roomData.totalFare || undefined,
			totalTax: roomData.totalTax || undefined,
			bookingStatus: isSuccess ? "success" : "failed",
		};

		const totalAmount = (roomData.totalFare || 0) + (roomData.totalTax || 0);

		// Log the activity (fire-and-forget, won't block response)
		logTravelActivity({
			userId,
			userEmail,
			userName,
			logType: "hotel",
			action: "booking",
			provider: "TBO",
			hotelData: hotelLogData,
			bookingCode: body.bookingCode,
			totalAmount: totalAmount > 0 ? totalAmount : undefined,
			currency: "INR",
			metadata: {
				preBookResponse: (result as ResultWithStatus).Status
					? {
							statusCode: (result as ResultWithStatus).Status!.Code,
							description: (result as ResultWithStatus).Status!.Description,
					  }
					: undefined,
			},
			ipAddress: getIpAddress(request),
			userAgent: getUserAgent(request),
		});

		return NextResponse.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("PreBook API error:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to prebook hotel room",
			},
			{ status: 500 }
		);
	}
}
