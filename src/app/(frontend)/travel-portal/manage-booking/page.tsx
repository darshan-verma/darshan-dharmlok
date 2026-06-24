"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, AlertCircle, Calendar, Plane } from "lucide-react";
import { toast } from "@/lib/toast";

/** One Item from Reschedule Avail (FlightDetails + Fares) */
type RescheduleAvailItem = {
	FlightDetails: Array<{
		FlightID: string;
		FlightNumber: string;
		Origin: string;
		Destination: string;
		DepartureDateTime: string;
		ArrivalDateTime: string;
	}>;
	Fares: Array<{
		Currency: string;
		Faredescription?: Array<{ BaseAmount?: string; GrossAmount?: string }>;
		FlightId?: string;
	}>;
};

interface RescheduleAvailResult {
	trackId: string | null;
	itineraryFlightList: Array<{ Items: RescheduleAvailItem[] }> | null;
	status?: { Error?: string; ResultCode?: string; SequenceID?: string };
}

/** Selected option for confirm: FlightDetails + BaseAmount, GrossAmount */
interface RescheduleSelectedOption {
	flightDetails: Array<{
		FlightID: string;
		FlightNumber: string;
		Origin: string;
		Destination: string;
		DepartureDateTime: string;
		ArrivalDateTime: string;
	}>;
	baseAmount: string;
	grossAmount: string;
}

interface RescheduleSuccessResult {
	newAirIqPNR?: string;
	message?: string;
	AirIqPNR?: string;
	error?: string;
}

interface CancellationResult {
	cancelStatus?: string;
	remarks?: string;
	penalityAmount?: string;
	totalBookingAmount?: string;
	status?: {
		ResultCode?: string;
		Error?: string;
		SequenceID?: string;
	};
	error?: string;
	resultCode?: string;
	sequenceID?: string;
}

/** TBO cancel API normalized response for display (mirrors AIRiQ pattern). */
interface TboCancelResult {
	responseStatus?: number;
	remarks?: string;
	refundAmount?: number;
	cancellationCharge?: number;
	refundedAmount?: number;
	currency?: string;
	traceId?: string;
	changeRequestId?: number;
	ticketCRInfo?: Array<{ Remarks?: string; RefundedAmount?: number; CancellationCharge?: number }>;
	error?: string;
}

