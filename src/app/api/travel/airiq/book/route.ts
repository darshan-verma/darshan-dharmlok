import { NextRequest, NextResponse } from "next/server";
import { bookFlight } from "@/lib/airiqClient";
import {
	logTravelActivity,
	getIpAddress,
	getUserAgent,
	type FlightLogData,
} from "@/lib/travelLogger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { linkSnapshotsToBooking } from "@/lib/audit/linkSnapshots";

type Passenger = {
	Title: string;
	FirstName: string;
	LastName: string;
	DateOfBirth: string;
	Gender: number;
	PassportNo?: string;
	PassportExpiry?: string;
	AddressLine1: string;
	City: string;
	CountryCode: string;
	CountryName: string;
	Nationality?: string;
	ContactNo: string;
	Email: string;
	IsLeadPax?: boolean;
	FFAirlineCode?: string;
	FFNumber?: string;
	GSTCompanyAddress?: string;
	GSTCompanyContactNumber?: string;
	GSTCompanyName?: string;
	GSTNumber?: string;
	GSTCompanyEmail?: string;
};

type SSRItem = {
	Price?: number;
	[key: string]: unknown;
};

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const {
			traceId,
			resultIndex,
			passengers,
			ssrData,
			flightData,
			adultCount,
			childCount,
			infantCount,
		} = body;

		if (!traceId || !resultIndex || !passengers) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 }
			);
		}

		// Get agent credentials from environment
		const agentId = process.env.AIRIQ_AGENT_ID;
		const airiqUserName = process.env.AIRIQ_USERNAME;

		if (!agentId || !airiqUserName) {
			return NextResponse.json(
				{ error: "Missing AIRiQ credentials" },
				{ status: 500 }
			);
		}

		// Transform passengers to AIRiQ format
		const airiqPassengers = (passengers as Passenger[]).map((passenger) => ({
			Title: passenger.Title,
			FirstName: passenger.FirstName,
			LastName: passenger.LastName,
			DateOfBirth: passenger.DateOfBirth,
			Gender: passenger.Gender, // AIRiQ uses numeric: 1=Male, 2=Female
			PassportNo: passenger.PassportNo,
			PassportExpiry: passenger.PassportExpiry,
			AddressLine1: passenger.AddressLine1,
			City: passenger.City,
			CountryCode: passenger.CountryCode,
			CountryName: passenger.CountryName,
			Nationality: passenger.Nationality,
			ContactNo: passenger.ContactNo,
			Email: passenger.Email,
			IsLeadPax: passenger.IsLeadPax || false,
			FFAirlineCode: passenger.FFAirlineCode,
			FFNumber: passenger.FFNumber,
			GSTCompanyAddress: passenger.GSTCompanyAddress,
			GSTCompanyContactNumber: passenger.GSTCompanyContactNumber,
			GSTCompanyName: passenger.GSTCompanyName,
			GSTNumber: passenger.GSTNumber,
			GSTCompanyEmail: passenger.GSTCompanyEmail,
		}));

		// Construct booking request
		const bookingRequest = {
			ResultIndex: resultIndex,
			TraceId: traceId,
			Passengers: airiqPassengers,
			EndUserIp: "192.168.1.1",
		};

		console.log(
			"AIRiQ Booking Request:",
			JSON.stringify(bookingRequest, null, 2)
		);

		// Call AIRiQ Booking API
		const bookingResponse = await bookFlight(bookingRequest);

		console.log(
			"AIRiQ Booking Response:",
			JSON.stringify(bookingResponse, null, 2)
		);

		// Check for errors
		if (bookingResponse.Response?.Status !== 1) {
			throw new Error(
				bookingResponse.Response?.Error?.ErrorMessage || "Booking failed"
			);
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

		// Extract flight details for logging
		const flightLogData: FlightLogData = {
			origin: flightData?.Origin?.Airport?.AirportCode || undefined,
			destination: flightData?.Destination?.Airport?.AirportCode || undefined,
			departureDate: flightData?.Origin?.DepTime || undefined,
			returnDate: flightData?.Destination?.ArrTime || undefined,
			airline: flightData?.AirlineCode || flightData?.ValidatingAirlineCode || undefined,
			flightNumber: flightData?.FlightNumber || undefined,
			cabinClass: flightData?.CabinClass || undefined,
			adultCount: adultCount || (passengers as Passenger[])?.filter((p) => !p.DateOfBirth || new Date().getFullYear() - new Date(p.DateOfBirth).getFullYear() >= 12).length || 0,
			childCount: childCount || (passengers as Passenger[])?.filter((p) => {
				const age = new Date().getFullYear() - new Date(p.DateOfBirth).getFullYear();
				return age >= 2 && age < 12;
			}).length || 0,
			infantCount: infantCount || (passengers as Passenger[])?.filter((p) => {
				const age = new Date().getFullYear() - new Date(p.DateOfBirth).getFullYear();
				return age < 2;
			}).length || 0,
			seats: ssrData?.seats || undefined,
			meals: ssrData?.meals || undefined,
			baggage: ssrData?.baggage || undefined,
			totalFare: flightData?.Fare?.BaseFare || undefined,
			totalTax: flightData?.Fare?.Tax || undefined,
			totalMealCharges: ssrData?.meals && typeof ssrData.meals === "object"
				? (Object.values(ssrData.meals) as SSRItem[]).reduce(
						(sum: number, meal: SSRItem) => sum + (meal?.Price || 0),
						0
				  )
				: undefined,
			totalSeatCharges: ssrData?.seats && typeof ssrData.seats === "object"
				? (Object.values(ssrData.seats) as SSRItem[]).reduce(
						(sum: number, seat: SSRItem) => sum + (seat?.Price || 0),
						0
				  )
				: undefined,
			bookingStatus: bookingResponse.Response?.Status === 1 ? "success" : "failed",
		};

		// Calculate total amount
		const totalAmount =
			(flightData?.Fare?.BaseFare || 0) +
			(flightData?.Fare?.Tax || 0) +
			(flightLogData.totalMealCharges || 0) +
			(flightLogData.totalSeatCharges || 0);

		// Get booking ID for linking snapshots
		const bookingId = bookingResponse.Response?.BookingId;

		// Link snapshots to booking (non-blocking)
		if (bookingId && traceId) {
			linkSnapshotsToBooking(traceId, bookingId.toString()).catch(() => {
				// Silently fail - don't block response
			});
		}

		// Log the activity (fire-and-forget, won't block response)
		logTravelActivity({
			userId,
			userEmail,
			userName,
			logType: "flight",
			action: "booking",
			provider: "AIRiQ",
			flightData: flightLogData,
			bookingCode: bookingId || undefined,
			traceId,
			resultIndex: resultIndex?.toString(),
			totalAmount,
			currency: "INR",
			metadata: {
				bookingResponse: bookingResponse.Response ? {
					status: bookingResponse.Response.Status,
					bookingId: bookingResponse.Response.BookingId,
				} : undefined,
			},
			ipAddress: getIpAddress(req),
			userAgent: getUserAgent(req),
		});

		return NextResponse.json(bookingResponse);
	} catch (error) {
		console.error("AIRiQ Booking API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
