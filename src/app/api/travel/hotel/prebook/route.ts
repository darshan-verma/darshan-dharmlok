/**
 * API Route: Hotel PreBook
 * POST /api/travel/hotel/prebook
 *
 * PreBook a hotel room using TBO Hotel API
 */

import { NextRequest, NextResponse } from "next/server";
import { preBookHotel } from "@/lib/tboHotelClient";

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

		// Check if the API returned an error status
		if (result.Status && typeof result.Status === "object") {
			const statusCode = result.Status.Code;
			const description = (result.Status.Description || "").toLowerCase();

			const isSuccess =
				statusCode === 1 ||
				statusCode === 0 ||
				(statusCode === 200 &&
					(description.includes("success") || description === "successful"));

			if (!isSuccess) {
				const errorMsg =
					result.Status.Description || `API Error: Code ${statusCode}`;
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