export default function ManageBookingPage() {
	const searchParams = useSearchParams();
	const initialPnr = searchParams.get("pnr") || "";

	const [airIqPNR, setAirIqPNR] = useState(initialPnr);
	const [remarks, setRemarks] = useState("");
	const [loadingPenalty, setLoadingPenalty] = useState(false);
	const [loadingCancel, setLoadingCancel] = useState(false);
	const [result, setResult] = useState<CancellationResult | null>(null);

	// Reschedule flow
	const [rescheduleDeparture, setRescheduleDeparture] = useState("");
	const [rescheduleArrival, setRescheduleArrival] = useState("");
	const [rescheduleFlightDate, setRescheduleFlightDate] = useState("");
	const [rescheduleTripType, setRescheduleTripType] = useState("O");
	const [loadingRescheduleAvail, setLoadingRescheduleAvail] = useState(false);
	const [loadingRescheduleConfirm, setLoadingRescheduleConfirm] = useState(false);
	const [rescheduleAvailResult, setRescheduleAvailResult] =
		useState<RescheduleAvailResult | null>(null);
	const [rescheduleSelectedOption, setRescheduleSelectedOption] =
		useState<RescheduleSelectedOption | null>(null);
	const [rescheduleContactNo, setRescheduleContactNo] = useState("");
	const [rescheduleSuccessResult, setRescheduleSuccessResult] =
		useState<RescheduleSuccessResult | null>(null);

	// Hold Cancel flow (Section 16)
	const [airlinePNR, setAirlinePNR] = useState("");
	const [loadingHoldCancel, setLoadingHoldCancel] = useState(false);
	const [holdCancelResult, setHoldCancelResult] =
		useState<CancellationResult | null>(null);

	// Provider selector: AIRiQ vs TBO
	const [provider, setProvider] = useState<"AIRiQ" | "TBO">("AIRiQ");

	// TBO cancel flow (mirror AIRiQ)
	const [tboBookingId, setTboBookingId] = useState("");
	const [tboSource, setTboSource] = useState("");
	const [tboRemarks, setTboRemarks] = useState("");
	const [loadingTboCharges, setLoadingTboCharges] = useState(false);
	const [loadingTboCancel, setLoadingTboCancel] = useState(false);
	const [loadingTboRelease, setLoadingTboRelease] = useState(false);
	const [tboResult, setTboResult] = useState<TboCancelResult | null>(null);

	const defaultEndUserIp = "192.168.1.1";

	useEffect(() => {
		if (initialPnr) {
			setAirIqPNR(initialPnr);
		}
	}, [initialPnr]);

	const handleRequest = async (flag: "PENALTY" | "CANCEL") => {
		const trimmedPNR = airIqPNR.trim();
		if (!trimmedPNR) {
			toast.error("Please enter your booking PNR.");
			return;
		}

		if (flag === "CANCEL") {
			const confirmed = window.confirm(
				"This will attempt to cancel your booking. Do you want to continue?"
			);
			if (!confirmed) return;
		}

		if (flag === "PENALTY") {
			setLoadingPenalty(true);
		} else {
			setLoadingCancel(true);
		}
		setResult(null);
		try {
			const response = await fetch("/api/travel/airiq/cancel", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					flag,
					airIqPNR: trimmedPNR,
					remarks: remarks.trim() || undefined,
				}),
			});

			const data: CancellationResult = await response.json();

			if (!response.ok) {
				const message =
					data.error ||
					data.status?.Error ||
					"Request failed. Please contact customer care.";
				toast.error(message);
				setResult(data);
				return;
			}

			setResult(data);

			const cancelStatus = (data.cancelStatus || "").toUpperCase();
			if (cancelStatus === "SUCCESS") {
				toast.success(
					data.remarks || "Request completed successfully."
				);
			} else if (cancelStatus === "PENDING") {
				toast.info(
					data.remarks ||
						"Your request is pending. Please check again later or contact customer care."
				);
			} else {
				toast.info(
					data.remarks ||
						data.status?.Error ||
						"Request processed. Please review the details below."
				);
			}
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to process the request. Please try again.";
			console.error("ManageBooking cancellation error:", err);
			toast.error(message);
		} finally {
			if (flag === "PENALTY") {
				setLoadingPenalty(false);
			} else {
				setLoadingCancel(false);
			}
		}
	};

	const handleHoldCancel = async () => {
		const trimmedAirIq = airIqPNR.trim();
		const trimmedAirline = airlinePNR.trim();
		if (!trimmedAirIq) {
			toast.error("Please enter your booking PNR.");
			return;
		}
		if (!trimmedAirline) {
			toast.error("Please enter your Airline PNR.");
			return;
		}
		const confirmed = window.confirm(
			"This will cancel the held PNR. Do you want to continue?"
		);
		if (!confirmed) return;

		setLoadingHoldCancel(true);
		setHoldCancelResult(null);
		try {
			const response = await fetch("/api/travel/airiq/hold-cancel", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					airIqPNR: trimmedAirIq,
					airlinePNR: trimmedAirline,
				}),
			});
			const data: CancellationResult = await response.json();

			if (!response.ok) {
				const message =
					data.error ||
					data.status?.Error ||
					"Request failed. Please contact customer care.";
				toast.error(message);
				setHoldCancelResult(data);
				return;
			}

			setHoldCancelResult(data);
			const cancelStatus = (data.cancelStatus || "").toUpperCase();
			if (cancelStatus === "SUCCESS") {
				toast.success(
					data.remarks || "Hold cancelled successfully."
				);
			} else if (cancelStatus === "PENDING") {
				toast.info(
					data.remarks ||
						"Unable to cancel the requested PNR. Kindly contact customer care."
				);
			} else {
				toast.info(
					data.remarks ||
						data.status?.Error ||
						"Request processed. Please review the details below."
				);
			}
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Unable to process the request. Please try again.";
			console.error("ManageBooking hold cancel error:", err);
			toast.error(message);
		} finally {
			setLoadingHoldCancel(false);
		}
	};

	const handleRescheduleAvail = async () => {
		const trimmedPNR = airIqPNR.trim();
		if (!trimmedPNR) {
			toast.error("Please enter your booking PNR.");
			return;
		}
		if (!rescheduleDeparture.trim() || !rescheduleArrival.trim()) {
			toast.error("Please enter departure and arrival station codes (e.g. BOM, DEL).");
			return;
		}
		if (!rescheduleFlightDate.trim()) {
			toast.error("Please enter the new flight date.");
			return;
		}
		// Normalise date to YYYYMMDD
		let flightDateStr = rescheduleFlightDate.trim().replace(/-/g, "");
		if (flightDateStr.length === 8 && /^\d{8}$/.test(flightDateStr)) {
			// already YYYYMMDD
		} else if (/^\d{4}-\d{2}-\d{2}$/.test(rescheduleFlightDate.trim())) {
			flightDateStr = rescheduleFlightDate.trim().replace(/-/g, "");
		} else {
			toast.error("Flight date must be YYYYMMDD or YYYY-MM-DD.");
			return;
		}

		setLoadingRescheduleAvail(true);
		setRescheduleAvailResult(null);
		setRescheduleSelectedOption(null);
		setRescheduleSuccessResult(null);
		try {
			const response = await fetch("/api/travel/airiq/reschedule-avail", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					tripType: rescheduleTripType,
					availInfo: [
						{
							departureStation: rescheduleDeparture.trim(),
							arrivalStation: rescheduleArrival.trim(),
							flightDate: flightDateStr,
						},
					],
					airIqPNR: trimmedPNR,
					remarks: remarks.trim() || undefined,
				}),
			});
			const data = await response.json();

			if (!response.ok) {
				toast.error(data.error || "Failed to fetch reschedule availability.");
				return;
			}

			if (data.trackId && data.itineraryFlightList?.length > 0) {
				setRescheduleAvailResult({
					trackId: data.trackId,
					itineraryFlightList: data.itineraryFlightList,
					status: data.status,
				});
				toast.success("Available flights loaded. Select one to confirm reschedule.");
			} else if (response.status === 202) {
				toast.info(data.message || "Reschedule availability is pending. Try again later.");
			} else {
				toast.info(data.error || data.message || "No availability found.");
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Reschedule availability request failed.";
			toast.error(msg);
		} finally {
			setLoadingRescheduleAvail(false);
		}
	};

	const handleRescheduleConfirm = async () => {
		const trimmedPNR = airIqPNR.trim();
		if (!trimmedPNR) {
			toast.error("Please enter your booking PNR.");
			return;
		}
		if (!rescheduleAvailResult?.trackId) {
			toast.error("Missing track ID. Please check availability first.");
			return;
		}
		if (!rescheduleSelectedOption) {
			toast.error("Please select a flight option.");
			return;
		}
		if (!rescheduleContactNo.trim()) {
			toast.error("Contact number is required for reschedule.");
			return;
		}

		setLoadingRescheduleConfirm(true);
		setRescheduleSuccessResult(null);
		try {
			const response = await fetch("/api/travel/airiq/reschedule", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					segmentInfo: {
						baseOrigin: rescheduleDeparture.trim(),
						baseDestination: rescheduleArrival.trim(),
						tripType: rescheduleTripType,
					},
					trackId: rescheduleAvailResult.trackId,
					airIqPNR: trimmedPNR,
					remarks: remarks.trim() || undefined,
					flag: "CONFIRM",
					contactNo: rescheduleContactNo.trim(),
					itineraryInfo: [
						{
							flightDetails: rescheduleSelectedOption.flightDetails.map((fd) => ({
								flightID: fd.FlightID,
								flightNumber: fd.FlightNumber,
								origin: fd.Origin,
								destination: fd.Destination,
								departureDateTime: fd.DepartureDateTime,
								arrivalDateTime: fd.ArrivalDateTime,
							})),
							baseAmount: rescheduleSelectedOption.baseAmount,
							grossAmount: rescheduleSelectedOption.grossAmount,
						},
					],
				}),
			});
			const data = await response.json();

			if (!response.ok) {
				toast.error(data.error || "Reschedule request failed.");
				return;
			}

			if (response.status === 200 && (data.newAirIqPNR || data.AirIqPNR)) {
				setRescheduleSuccessResult({
					newAirIqPNR: data.newAirIqPNR ?? data.AirIqPNR,
					message: data.message,
					AirIqPNR: data.AirIqPNR ?? data.newAirIqPNR,
				});
				toast.success("Reschedule successful. Use the new PNR for all future actions.");
			} else if (response.status === 202) {
				toast.info(data.error || data.message || "Reschedule is pending. Contact customer care.");
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Reschedule confirm failed.";
			toast.error(msg);
		} finally {
			setLoadingRescheduleConfirm(false);
		}
	};

	const selectRescheduleOption = (item: RescheduleAvailItem) => {
		const firstFare = item.Fares?.[0];
		const desc = firstFare?.Faredescription?.[0];
		const base = desc?.BaseAmount ?? "0";
		const gross = desc?.GrossAmount ?? "0";
		setRescheduleSelectedOption({
			flightDetails: item.FlightDetails.map((fd) => ({
				FlightID: fd.FlightID,
				FlightNumber: fd.FlightNumber,
				Origin: fd.Origin,
				Destination: fd.Destination,
				DepartureDateTime: fd.DepartureDateTime,
				ArrivalDateTime: fd.ArrivalDateTime,
			})),
			baseAmount: base,
			grossAmount: gross,
		});
	};

	const handleTboCharges = async () => {
		const bid = tboBookingId.trim();
		if (!bid) {
			toast.error("Please enter Booking ID.");
			return;
		}
		const bookingIdNum = parseInt(bid, 10);
		if (Number.isNaN(bookingIdNum) || bookingIdNum <= 0) {
			toast.error("Please enter a valid Booking ID.");
			return;
		}
		setLoadingTboCharges(true);
		setTboResult(null);
		try {
			const response = await fetch("/api/travel/tbo/cancel/cancellation-charges", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					EndUserIp: defaultEndUserIp,
					BookingId: bookingIdNum,
					BookingMode: 5,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				toast.error(data.error || "Failed to get cancellation charges.");
				setTboResult({ ...data, error: data.error });
				return;
			}
			setTboResult({
				responseStatus: data.responseStatus,
				refundAmount: data.refundAmount,
				cancellationCharge: data.cancellationCharge,
				remarks: data.remarks,
				currency: data.currency,
				traceId: data.traceId,
			});
			toast.success("Cancellation charges loaded.");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Request failed.";
			toast.error(msg);
		} finally {
			setLoadingTboCharges(false);
		}
	};

	const handleTboCancel = async () => {
		const bid = tboBookingId.trim();
		if (!bid) {
			toast.error("Please enter Booking ID.");
			return;
		}
		const bookingIdNum = parseInt(bid, 10);
		if (Number.isNaN(bookingIdNum) || bookingIdNum <= 0) {
			toast.error("Please enter a valid Booking ID.");
			return;
		}
		const confirmed = window.confirm(
			"This will attempt to cancel your ticketed booking. Do you want to continue?"
		);
		if (!confirmed) return;
		setLoadingTboCancel(true);
		setTboResult(null);
		try {
			const response = await fetch("/api/travel/tbo/cancel/send-change", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					EndUserIp: defaultEndUserIp,
					BookingId: bookingIdNum,
					RequestType: 1,
					CancellationType: 3,
					Remarks: tboRemarks.trim() || "Customer requested cancellation",
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				toast.error(data.error || "Cancel request failed.");
				setTboResult({ ...data, error: data.error });
				return;
			}
			setTboResult({
				responseStatus: data.responseStatus,
				remarks: data.remarks ?? data.ticketCRInfo?.[0]?.Remarks,
				refundedAmount: data.refundedAmount ?? data.ticketCRInfo?.[0]?.RefundedAmount,
				cancellationCharge: data.cancellationCharge ?? data.ticketCRInfo?.[0]?.CancellationCharge,
				traceId: data.traceId,
				ticketCRInfo: data.ticketCRInfo,
			});
			toast.success(data.remarks || "Cancellation request submitted successfully.");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Request failed.";
			toast.error(msg);
		} finally {
			setLoadingTboCancel(false);
		}
	};

	const handleTboRelease = async () => {
		const bid = tboBookingId.trim();
		const src = tboSource.trim();
		if (!bid) {
			toast.error("Please enter Booking ID.");
			return;
		}
		if (!src) {
			toast.error("Please enter Source (e.g. 4).");
			return;
		}
		const bookingIdNum = parseInt(bid, 10);
		if (Number.isNaN(bookingIdNum) || bookingIdNum <= 0) {
			toast.error("Please enter a valid Booking ID.");
			return;
		}
		const confirmed = window.confirm(
			"This will release the held PNR. Do you want to continue?"
		);
		if (!confirmed) return;
		setLoadingTboRelease(true);
		setTboResult(null);
		try {
			const response = await fetch("/api/travel/tbo/cancel/release-pnr", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					EndUserIp: defaultEndUserIp,
					BookingId: bookingIdNum,
					Source: src,
				}),
			});
			const data = await response.json();
			if (!response.ok) {
				toast.error(data.error || "Release PNR failed.");
				setTboResult({ ...data, error: data.error });
				return;
			}
			setTboResult({
				responseStatus: data.responseStatus,
				traceId: data.traceId,
				remarks: "Hold released successfully.",
			});
			toast.success("Hold released successfully.");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Request failed.";
			toast.error(msg);
		} finally {
			setLoadingTboRelease(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">Manage Booking</h1>
					<p className="text-muted-foreground">
						Check cancellation charges or cancel your flight booking.
					</p>
					<div className="flex gap-2 mt-4">
						<Button
							variant={provider === "AIRiQ" ? "default" : "outline"}
							size="sm"
							onClick={() => setProvider("AIRiQ")}
						>
							By PNR
						</Button>
						<Button
							variant={provider === "TBO" ? "default" : "outline"}
							size="sm"
							onClick={() => setProvider("TBO")}
						>
							By booking ID
						</Button>
					</div>
				</div>

				{provider === "AIRiQ" && (
				<>
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Booking Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="airiq-pnr">Booking PNR</Label>
							<Input
								id="airiq-pnr"
								placeholder="Enter your booking PNR"
								value={airIqPNR}
								onChange={(e) => setAirIqPNR(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="remarks">Remarks (optional)</Label>
							<Textarea
								id="remarks"
								placeholder="Add any remarks for your request"
								value={remarks}
								onChange={(e) => setRemarks(e.target.value)}
								rows={3}
							/>
						</div>
						<div className="flex flex-col sm:flex-row gap-3 pt-2">
							<Button
								variant="outline"
								className="w-full sm:w-auto"
								onClick={() => handleRequest("PENALTY")}
								disabled={loadingPenalty || loadingCancel}
							>
								{loadingPenalty && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Check cancellation penalty
							</Button>
							<Button
								variant="destructive"
								className="w-full sm:w-auto"
								onClick={() => handleRequest("CANCEL")}
								disabled={loadingPenalty || loadingCancel}
							>
								{loadingCancel && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Cancel booking
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Cancel hold (Hold Cancel)</CardTitle>
						<p className="text-sm text-muted-foreground">
							Cancel a held PNR using your booking PNR and airline PNR (from your booking confirmation).
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="hold-cancel-airline-pnr">Airline PNR</Label>
							<Input
								id="hold-cancel-airline-pnr"
								placeholder="Enter your Airline PNR"
								value={airlinePNR}
								onChange={(e) => setAirlinePNR(e.target.value)}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							Uses the booking PNR from the Booking Details section above.
						</p>
						<Button
							variant="outline"
							onClick={handleHoldCancel}
							disabled={loadingHoldCancel || !airIqPNR.trim() || !airlinePNR.trim()}
						>
							{loadingHoldCancel && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Cancel hold
						</Button>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Calendar className="h-5 w-5" />
							Reschedule Flight
						</CardTitle>
						<p className="text-sm text-muted-foreground">
							Check availability for a new date and confirm reschedule. Use the same PNR above.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						{!rescheduleSuccessResult ? (
							<>
								{!rescheduleAvailResult ? (
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="reschedule-dep">Departure (e.g. BOM)</Label>
											<Input
												id="reschedule-dep"
												placeholder="BOM"
												value={rescheduleDeparture}
												onChange={(e) => setRescheduleDeparture(e.target.value.toUpperCase())}
												maxLength={3}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="reschedule-arr">Arrival (e.g. DEL)</Label>
											<Input
												id="reschedule-arr"
												placeholder="DEL"
												value={rescheduleArrival}
												onChange={(e) => setRescheduleArrival(e.target.value.toUpperCase())}
												maxLength={3}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="reschedule-date">New flight date</Label>
											<Input
												id="reschedule-date"
												type="date"
												value={rescheduleFlightDate}
												onChange={(e) => setRescheduleFlightDate(e.target.value)}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="reschedule-trip">Trip type</Label>
											<select
												id="reschedule-trip"
												className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
												value={rescheduleTripType}
												onChange={(e) => setRescheduleTripType(e.target.value)}
											>
												<option value="O">One-way</option>
												<option value="R">Round-trip</option>
												<option value="Y">Round-trip Special</option>
											</select>
										</div>
									</div>
								) : (
									<div className="space-y-4">
										<p className="text-sm font-medium">Select a flight to reschedule to:</p>
										<div className="space-y-3">
											{rescheduleAvailResult.itineraryFlightList?.map((itin, itinIdx) =>
												itin.Items.map((item, itemIdx) => {
													const firstSeg = item.FlightDetails?.[0];
													const firstFare = item.Fares?.[0];
													const desc = firstFare?.Faredescription?.[0];
													const gross = desc?.GrossAmount ?? "0";
													const isSelected =
														rescheduleSelectedOption &&
														rescheduleSelectedOption.flightDetails[0]?.FlightID === firstSeg?.FlightID;
													return (
														<div
															key={`${itinIdx}-${itemIdx}`}
															className={`rounded-lg border p-4 ${
																isSelected ? "border-primary bg-primary/5" : "border-border"
															}`}
														>
															<div className="flex flex-wrap items-center justify-between gap-2">
																<div className="flex items-center gap-2 text-sm">
																	<Plane className="h-4 w-4 text-muted-foreground" />
																	<span className="font-medium">
																		{firstSeg?.FlightNumber} {firstSeg?.Origin} → {firstSeg?.Destination}
																	</span>
																	<span className="text-muted-foreground">
																		{firstSeg?.DepartureDateTime} – {firstSeg?.ArrivalDateTime}
																	</span>
																</div>
																<div className="flex items-center gap-2">
																	<span className="font-semibold">₹ {gross}</span>
																	<Button
																		size="sm"
																		variant={isSelected ? "default" : "outline"}
																		onClick={() => selectRescheduleOption(item)}
																	>
																		{isSelected ? "Selected" : "Select"}
																	</Button>
																</div>
															</div>
														</div>
													);
												})
											)}
										</div>
										<Button
											variant="outline"
											onClick={() => {
												setRescheduleAvailResult(null);
												setRescheduleSelectedOption(null);
											}}
										>
											Change date / route
										</Button>
									</div>
								)}

								{rescheduleAvailResult && rescheduleSelectedOption && (
									<div className="space-y-2 border-t pt-4">
										<Label htmlFor="reschedule-contact">Contact number (required)</Label>
										<Input
											id="reschedule-contact"
											placeholder="10-digit mobile number"
											value={rescheduleContactNo}
											onChange={(e) => setRescheduleContactNo(e.target.value)}
											maxLength={15}
										/>
										<Button
											className="w-full sm:w-auto"
											onClick={handleRescheduleConfirm}
											disabled={loadingRescheduleConfirm}
										>
											{loadingRescheduleConfirm && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Confirm reschedule
										</Button>
									</div>
								)}

								{!rescheduleAvailResult && (
									<Button
										onClick={handleRescheduleAvail}
										disabled={loadingRescheduleAvail}
									>
										{loadingRescheduleAvail && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Check availability
									</Button>
								)}
							</>
						) : (
							<div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4 space-y-2">
								<div className="flex items-center gap-2 text-green-700 dark:text-green-400">
									<ShieldCheck className="h-5 w-5" />
									<span className="font-semibold">Reschedule successful</span>
								</div>
								<p className="text-sm text-muted-foreground">
									{rescheduleSuccessResult.message ??
										"Use the new PNR below for all future actions and retrieve your updated booking with it."}
								</p>
								<div className="rounded-md bg-background px-3 py-2 font-mono font-semibold">
									New PNR: {rescheduleSuccessResult.newAirIqPNR ?? rescheduleSuccessResult.AirIqPNR ?? "—"}
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setRescheduleSuccessResult(null);
										setRescheduleAvailResult(null);
										setRescheduleSelectedOption(null);
										setRescheduleContactNo("");
									}}
								>
									Reschedule another booking
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Cancellation Status</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{!result && !holdCancelResult && (
							<p className="text-sm text-muted-foreground">
								Results will appear here after you check penalty, cancel the booking, or cancel a hold.
							</p>
						)}

						{result && (
							<div className="space-y-4">
								{result.cancelStatus && (
									<div className="flex items-center gap-2">
										<Badge
											variant={
												result.cancelStatus.toUpperCase() === "SUCCESS"
													? "default"
													: result.cancelStatus.toUpperCase() === "PENDING"
													? "secondary"
													: "destructive"
											}
										>
											{result.cancelStatus}
										</Badge>
										<span className="text-sm text-muted-foreground">
											Current cancellation status
										</span>
									</div>
								)}

								{(result.remarks || result.error || result.status?.Error) && (
									<div className="flex items-start gap-2 text-sm">
										{result.cancelStatus &&
										result.cancelStatus.toUpperCase() === "SUCCESS" ? (
											<ShieldCheck className="h-4 w-4 text-green-500 mt-0.5" />
										) : (
											<AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
										)}
										<p className="text-muted-foreground">
											{result.remarks || result.error || result.status?.Error}
										</p>
									</div>
								)}

								{(result.penalityAmount || result.totalBookingAmount) && (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
										{result.penalityAmount && (
											<div className="rounded-md border px-3 py-2 bg-muted/40">
												<div className="text-xs text-muted-foreground">
													Cancellation Penalty
												</div>
												<div className="font-semibold">
													₹ {result.penalityAmount}
												</div>
											</div>
										)}
										{result.totalBookingAmount && (
											<div className="rounded-md border px-3 py-2 bg-muted/40">
												<div className="text-xs text-muted-foreground">
													Total Booking Amount
												</div>
												<div className="font-semibold">
													₹ {result.totalBookingAmount}
												</div>
											</div>
										)}
									</div>
								)}

								{(result.status?.ResultCode ||
									result.status?.SequenceID) && (
									<div className="rounded-md border px-3 py-2 bg-muted/30 text-xs text-muted-foreground space-y-1">
										<div>
											<span className="font-medium">Result Code: </span>
											<span>
												{result.status?.ResultCode ??
													result.resultCode ??
													"-"}
											</span>
										</div>
										<div>
											<span className="font-medium">Sequence ID: </span>
											<span>
												{result.status?.SequenceID ??
													result.sequenceID ??
													"-"}
											</span>
										</div>
									</div>
								)}
							</div>
						)}

						{holdCancelResult && (
							<div className="space-y-4 border-t pt-4">
								<p className="text-xs font-medium text-muted-foreground">Hold Cancel result</p>
								{holdCancelResult.cancelStatus && (
									<div className="flex items-center gap-2">
										<Badge
											variant={
												holdCancelResult.cancelStatus.toUpperCase() === "SUCCESS"
													? "default"
													: holdCancelResult.cancelStatus.toUpperCase() === "PENDING"
													? "secondary"
													: "destructive"
											}
										>
											{holdCancelResult.cancelStatus}
										</Badge>
									</div>
								)}
								{(holdCancelResult.remarks || holdCancelResult.error || holdCancelResult.status?.Error) && (
									<div className="flex items-start gap-2 text-sm">
										{holdCancelResult.cancelStatus?.toUpperCase() === "SUCCESS" ? (
											<ShieldCheck className="h-4 w-4 text-green-500 mt-0.5" />
										) : (
											<AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
										)}
										<p className="text-muted-foreground">
											{holdCancelResult.remarks || holdCancelResult.error || holdCancelResult.status?.Error}
										</p>
									</div>
								)}
								{(holdCancelResult.status?.ResultCode || holdCancelResult.status?.SequenceID) && (
									<div className="rounded-md border px-3 py-2 bg-muted/30 text-xs text-muted-foreground space-y-1">
										<div>
											<span className="font-medium">Result Code: </span>
											<span>{holdCancelResult.status?.ResultCode ?? holdCancelResult.resultCode ?? "-"}</span>
										</div>
										<div>
											<span className="font-medium">Sequence ID: </span>
											<span>{holdCancelResult.status?.SequenceID ?? holdCancelResult.sequenceID ?? "-"}</span>
										</div>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
				</>
				)}

				{provider === "TBO" && (
				<>
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Booking details</CardTitle>
						<p className="text-sm text-muted-foreground">
							Check cancellation charges or cancel a ticketed booking. For hold-only (no ticket), use Release hold below.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="tbo-booking-id">Booking ID</Label>
							<Input
								id="tbo-booking-id"
								placeholder="Enter booking ID"
								value={tboBookingId}
								onChange={(e) => setTboBookingId(e.target.value)}
								type="number"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="tbo-source">Source (e.g. 4)</Label>
							<Input
								id="tbo-source"
								placeholder="4"
								value={tboSource}
								onChange={(e) => setTboSource(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="tbo-remarks">Remarks (optional)</Label>
							<Textarea
								id="tbo-remarks"
								placeholder="Add any remarks for your request"
								value={tboRemarks}
								onChange={(e) => setTboRemarks(e.target.value)}
								rows={2}
							/>
						</div>
						<div className="flex flex-col sm:flex-row gap-3 pt-2">
							<Button
								variant="outline"
								className="w-full sm:w-auto"
								onClick={handleTboCharges}
								disabled={loadingTboCharges || loadingTboCancel || loadingTboRelease}
							>
								{loadingTboCharges && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Check cancellation charges
							</Button>
							<Button
								variant="destructive"
								className="w-full sm:w-auto"
								onClick={handleTboCancel}
								disabled={loadingTboCharges || loadingTboCancel || loadingTboRelease}
							>
								{loadingTboCancel && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Cancel booking
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Release hold</CardTitle>
						<p className="text-sm text-muted-foreground">
							Release a held PNR (no ticket issued). Uses Booking ID and Source from above.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button
							variant="outline"
							onClick={handleTboRelease}
							disabled={loadingTboRelease || loadingTboCharges || loadingTboCancel || !tboBookingId.trim() || !tboSource.trim()}
						>
							{loadingTboRelease && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Release hold
						</Button>
					</CardContent>
				</Card>

				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Cancellation status</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{!tboResult && (
							<p className="text-sm text-muted-foreground">
								Results will appear here after you check charges, cancel the booking, or release a hold.
							</p>
						)}
						{tboResult && (
							<div className="space-y-4">
								{tboResult.responseStatus !== undefined && (
									<div className="flex items-center gap-2">
										<Badge
											variant={
												tboResult.responseStatus === 1
													? "default"
													: tboResult.error
														? "destructive"
														: "secondary"
											}
										>
											{tboResult.responseStatus === 1 ? "Success" : tboResult.error ? "Failed" : "Status " + tboResult.responseStatus}
										</Badge>
									</div>
								)}
								{(tboResult.remarks || tboResult.error) && (
									<div className="flex items-start gap-2 text-sm">
										{tboResult.responseStatus === 1 ? (
											<ShieldCheck className="h-4 w-4 text-green-500 mt-0.5" />
										) : (
											<AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
										)}
										<p className="text-muted-foreground">
											{tboResult.remarks || tboResult.error}
										</p>
									</div>
								)}
								{(tboResult.refundAmount != null || tboResult.cancellationCharge != null || tboResult.refundedAmount != null) && (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
										{tboResult.refundAmount != null && (
											<div className="rounded-md border px-3 py-2 bg-muted/40">
												<div className="text-xs text-muted-foreground">Refund Amount</div>
												<div className="font-semibold">
													{tboResult.currency || "INR"} {tboResult.refundAmount}
												</div>
											</div>
										)}
										{tboResult.refundedAmount != null && (
											<div className="rounded-md border px-3 py-2 bg-muted/40">
												<div className="text-xs text-muted-foreground">Refunded Amount</div>
												<div className="font-semibold">
													{tboResult.currency || "INR"} {tboResult.refundedAmount}
												</div>
											</div>
										)}
										{tboResult.cancellationCharge != null && (
											<div className="rounded-md border px-3 py-2 bg-muted/40">
												<div className="text-xs text-muted-foreground">Cancellation Charge</div>
												<div className="font-semibold">
													{tboResult.currency || "INR"} {tboResult.cancellationCharge}
												</div>
											</div>
										)}
									</div>
								)}
								{tboResult.traceId && (
									<div className="rounded-md border px-3 py-2 bg-muted/30 text-xs text-muted-foreground">
										<span className="font-medium">Trace ID: </span>
										<span>{tboResult.traceId}</span>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
				</>
				)}
			</div>
		</div>
	);
}

