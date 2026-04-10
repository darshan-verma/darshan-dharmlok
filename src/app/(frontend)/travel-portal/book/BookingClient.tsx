"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PassengerDetails from "../components/PassengerDetails";
import SSRSelection from "../components/ssr/SSRSelection";
import { BaggageOption } from "../components/ssr/BaggageSelection";
import { MealOption } from "../components/ssr/MealSelection";
import { SeatOption } from "../components/ssr/SeatSelection";
import { SpecialServiceOption } from "../components/ssr/SpecialServiceSelection";
import FareBreakdown from "@/components/travel-portal/FareBreakdown";
import FareUpsellList from "../components/FareUpsellList";
import FlightDetails from "./components/FlightDetails";
import FareRulesView from "./components/FareRulesView";
import { toast } from "@/lib/toast";
import type {
	FlightResult,
	PassengerDetail,
	FareRuleResponse,
	TboBookPassenger,
	TboBookPassengerFare,
	BookingResponse,
	Fare,
	TboGetBookingDetailsFlightItinerary,
	TicketResponse,
} from "@/types/tbo";
import { captureAndSendSnapshot } from "@/lib/audit/snapshotClient";
// import { Button } from "@/components/ui/button"; // Assuming available if needed later, but PassengerDetails has the button

interface BookingClientProps {
	adultCount: number;
	childCount: number;
	infantCount: number;
	traceId: string;
	resultIndex: string;
	flightResult: FlightResult;
	upsellOptions?: FlightResult[];
	isUpsellAllowed?: boolean;
	fareRules: FareRuleResponse | null;
}

/** Map FlightResult Fare to TBO Book request per-passenger Fare (doc 5.25). */
function mapFareToBookFare(fare: Fare | undefined): TboBookPassengerFare {
	if (!fare) {
		return {
			Currency: "INR",
			BaseFare: 0,
			Tax: 0,
			TransactionFee: 0,
			YQTax: 0,
			AdditionalTxnFeeOfrd: 0,
			AdditionalTxnFeePub: 0,
			AirTransFee: 0,
			OtherCharges: 0,
			Discount: 0,
			PublishedFare: 0,
			OfferedFare: 0,
			TdsOnCommission: 0,
			TdsOnPLB: 0,
			TdsOnIncentive: 0,
			ServiceFee: 0,
		};
	}
	const chargeBU = fare.ChargeBU;
	let tboMarkUp = 0,
		convenienceCharge = 0,
		otherCharge = 0;
	if (Array.isArray(chargeBU) && chargeBU.length > 0) {
		for (const item of chargeBU) {
			const k = (item as { key?: string; Key?: string }).key ?? (item as { key?: string; Key?: string }).Key ?? "";
			const v = (item as { value?: number; Value?: number }).value ?? (item as { value?: number; Value?: number }).Value ?? 0;
			if (k.toUpperCase() === "TBOMARKUP") tboMarkUp = v;
			else if (k.toUpperCase() === "CONVENIENCECHARGE") convenienceCharge = v;
			else if (k.toUpperCase() === "OTHERCHARGE") otherCharge = v;
		}
	}
	return {
		Currency: fare.Currency ?? "INR",
		BaseFare: fare.BaseFare ?? 0,
		Tax: fare.Tax ?? 0,
		TransactionFee: (fare as Fare & { TransactionFee?: number }).TransactionFee ?? 0,
		YQTax: fare.YQTax ?? 0,
		AdditionalTxnFeeOfrd: fare.AdditionalTxnFeeOfrd ?? 0,
		AdditionalTxnFeePub: fare.AdditionalTxnFeePub ?? 0,
		AirTransFee: fare.AirlineTransFee ?? 0,
		OtherCharges: fare.OtherCharges ?? 0,
		Discount: fare.Discount ?? 0,
		PublishedFare: fare.PublishedFare ?? 0,
		OfferedFare: fare.OfferedFare ?? 0,
		TdsOnCommission: fare.TdsOnCommission ?? 0,
		TdsOnPLB: fare.TdsOnPLB ?? 0,
		TdsOnIncentive: fare.TdsOnIncentive ?? 0,
		ServiceFee: fare.ServiceFee ?? 0,
		ChargeBU: [{ TBOMarkUp: tboMarkUp, ConvenienceCharge: convenienceCharge, OtherCharge: otherCharge }],
	};
}

