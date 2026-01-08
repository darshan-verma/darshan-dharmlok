import { NextRequest, NextResponse } from "next/server";
import { bookFlight } from "@/lib/airiqClient";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { traceId, resultIndex, passengers } = body;

		if (!traceId || !resultIndex || !passengers) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 }
			);
		}

		// Get agent credentials from environment
		const agentId = process.env.AIRIQ_AGENT_ID;
		const userName = process.env.AIRIQ_USERNAME;

		if (!agentId || !userName) {
			return NextResponse.json(
				{ error: "Missing AIRiQ credentials" },
				{ status: 500 }
			);
		}

		// Transform passengers to AIRiQ format
		const airiqPassengers = passengers.map((passenger: {
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
		}) => ({
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

		return NextResponse.json(bookingResponse);
	} catch (error) {
		console.error("AIRiQ Booking API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
