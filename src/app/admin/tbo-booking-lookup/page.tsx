"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import type { TboGetBookingDetailsFlightItinerary } from "@/types/tbo";

export default function TboBookingLookupPage() {
	const [bookingId, setBookingId] = useState("");
	const [pnr, setPnr] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [traceId, setTraceId] = useState("");
	const [itinerary, setItinerary] = useState<TboGetBookingDetailsFlightItinerary | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setItinerary(null);
		const EndUserIp = "192.168.1.1";
		const body: Record<string, unknown> = { EndUserIp };
		const bid = bookingId.trim();
		const p = pnr.trim();
		const fn = firstName.trim();
		const ln = lastName.trim();
		const tid = traceId.trim();

		if (bid && !p && !fn && !ln && !tid) {
			body.BookingId = parseInt(bid, 10);
			if (Number.isNaN(body.BookingId)) {
				setError("Booking ID must be a number");
				return;
			}
		} else if (bid && p && !fn && !ln && !tid) {
			body.BookingId = parseInt(bid, 10);
			body.PNR = p;
			if (Number.isNaN(body.BookingId)) {
				setError("Booking ID must be a number");
				return;
			}
		} else if (!bid && p && fn && !ln && !tid) {
			body.PNR = p;
			body.FirstName = fn;
		} else if (!bid && p && !fn && ln && !tid) {
			body.PNR = p;
			body.LastName = ln;
		} else if (!bid && p && fn && ln && !tid) {
			body.PNR = p;
			body.FirstName = fn;
			body.LastName = ln;
		} else if (!bid && !p && !fn && !ln && tid) {
			body.TraceId = tid;
		} else {
			setError("Use exactly one: BookingId, (BookingId+PNR), (PNR+FirstName), (PNR+LastName), (PNR+FirstName+LastName), or TraceId");
			return;
		}

		setLoading(true);
		fetch("/api/travel/tbo/booking-details", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data?.error) {
					setError(data.error);
					setItinerary(null);
					return;
				}
				setItinerary(data?.Response?.FlightItinerary ?? null);
				if (!data?.Response?.FlightItinerary) setError("No itinerary in response");
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : "Request failed");
				setItinerary(null);
			})
			.finally(() => setLoading(false));
	};

	return (
		<div className="container mx-auto py-8 px-4 max-w-4xl">
			<div className="mb-6 flex items-center gap-4">
				<Link href="/admin" className="text-muted-foreground hover:text-foreground text-sm">
					← Admin
				</Link>
				<h1 className="text-2xl font-bold">TBO Flight Booking Lookup</h1>
			</div>
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Lookup by BookingId, PNR, or TraceId</CardTitle>
					<p className="text-sm text-muted-foreground">
						Fill exactly one row: BookingId only, BookingId+PNR, PNR+FirstName, PNR+LastName, PNR+FirstName+LastName, or TraceId only.
					</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="bookingId">Booking ID</Label>
								<Input
									id="bookingId"
									type="text"
									placeholder="e.g. 1288956"
									value={bookingId}
									onChange={(e) => setBookingId(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="pnr">PNR</Label>
								<Input
									id="pnr"
									type="text"
									placeholder="e.g. BBM64K"
									value={pnr}
									onChange={(e) => setPnr(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name (lead)</Label>
								<Input
									id="firstName"
									type="text"
									placeholder="Lead passenger"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name (lead)</Label>
								<Input
									id="lastName"
									type="text"
									placeholder="Lead passenger"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="traceId">TraceId</Label>
								<Input
									id="traceId"
									type="text"
									placeholder="e.g. caef5986-98cf-4f4c-8bc2-c80caa023b00"
									value={traceId}
									onChange={(e) => setTraceId(e.target.value)}
								/>
							</div>
						</div>
						{error && (
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
								{error}
							</div>
						)}
						<Button type="submit" disabled={loading}>
							{loading ? "Looking up…" : "Look up booking"}
						</Button>
					</form>
				</CardContent>
			</Card>

			{itinerary && (
				<Card>
					<CardHeader>
						<CardTitle>Booking details</CardTitle>
						<p className="text-sm text-muted-foreground">
							PNR: {itinerary.PNR ?? "—"} · Booking ID: {itinerary.BookingId ?? "—"}
						</p>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-2 gap-3 text-sm">
							{itinerary.InvoiceNo != null && (
								<><span className="text-muted-foreground">Invoice</span><span>{itinerary.InvoiceNo}</span></>
							)}
							{itinerary.InvoiceCreatedOn != null && (
								<><span className="text-muted-foreground">Invoice date</span><span>{itinerary.InvoiceCreatedOn}</span></>
							)}
							{(itinerary.Status != null || itinerary.TicketStatus != null) && (
								<><span className="text-muted-foreground">Status</span><span>{(itinerary.TicketStatus ?? itinerary.Status) ?? "—"}</span></>
							)}
						</div>
						{itinerary.Segments && itinerary.Segments.length > 0 && (
							<div>
								<h3 className="font-semibold mb-2">Segments</h3>
								<ul className="space-y-2 text-sm">
									{itinerary.Segments.map((seg, i) => {
										const origin = seg.Origin && typeof seg.Origin === "object" && "Airport" in seg.Origin
											? (seg.Origin as { Airport?: { AirportCode?: string } }).Airport?.AirportCode
											: "—";
										const dest = seg.Destination && typeof seg.Destination === "object" && "Airport" in seg.Destination
											? (seg.Destination as { Airport?: { AirportCode?: string } }).Airport?.AirportCode
											: "—";
										const depTime = seg.Origin && typeof seg.Origin === "object" && "DepTime" in seg.Origin
											? (seg.Origin as { DepTime?: string }).DepTime
											: null;
										return (
											<li key={i} className="border rounded p-2">
												{origin} → {dest}
												{seg.Airline && (
													<span className="text-muted-foreground ml-2">
														{seg.Airline.AirlineName} {seg.Airline.AirlineCode} {seg.Airline.FlightNumber}
														{depTime ? ` · ${depTime}` : ""}
													</span>
												)}
											</li>
										);
									})}
								</ul>
							</div>
						)}
						{itinerary.Passenger && itinerary.Passenger.length > 0 && (
							<div>
								<h3 className="font-semibold mb-2">Passengers</h3>
								<ul className="space-y-1 text-sm">
									{itinerary.Passenger.map((pax, i) => (
										<li key={i}>{pax.Title} {pax.FirstName} {pax.LastName}</li>
									))}
								</ul>
							</div>
						)}
						{itinerary.Fare && (
							<div className="text-sm">
								<span className="text-muted-foreground">Fare </span>
								<span>{itinerary.Fare.Currency} {(itinerary.Fare.OfferedFare ?? itinerary.Fare.PublishedFare) ?? "—"}</span>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
