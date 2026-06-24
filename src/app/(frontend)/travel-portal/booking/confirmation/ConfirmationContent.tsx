"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { NormalizedBookingDetails } from "@/types/booking-details";
import type { TicketResponse } from "@/types/tbo";
import {
	tboItineraryToNormalized,
	airiqRetrieveResponseToNormalized,
	tripjackBookingDetailToNormalized,
} from "@/lib/booking-details-mappers";
import TripjackFlightConfirmationManage from "@/components/travel-portal/TripjackFlightConfirmationManage";

function formatBookingDateTime(value: string | undefined): string | undefined {
	if (!value?.trim()) return undefined;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? value : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ConfirmationContent() {
	const searchParams = useSearchParams();
	const source = searchParams.get("source"); // "tbo" | "airiq"
	const bookingIdParam = searchParams.get("bookingId");
	const pnrParam = searchParams.get("pnr");
	const traceIdParam = searchParams.get("traceId");
	const firstNameParam = searchParams.get("firstName");
	const lastNameParam = searchParams.get("lastName");
	const airIqPNRParam = searchParams.get("airIqPNR");
	const airlinePNRParam = searchParams.get("airlinePNR");

	const [details, setDetails] = useState<NormalizedBookingDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [ticketLoading, setTicketLoading] = useState(false);
	const [ticketError, setTicketError] = useState<string | null>(null);
	const [ticketPriceChange, setTicketPriceChange] = useState<TicketResponse | null>(null);

	const fetchDetails = useCallback(() => {
		const isAiriq =
			source === "airiq" ||
			(!!(airIqPNRParam?.trim() || airlinePNRParam?.trim()) && !bookingIdParam && !pnrParam);

		if (isAiriq) {
			const airIqPNR = airIqPNRParam?.trim() ?? "";
			const airlinePNR = airlinePNRParam?.trim() ?? "";
			if (!airIqPNR && !airlinePNR) {
				setError("Missing airIqPNR or airlinePNR in URL");
				setLoading(false);
				return;
			}
			setLoading(true);
			setError(null);
			const params = new URLSearchParams();
			if (airIqPNR) params.set("airIqPNR", airIqPNR);
			if (airlinePNR) params.set("airlinePNR", airlinePNR);
			fetch(`/api/travel/airiq/booking?${params.toString()}`)
				.then((res) => res.json())
				.then((data) => {
					if (data?.error) {
						setError(data.error);
						setDetails(null);
						return;
					}
					const raw = data.retrieveresponse ?? data.Retrieveresponse ?? data;
					const normalized = airiqRetrieveResponseToNormalized(raw);
					setDetails(normalized ?? null);
					if (!normalized) setError("No booking details in response");
				})
				.catch((err) => {
					setError(err instanceof Error ? err.message : "Failed to load booking details");
					setDetails(null);
				})
				.finally(() => setLoading(false));
			return;
		}

		if (source === "tripjack") {
			const bookingId = bookingIdParam?.trim() ?? "";
			if (!bookingId) {
				setError("Missing booking reference in URL");
				setLoading(false);
				return;
			}
			setLoading(true);
			setError(null);
			fetch("/api/travel/tripjack-flight/booking-details", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookingId }),
			})
				.then((res) => res.json())
				.then((data) => {
					if (!data?.success) {
						setError(data?.error || "Failed to load booking details");
						setDetails(null);
						return;
					}
					const normalized =
						data.normalized ?? tripjackBookingDetailToNormalized(data.data);
					setDetails(normalized ?? null);
					if (!normalized) setError("No booking details found");
				})
				.catch((err) => {
					setError(
						err instanceof Error
							? err.message
							: "Failed to load booking details",
					);
					setDetails(null);
				})
				.finally(() => setLoading(false));
			return;
		}

		// TBO
		const bookingId = bookingIdParam ? parseInt(bookingIdParam, 10) : NaN;
		const pnr = pnrParam?.trim() ?? "";
		if (!bookingIdParam && !pnr) {
			setError("Missing bookingId or pnr in URL");
			setLoading(false);
			return;
		}
		const EndUserIp = "192.168.1.1";
		const body: Record<string, unknown> = { EndUserIp };
		if (!Number.isNaN(bookingId) && bookingId > 0) {
			body.BookingId = bookingId;
			if (pnr) body.PNR = pnr;
		} else if (pnr) {
			const first = firstNameParam?.trim() ?? "";
			const last = lastNameParam?.trim() ?? "";
			if (!first && !last) {
				setError("For PNR lookup, provide firstName or lastName in the URL");
				setLoading(false);
				return;
			}
			body.PNR = pnr;
			if (first) body.FirstName = first;
			if (last) body.LastName = last;
		} else {
			setError("Provide bookingId or pnr (and optionally firstName, lastName)");
			setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		fetch("/api/travel/tbo/booking-details", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data?.error) {
					setError(data.error);
					setDetails(null);
					return;
				}
				const itinerary = data?.Response?.FlightItinerary ?? null;
				const normalized = tboItineraryToNormalized(itinerary);
				setDetails(normalized ?? null);
				if (!normalized) setError("No booking details in response");
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Failed to load booking details");
				setDetails(null);
			})
			.finally(() => setLoading(false));
	}, [
		source,
		bookingIdParam,
		pnrParam,
		firstNameParam,
		lastNameParam,
		airIqPNRParam,
		airlinePNRParam,
	]);

	useEffect(() => {
		fetchDetails();
	}, [fetchDetails]);

	const isTbo = !!(bookingIdParam && pnrParam && !airIqPNRParam && !airlinePNRParam);
	const canCompleteTicketing =
		isTbo &&
		!!traceIdParam &&
		!!details?.pnr &&
		!!details?.bookingId &&
		details.status !== "1";

	const handleCompleteTicketing = async (isPriceChangeAccepted = false) => {
		if (!details?.pnr || !details?.bookingId || !traceIdParam) return;
		setTicketError(null);
		setTicketPriceChange(null);
		setTicketLoading(true);
		try {
			const body: Record<string, unknown> = {
				EndUserIp: "192.168.1.1",
				TraceId: traceIdParam,
				PNR: details.pnr,
				BookingId: parseInt(details.bookingId, 10),
			};
			if (isPriceChangeAccepted) body.IsPriceChangeAccepted = true;
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
				return;
			}
			if (ticketResp?.TicketStatus === 1 || ticketResp?.PNR) {
				fetchDetails();
				return;
			}
			setTicketError(ticketResp?.Message || "Ticket could not be issued.");
		} catch (err) {
			setTicketError(err instanceof Error ? err.message : "Failed to issue ticket");
		} finally {
			setTicketLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto py-8 px-4 max-w-3xl">
				<p className="text-gray-600">Loading booking details…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto py-8 px-4 max-w-3xl">
				<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
					{error}
				</div>
				<Link href="/travel-portal" className="mt-4 inline-block text-blue-600 hover:underline">
					Back to Dharmlok Travels
				</Link>
			</div>
		);
	}

	if (!details) {
		return (
			<div className="container mx-auto py-8 px-4 max-w-3xl">
				<p className="text-gray-600">No booking details found.</p>
				<Link href="/travel-portal" className="mt-4 inline-block text-blue-600 hover:underline">
					Back to Dharmlok Travels
				</Link>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-3xl">
			<h1 className="text-2xl font-bold text-gray-900 mb-6">Booking confirmation</h1>
			{source === "tripjack" && bookingIdParam?.trim() && details ? (
				<TripjackFlightConfirmationManage
					bookingId={bookingIdParam.trim()}
					details={details}
					onRefetch={fetchDetails}
				/>
			) : null}
			{canCompleteTicketing && (
				<div className="mb-6 space-y-3">
					{ticketPriceChange && (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
							<p className="font-medium">Fare or time updated</p>
							<p className="text-sm">Accept the new price to issue your ticket.</p>
							<button
								type="button"
								onClick={() => handleCompleteTicketing(true)}
								disabled={ticketLoading}
								className="mt-2 rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
							>
								{ticketLoading ? "Issuing…" : "Accept new price and issue ticket"}
							</button>
						</div>
					)}
					{!ticketPriceChange && (
						<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
							<p className="font-medium">Booking on hold</p>
							<p className="text-sm">Issue your ticket to confirm the booking.</p>
							<button
								type="button"
								onClick={() => handleCompleteTicketing(false)}
								disabled={ticketLoading}
								className="mt-2 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
							>
								{ticketLoading ? "Issuing ticket…" : "Complete ticketing"}
							</button>
						</div>
					)}
					{ticketError && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
							{ticketError}
						</div>
					)}
				</div>
			)}
			<div className="rounded-lg border border-gray-200 bg-white p-6 space-y-6">
				<div className="grid grid-cols-2 gap-3 text-sm">
					{details.pnr != null && details.pnr !== "" && (
						<><span className="text-gray-500">PNR</span><span className="font-medium">{details.pnr}</span></>
					)}
					{details.bookingId != null && details.bookingId !== "" && (
						<><span className="text-gray-500">Booking ID</span><span>{details.bookingId}</span></>
					)}
					{details.gdsPnr != null && details.gdsPnr !== "" && (
						<><span className="text-gray-500">GDS PNR</span><span className="font-medium">{details.gdsPnr}</span></>
					)}
					{details.bookingCreatedOn != null && details.bookingCreatedOn !== "" && (
						<>
							<span className="text-gray-500">Booked on</span>
							<span>{formatBookingDateTime(details.bookingCreatedOn) ?? details.bookingCreatedOn}</span>
						</>
					)}
					{details.orderAmount != null && (
						<>
							<span className="text-gray-500">Order amount</span>
							<span>INR {details.orderAmount.toLocaleString()}</span>
						</>
					)}
					{details.invoiceNo != null && details.invoiceNo !== "" && (
						<><span className="text-gray-500">Invoice</span><span>{details.invoiceNo}</span></>
					)}
					{details.invoiceCreatedOn != null && details.invoiceCreatedOn !== "" && (
						<><span className="text-gray-500">Invoice date</span><span>{details.invoiceCreatedOn}</span></>
					)}
					{details.status != null && details.status !== "" && (
						<><span className="text-gray-500">Status</span><span>{details.status}</span></>
					)}
				</div>
				{details.segments && details.segments.length > 0 && (
					<div>
						<h2 className="font-semibold text-gray-900 mb-2">Flight segments</h2>
						<ul className="space-y-3">
							{details.segments.map((seg, i) => (
								<li key={i} className="border rounded-lg p-3 text-sm">
									<div className="font-medium">{seg.originCode || "—"} → {seg.destCode || "—"}</div>
									{(seg.airlineName || seg.airlineCode || seg.flightNumber) && (
										<div className="text-gray-600 mt-1">
											{seg.airlineName} {seg.airlineCode} {seg.flightNumber}
										</div>
									)}
									{(seg.depTime || seg.arrTime) && (
										<div className="text-gray-500 mt-1">
											{formatBookingDateTime(seg.depTime) ?? seg.depTime ?? "—"}
											{" – "}
											{formatBookingDateTime(seg.arrTime) ?? seg.arrTime ?? "—"}
										</div>
									)}
								</li>
							))}
						</ul>
					</div>
				)}
				{details.passengers && details.passengers.length > 0 && (
					<div>
						<h2 className="font-semibold text-gray-900 mb-2">Passengers</h2>
						<ul className="space-y-1 text-sm">
							{details.passengers.map((pax, i) => (
								<li key={i} className="space-y-0.5">
									<div>
										{pax.title} {pax.firstName} {pax.lastName}
										{pax.paxType != null && pax.paxType !== "" && (
											<span className="text-gray-500"> ({pax.paxType})</span>
										)}
									</div>
									{(pax.pnr != null && pax.pnr !== "") || (pax.ticketNumber != null && pax.ticketNumber !== "") ? (
										<div className="text-gray-600 text-xs pl-0">
											{pax.pnr != null && pax.pnr !== "" && <span>PNR: {pax.pnr}</span>}
											{pax.pnr && pax.ticketNumber != null && pax.ticketNumber !== "" && " · "}
											{pax.ticketNumber != null && pax.ticketNumber !== "" && (
												<span>Ticket: {pax.ticketNumber}</span>
											)}
										</div>
									) : null}
								</li>
							))}
						</ul>
					</div>
				)}
				{details.fare &&
					(details.fare.amount != null ||
						details.fare.baseFare != null ||
						details.fare.taxAndFees != null ||
						details.fare.currency) && (
					<div className="text-sm space-y-1">
						<h2 className="font-semibold text-gray-900 mb-1">Fare</h2>
						{details.fare.baseFare != null && (
							<div className="flex justify-between gap-4 text-gray-600">
								<span>Base fare</span>
								<span>
									{details.fare.currency ?? ""} {details.fare.baseFare.toLocaleString()}
								</span>
							</div>
						)}
						{details.fare.taxAndFees != null && (
							<div className="flex justify-between gap-4 text-gray-600">
								<span>Taxes &amp; fees</span>
								<span>
									{details.fare.currency ?? ""} {details.fare.taxAndFees.toLocaleString()}
								</span>
							</div>
						)}
						<div className="flex justify-between gap-4 font-medium pt-1 border-t border-gray-100">
							<span>Total</span>
							<span>
								{details.fare.currency ?? ""}{" "}
								{details.fare.amount != null
									? details.fare.amount.toLocaleString()
									: details.fare.baseFare != null || details.fare.taxAndFees != null
										? (
												(details.fare.baseFare ?? 0) + (details.fare.taxAndFees ?? 0)
											).toLocaleString()
										: "—"}
							</span>
						</div>
					</div>
				)}
				{details.statusMap != null && Object.keys(details.statusMap).length > 0 && (
					<div className="text-sm">
						<h2 className="font-semibold text-gray-900 mb-1">Traveller / sector status</h2>
						<ul className="space-y-1 text-gray-600">
							{Object.entries(details.statusMap).map(([k, v]) => (
								<li key={k}>
									<span className="font-mono text-xs">{k}</span>: {v}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
			<div className="mt-6 flex gap-4">
				<Link href="/travel-portal/my-trips" className="text-blue-600 hover:underline">
					My trips
				</Link>
				<Link href="/travel-portal" className="text-blue-600 hover:underline">
					Back to Dharmlok Travels
				</Link>
			</div>
		</div>
	);
}