export default function BookingClient({
	adultCount,
	childCount,
	infantCount,
	traceId,
	resultIndex,
	flightResult,
	upsellOptions = [],
	isUpsellAllowed = false,
	fareRules,
}: BookingClientProps) {
	const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
	const [bookingSuccess, setBookingSuccess] = useState<{ pnr: string; bookingId: number } | null>(null);
	const [bookingDetails, setBookingDetails] = useState<TboGetBookingDetailsFlightItinerary | null>(null);
	const [bookingDetailsLoading, setBookingDetailsLoading] = useState(false);
	const [bookingDetailsError, setBookingDetailsError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [pendingPriceChange, setPendingPriceChange] = useState<BookingResponse | null>(null);
	const [ticketLoading, setTicketLoading] = useState(false);
	const [ticketError, setTicketError] = useState<string | null>(null);
	const [ticketPriceChange, setTicketPriceChange] = useState<TicketResponse | null>(null);
	const [ticketSuccess, setTicketSuccess] = useState(false);
	const router = useRouter();
	const [selectedSSRs, setSelectedSSRs] = useState<{
		baggage: Record<string, BaggageOption | null>;
		meals: Record<string, MealOption | null>;
		seats: Record<string, SeatOption | null>;
		specialServices: Record<string, SpecialServiceOption[]>;
	}>({
		baggage: {},
		meals: {},
		seats: {},
		specialServices: {},
	});

	// Fetch full booking details when booking is on hold (for display)
	useEffect(() => {
		if (!bookingSuccess) {
			setBookingDetails(null);
			setBookingDetailsError(null);
			return;
		}
		const { pnr, bookingId } = bookingSuccess;
		const EndUserIp = "192.168.1.1";
		const body: Record<string, unknown> = { EndUserIp };
		if (bookingId > 0) {
			body.BookingId = bookingId;
			if (pnr) body.PNR = pnr;
		} else if (traceId) {
			body.TraceId = traceId;
		} else if (pnr && passengers[0]) {
			body.PNR = pnr;
			body.FirstName = passengers[0].FirstName;
			body.LastName = passengers[0].LastName;
		} else {
			return;
		}
		setBookingDetailsLoading(true);
		setBookingDetailsError(null);
		fetch("/api/travel/tbo/booking-details", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data?.error) {
					setBookingDetailsError(data.error);
					setBookingDetails(null);
					return;
				}
				const itinerary = data?.Response?.FlightItinerary;
				setBookingDetails(itinerary ?? null);
				if (!itinerary) setBookingDetailsError("No itinerary in response");
			})
			.catch((err) => {
				setBookingDetailsError(err instanceof Error ? err.message : "Failed to load booking details");
				setBookingDetails(null);
			})
			.finally(() => setBookingDetailsLoading(false));
	}, [bookingSuccess, traceId, passengers]);

	// Capture snapshot when booking review page loads
	useEffect(() => {
		captureAndSendSnapshot(
			{
				flightResult,
				adultCount,
				childCount,
				infantCount,
				traceId,
				resultIndex,
				fareRules: fareRules ? {
					hasRules: true,
					// Don't include full rules to avoid large payload
				} : null,
			},
			{
				page: "flight_review",
				user: {},
				booking: {
					type: "flight",
					traceId,
					resultIndex,
				},
			}
		).catch(() => {
			// Silently fail - don't block user flow
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only capture once on mount

	const handleBookingSubmit = async (passengerData: PassengerDetail[]) => {
		try {
			if (!passengerData || passengerData.length === 0) {
				toast.error("Please provide passenger details");
				return;
			}

			const requirePassport = flightResult.IsPassportRequiredAtBook === true;
			const requirePassportFull = flightResult.IsPassportFullDetailRequiredAtBook === true;

			for (let i = 0; i < passengerData.length; i++) {
				const p = passengerData[i];
				if (!p.FirstName || !p.LastName) {
					toast.error(`Passenger ${i + 1}: First name and last name are required`);
					return;
				}
				if (p.Gender == null || p.Gender === undefined) {
					toast.error(`Passenger ${i + 1}: Gender is required`);
					return;
				}
				if (requirePassport || requirePassportFull) {
					if (!p.PassportNo?.trim()) {
						toast.error(`Passenger ${i + 1}: Passport number is required for this flight`);
						return;
					}
					if (!p.PassportExpiry?.trim()) {
						toast.error(`Passenger ${i + 1}: Passport expiry is required for this flight`);
						return;
					}
					if (requirePassportFull && !(p as PassengerDetail & { PassportIssueDate?: string }).PassportIssueDate?.trim()) {
						toast.error(`Passenger ${i + 1}: Passport issue date is required for this flight`);
						return;
					}
				}
				if (!p.AddressLine1?.trim() || !p.City?.trim() || !p.CountryCode?.trim()) {
					toast.error(`Passenger ${i + 1}: Complete address is required`);
					return;
				}
				if (!p.ContactNo?.trim()) {
					toast.error(`Passenger ${i + 1}: Contact number is required`);
					return;
				}
				if (!p.Email?.trim()) {
					toast.error(`Passenger ${i + 1}: Email address is required`);
					return;
				}
			}

			const bookFare = mapFareToBookFare(flightResult.Fare);
			const tboPassengers: TboBookPassenger[] = passengerData.map((p, index) => {
				const mealOption = selectedSSRs.meals?.[index];
				const seatOption = selectedSSRs.seats?.[index];
				return {
					Title: p.Title,
					FirstName: p.FirstName,
					LastName: p.LastName,
					PaxType: p.PaxType,
					DateOfBirth: p.DateOfBirth || undefined,
					Gender: p.Gender,
					GSTCompanyAddress: "",
					GSTCompanyContactNumber: "",
					GSTCompanyName: "",
					GSTNumber: "",
					GSTCompanyEmail: "",
					PassportNo: p.PassportNo || undefined,
					PassportExpiry: p.PassportExpiry || undefined,
					PassportIssueDate: (p as PassengerDetail & { PassportIssueDate?: string }).PassportIssueDate || undefined,
					AddressLine1: p.AddressLine1,
					AddressLine2: p.AddressLine2,
					City: p.City,
					CountryCode: p.CountryCode,
					CountryName: p.CountryName || "India",
					ContactNo: p.ContactNo,
					Email: p.Email,
					IsLeadPax: index === 0,
					FFAirlineCode: p.FFAirlineCode ?? null,
					FFNumber: p.FFNumber ?? "",
					Fare: bookFare,
					Meal: mealOption && "Code" in mealOption ? { Code: mealOption.Code, Description: typeof mealOption.Description === "string" ? mealOption.Description : String(mealOption.Description ?? "") } : undefined,
					Seat: seatOption && "Code" in seatOption ? { Code: seatOption.Code, Description: typeof seatOption.Description === "string" ? seatOption.Description : String(seatOption.Description ?? "") } : undefined,
					Nationality: p.Nationality || "IN",
					CellCountryCode: (p as PassengerDetail & { CellCountryCode?: string }).CellCountryCode,
				};
			});

			await captureAndSendSnapshot(
				{
					flightResult,
					passengers: passengerData.map((p) => ({
						title: p.Title,
						firstName: p.FirstName,
						lastName: p.LastName,
						dateOfBirth: p.DateOfBirth,
						gender: p.Gender,
					})),
					ssrSelections: selectedSSRs,
					adultCount,
					childCount,
					infantCount,
					totalFare: flightResult.Fare?.OfferedFare,
					totalTax: flightResult.Fare?.Tax,
					traceId,
					resultIndex,
				},
				{
					page: "payment",
					user: {},
					booking: { type: "flight", traceId, resultIndex },
				}
			).catch(() => {});

			setIsSubmitting(true);
			const response = await fetch("/api/travel/tbo/book", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					EndUserIp: "192.168.1.1",
					TraceId: traceId,
					ResultIndex: resultIndex,
					Passengers: tboPassengers,
				}),
			});

			const result = await response.json().catch(() => ({}));

			if (!response.ok) {
				const errMsg = result?.error || "Booking failed";
				throw new Error(errMsg);
			}

			const res = result as BookingResponse;
			const resp = res?.Response;

			if (resp?.IsPriceChanged || resp?.IsTimeChanged) {
				setPendingPriceChange(res);
				toast.success(
					"Fare or flight time has changed. Please confirm the updated details and proceed to ticketing."
				);
				return;
			}

			if (resp?.Status === 1 && resp?.PNR && resp?.BookingId != null) {
				setBookingSuccess({ pnr: resp.PNR, bookingId: resp.BookingId });
				toast.success(`Booking held successfully. PNR: ${resp.PNR}. Proceed to payment/ticketing to confirm.`);
			} else {
				toast.success("Booking request submitted. Our team will contact you shortly.");
			}
		} catch (error) {
			console.error("Booking failed:", error);
			let errorMessage = "Booking failed. Please try again.";
			if (error instanceof Error) errorMessage = error.message;
			else if (typeof error === "string") errorMessage = error;
			if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("connection")) {
				toast.error("Network error. Please check your internet connection and try again.");
			} else if (errorMessage.toLowerCase().includes("validation")) {
				toast.error("Please check all required fields and try again.");
			} else {
				toast.error(errorMessage);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleIssueTicket = async (isPriceChangeAccepted = false) => {
		if (!bookingSuccess) return;
		setTicketError(null);
		setTicketPriceChange(null);
		setTicketLoading(true);
		try {
			const body: Record<string, unknown> = {
				EndUserIp: "192.168.1.1",
				TraceId: traceId,
				PNR: bookingSuccess.pnr,
				BookingId: bookingSuccess.bookingId,
			};
			if (isPriceChangeAccepted) body.IsPriceChangeAccepted = true;
			if (bookingDetails?.Passenger?.length && passengers.length > 0) {
				const requirePassportAtTicket = flightResult.IsPassportRequiredAtTicket === true;
				if (requirePassportAtTicket) {
					// Doc: each Passport item must have DateOfBirth (mandatory); PaxId optional
					body.Passport = passengers
						.map((p, i) => {
							const pax = bookingDetails.Passenger?.[i];
							const paxId = pax?.PaxId ?? pax?.PaxID;
							const dateOfBirth = p.DateOfBirth?.trim() || "";
							return {
								...(paxId != null && { PaxId: paxId }),
								PassportNo: p.PassportNo?.trim() || undefined,
								PassportExpiry: p.PassportExpiry?.trim() || undefined,
								DateOfBirth: dateOfBirth,
							};
						})
						.filter((entry) => entry.DateOfBirth !== "");
					if (Array.isArray(body.Passport) && body.Passport.length === 0) delete body.Passport;
				}
			}
			const res = await fetch("/api/travel/tbo/ticket", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setTicketError(data?.error || "Failed to issue ticket");
				return;
			}
			const ticketResp = data as TicketResponse & { IsPriceChanged?: boolean; IsTimeChanged?: boolean };
			if (ticketResp?.IsPriceChanged || ticketResp?.IsTimeChanged) {
				setTicketPriceChange(ticketResp);
				toast.success("Fare or time has changed. Accept the new price to issue your ticket.");
				return;
			}
			const status = ticketResp?.TicketStatus ?? ticketResp?.FlightItinerary?.TicketStatus;
			if (status === 1 || ticketResp?.PNR) {
				setTicketSuccess(true);
				toast.success("Ticket issued successfully.");
				router.push(
					`/travel-portal/booking/confirmation?bookingId=${bookingSuccess.bookingId}&pnr=${encodeURIComponent(bookingSuccess.pnr)}&traceId=${encodeURIComponent(traceId)}`
				);
				return;
			}
			setTicketError(ticketResp?.Message || "Ticket could not be issued. Please try again or contact support.");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to issue ticket";
			setTicketError(msg);
		} finally {
			setTicketLoading(false);
		}
	};

	return (
		<div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-[calc(8rem+env(safe-area-inset-bottom))]">
			<h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">
				Complete Your Booking
			</h1>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
				{/* Left Column: Flight Info & Passenger Details (65-70%) */}
				<div className="lg:col-span-8 space-y-8">
					{/* 1. Flight Details */}
					<section>
						<FlightDetails flightResult={flightResult} />
					</section>

					{/* 2. Passenger Details Form */}
					<section>
						{bookingSuccess && (
							<div className="mb-6 space-y-4">
								{ticketPriceChange && (
									<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
										<p className="font-medium">Fare or time updated</p>
										<p className="text-sm">The fare or schedule has changed at ticketing. Accept the new price to issue your ticket.</p>
										<button
											type="button"
											onClick={() => handleIssueTicket(true)}
											disabled={ticketLoading}
											className="mt-2 rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
										>
											{ticketLoading ? "Issuing…" : "Accept new price and issue ticket"}
										</button>
									</div>
								)}
								<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
									<p className="font-medium">Booking on hold</p>
									<p className="text-sm">PNR: {bookingSuccess.pnr} · Booking ID: {bookingSuccess.bookingId}</p>
									<p className="mt-1 text-sm">Proceed to ticketing to confirm your ticket.</p>
									{!flightResult.IsLCC && !ticketSuccess && (
										<button
											type="button"
											onClick={() => handleIssueTicket(false)}
											disabled={ticketLoading}
											className="mt-2 mr-3 rounded bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
										>
											{ticketLoading ? "Issuing ticket…" : "Generate ticket"}
										</button>
									)}
									<Link
										href={`/travel-portal/booking/confirmation?bookingId=${bookingSuccess.bookingId}&pnr=${encodeURIComponent(bookingSuccess.pnr)}&traceId=${encodeURIComponent(traceId)}`}
										className="mt-2 inline-block text-sm font-medium text-green-700 hover:text-green-900 underline"
									>
										View confirmation page
									</Link>
								</div>
								{ticketError && (
									<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
										{ticketError}
									</div>
								)}
								{bookingDetailsLoading && (
									<div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-600 text-sm">
										Loading booking details…
									</div>
								)}
								{bookingDetailsError && !bookingDetailsLoading && (
									<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
										{bookingDetailsError}
									</div>
								)}
								{bookingDetails && !bookingDetailsLoading && (
									<div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
										<h3 className="font-semibold text-gray-900">Booking details</h3>
										<div className="grid grid-cols-2 gap-2 text-sm">
											{bookingDetails.InvoiceNo != null && (
												<><span className="text-gray-500">Invoice</span><span>{bookingDetails.InvoiceNo}</span></>
											)}
											{bookingDetails.InvoiceCreatedOn != null && (
												<><span className="text-gray-500">Invoice date</span><span>{bookingDetails.InvoiceCreatedOn}</span></>
											)}
											{(bookingDetails.Status != null || bookingDetails.TicketStatus != null) && (
												<><span className="text-gray-500">Status</span><span>{(bookingDetails.TicketStatus ?? bookingDetails.Status) ?? "—"}</span></>
											)}
										</div>
										{bookingDetails.Segments && bookingDetails.Segments.length > 0 && (
											<div>
												<p className="text-gray-500 text-sm mb-2">Segments</p>
												<ul className="space-y-2">
													{bookingDetails.Segments.map((seg, i) => {
														const originCode = seg.Origin && typeof seg.Origin === "object" && "Airport" in seg.Origin
															? (seg.Origin as { Airport?: { AirportCode?: string } }).Airport?.AirportCode
															: undefined;
														const destCode = seg.Destination && typeof seg.Destination === "object" && "Airport" in seg.Destination
															? (seg.Destination as { Airport?: { AirportCode?: string } }).Airport?.AirportCode
															: undefined;
														const depTime = seg.Origin && typeof seg.Origin === "object" && "DepTime" in seg.Origin
															? (seg.Origin as { DepTime?: string }).DepTime
															: undefined;
														return (
															<li key={i} className="text-sm">
																{originCode ?? "—"} → {destCode ?? "—"}
																{seg.Airline && (
																	<span className="text-gray-500 ml-2">
																		{seg.Airline.AirlineCode} {seg.Airline.FlightNumber}
																		{depTime ? ` · ${depTime}` : ""}
																	</span>
																)}
															</li>
														);
													})}
												</ul>
											</div>
										)}
										{bookingDetails.Passenger && bookingDetails.Passenger.length > 0 && (
											<div>
												<p className="text-gray-500 text-sm mb-2">Passengers</p>
												<ul className="space-y-1 text-sm">
													{bookingDetails.Passenger.map((pax, i) => (
														<li key={i}>{pax.Title} {pax.FirstName} {pax.LastName}</li>
													))}
												</ul>
											</div>
										)}
										{bookingDetails.Fare && (
											<div className="text-sm">
												<span className="text-gray-500">Fare </span>
												<span>{bookingDetails.Fare.Currency} {(bookingDetails.Fare.OfferedFare ?? bookingDetails.Fare.PublishedFare) ?? "—"}</span>
											</div>
										)}
									</div>
								)}
							</div>
						)}
						{pendingPriceChange?.Response && (
							<div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
								<p className="font-medium">Fare or time updated</p>
								<p className="text-sm">The flight fare or schedule has changed. Use the updated details for ticketing.</p>
							</div>
						)}
						<PassengerDetails
							adultCount={adultCount}
							childCount={childCount}
							infantCount={infantCount}
							onBookingSubmit={handleBookingSubmit}
							onPassengersChange={setPassengers}
							flightResult={flightResult}
							isSubmitting={isSubmitting}
							requirePassport={flightResult.IsPassportRequiredAtBook === true}
							requirePassportFull={flightResult.IsPassportFullDetailRequiredAtBook === true}
							ssrCharges={{
								baggage: selectedSSRs.baggage,
								meals: selectedSSRs.meals,
								seats: selectedSSRs.seats,
								specialServices: selectedSSRs.specialServices,
							}}
						/>
					</section>

					{/* 3. Add-ons (SSR) */}
					<section>
						<SSRSelection
							traceId={traceId}
							resultIndex={resultIndex}
							passengers={passengers}
							adultCount={adultCount}
							childCount={childCount}
							infantCount={infantCount}
							onSSRChange={setSelectedSSRs}
						/>
					</section>

					{/* 4. Fare Upsell Options */}
					{isUpsellAllowed && upsellOptions.length > 0 && (
						<section>
							<FareUpsellList
								upsellOptions={upsellOptions}
								isUpsellAllowed={isUpsellAllowed}
								traceId={traceId}
								returnResultIndex={undefined}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								fallbackFareCurrency={flightResult.Fare?.Currency}
							/>
						</section>
					)}

					{/* 5. Fare Rules (Accordion) */}
					<section>
						<FareRulesView fareRules={fareRules} />
					</section>
				</div>

				{/* Right Column: Price Summary Sidebar (30-35%) with Sticky Behavior */}
				<div className="lg:col-span-4 h-full">
					<div className="sticky top-6 space-y-6">
						<FareBreakdown
							flight={flightResult}
							showValidation={false}
							ssrCharges={{
								baggage: selectedSSRs.baggage,
								meals: selectedSSRs.meals,
								seats: selectedSSRs.seats,
								specialServices: selectedSSRs.specialServices,
							}}
						/>

						{/* Additional info or guarantees can go here */}
						<div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 border border-gray-100">
							<p className="flex items-center gap-2 mb-2 font-medium text-gray-900">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-green-600"
								>
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
								</svg>
								Secure Booking
							</p>
							<p>
								Your data is encrypted and secure. We do not store your card
								details.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
