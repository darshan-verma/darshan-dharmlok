/**
 * Travel Audit Logger
 * Lightweight utility for logging travel booking activities
 */

import prisma from "./prisma";

export interface FlightLogData {
	origin?: string;
	destination?: string;
	departureDate?: string;
	returnDate?: string;
	airline?: string;
	flightNumber?: string;
	cabinClass?: string;
	adultCount?: number;
	childCount?: number;
	infantCount?: number;
	seats?: Record<string, { SeatID: string; Price: number } | null>;
	meals?: Record<string, { Id: string; Price: number } | null>;
	baggage?: Record<string, { Id: string; Price: number } | null>;
	totalFare?: number;
	totalTax?: number;
	totalMealCharges?: number;
	totalSeatCharges?: number;
	bookingStatus?: string;
}

export interface HotelLogData {
	hotelCode?: string;
	hotelName?: string;
	cityCode?: string;
	cityName?: string;
	countryCode?: string;
	checkIn?: string;
	checkOut?: string;
	rooms?: Array<{
		roomType?: string;
		mealType?: string;
		adults?: number;
		children?: number;
	}>;
	totalFare?: number;
	totalTax?: number;
	bookingStatus?: string;
}

export interface CabLogData {
	tripType?: string;
	journeyType?: string;
	origin?: string;
	destination?: string;
	pickupDate?: string;
	returnDate?: string;
	passengers?: number;
	vehicleType?: string;
	vehicleCategory?: string;
	quoteId?: string;
	bookingId?: string;
	bookingStatus?: string;
	totalFare?: number;
}

interface LogTravelActivityParams {
	userId?: string;
	userEmail?: string;
	userName?: string;
	logType: "flight" | "hotel" | "cab" | "insurance";
	action: "booking" | "search" | "selection";
	provider?: string;
	flightData?: FlightLogData;
	hotelData?: HotelLogData;
	bookingCode?: string;
	traceId?: string;
	resultIndex?: string;
	totalAmount?: number;
	currency?: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
}

/**
 * Log a travel activity (lightweight, minimal overhead)
 */
export async function logTravelActivity(
	params: LogTravelActivityParams,
): Promise<void> {
	try {
		// Use fire-and-forget approach to minimize impact on booking flow
		// Don't await - let it run in background
		prisma.travelLog
			.create({
				data: {
					userId: params.userId,
					userEmail: params.userEmail,
					userName: params.userName,
					logType: params.logType,
					action: params.action,
					provider: params.provider,
					flightData: params.flightData
						? (params.flightData as unknown as object)
						: null,
					hotelData: params.hotelData
						? (params.hotelData as unknown as object)
						: null,
					bookingCode: params.bookingCode,
					traceId: params.traceId,
					resultIndex: params.resultIndex,
					totalAmount: params.totalAmount,
					currency: params.currency || "INR",
					metadata: params.metadata
						? (params.metadata as unknown as object)
						: null,
					ipAddress: params.ipAddress,
					userAgent: params.userAgent,
				},
			})
			.catch((error) => {
				// Silently log errors to console, don't throw
				// This ensures logging never breaks the booking flow
				console.error("Travel log error (non-blocking):", error);
			});
	} catch (error) {
		// Silently handle any errors - logging should never break booking
		console.error("Travel log error (non-blocking):", error);
	}
}

/**
 * Extract IP address from request headers
 */
export function getIpAddress(request: Request): string | undefined {
	// Try various headers that might contain the IP
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}

	const realIp = request.headers.get("x-real-ip");
	if (realIp) {
		return realIp;
	}

	return undefined;
}

/**
 * Extract user agent from request headers
 */
export function getUserAgent(request: Request): string | undefined {
	return request.headers.get("user-agent") || undefined;
}
