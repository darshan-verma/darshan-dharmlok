"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { FlightResult } from "@/types/tbo";
import type { PassengerDetail, FareRuleResponse } from "@/types/tbo";
import type {
	TripjackReviewResponse,
	TripjackReviewConditions,
	TripjackFareAlert,
	TripjackTravellerInfo,
	TripjackGstInfo,
} from "@/types/tripjackFlight";
import { extractTripjackReviewFlight, fareComponentFromReviewTotal } from "@/lib/tripjackFlightBooking";
import {
	emptyTripjackSsrPickState,
	tripjackFlatSegmentsFromReview,
	tripjackPicksToFareSsrShape,
	tripjackSsrExtraTotal,
	tripjackTravellerSsrForPax,
	tripjackPlaceholderPassengers,
	type TripjackSsrPickState,
} from "@/lib/tripjackSsr";
import TripjackSSRSelection from "../components/ssr/TripjackSSRSelection";
import { toast } from "@/lib/toast";
import PassengerDetails from "../components/PassengerDetails";
import FlightDetails from "./components/FlightDetails";
import FareRulesView from "./components/FareRulesView";
import FareBreakdown from "@/components/travel-portal/FareBreakdown";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { airportLabelFromFields } from "@/lib/reference-data-client";

/**
 * Derive UI-level flags from `conditions` returned by TripJack review.
 */
function deriveConditionFlags(cond: TripjackReviewConditions | undefined) {
	if (!cond) {
		return {
			requirePassport: false,
			requirePassportExpiry: false,
			requirePassportFull: false,
			requireDob: false,
			requireGst: false,
			gstApplicable: false,
			requireEmergencyContact: false,
			requireDocumentId: false,
			documentIdApplicable: false,
			requirePan: false,
		};
	}
	const pcsObj = typeof cond.pcs === "object" && cond.pcs !== null ? cond.pcs : null;
	// TripJack pcs flags are independent: pm = passport mandatory, pped = expiry, pid = issue date.
	const requirePassport = pcsObj?.pm === true;
	const requirePassportExpiry = pcsObj?.pped === true;
	const requirePassportFull = pcsObj?.pid === true;
	const dobObj = typeof cond.dob === "object" && cond.dob !== null ? cond.dob : null;
	const requireDob =
		cond.dob === true ||
		dobObj?.adobr === true ||
		dobObj?.cdobr === true ||
		dobObj?.idobr === true ||
		false;
	const gstObj = typeof cond.gst === "object" && cond.gst !== null ? cond.gst : null;
	// TripJack: igm = GST mandatory; gstappl = GST may be passed but not required.
	const requireGst = gstObj?.igm === true || cond.gst === true;
	const gstApplicable = gstObj?.gstappl === true;
	const requireEmergencyContact = cond.iecr === true;
	const dcObj = typeof cond.dc === "object" && cond.dc !== null ? cond.dc : null;
	const documentIdApplicable = cond.dc === true || dcObj?.idm === true;
	const requireDocumentId = documentIdApplicable || dcObj?.ida === true;
	const requirePan = cond.ipa === true;
	return {
		requirePassport,
		requirePassportExpiry,
		requirePassportFull,
		requireDob,
		requireGst,
		gstApplicable,
		requireEmergencyContact,
		requireDocumentId,
		documentIdApplicable,
		requirePan,
	};
}

function isTripjackMandatoryGstComplete(lead: PassengerDetail): boolean {
	return Boolean(
		lead.GSTNumber?.trim() &&
			lead.GSTCompanyName?.trim() &&
			lead.GSTCompanyAddress?.trim() &&
			lead.GSTCompanyContactNumber?.trim() &&
			lead.GSTCompanyEmail?.trim(),
	);
}

function buildTripjackGstInfo(lead: PassengerDetail): TripjackGstInfo | undefined {
	const gstNum = lead.GSTNumber?.trim();
	if (!gstNum) return undefined;
	return {
		gstNum,
		registeredName: lead.GSTCompanyName?.trim() || undefined,
		email: lead.GSTCompanyEmail?.trim() || undefined,
		mobile: lead.GSTCompanyContactNumber?.trim() || undefined,
		address: lead.GSTCompanyAddress?.trim() || undefined,
	};
}

function buildFareAlertMessage(alerts: TripjackFareAlert[] | undefined): string | null {
	if (!alerts?.length) return null;
	const fareAlerts = alerts.filter(
		(a) => a.type === "FARE_CHANGE" || a.oldFare != null || a.newFare != null,
	);
	if (!fareAlerts.length) return null;
	const a = fareAlerts[0];
	if (a.oldFare != null && a.newFare != null) {
		const diff = a.newFare - a.oldFare;
		const direction = diff > 0 ? "increased" : "decreased";
		return `Fare has ${direction} from ₹${a.oldFare.toLocaleString("en-IN")} to ₹${a.newFare.toLocaleString("en-IN")}. ${a.message || ""}`.trim();
	}
	return a.message || null;
}

interface Props {
	traceId: string;
	priceId: string;
	returnPriceId?: string;
	/** Domestic multicity: all leg price ids in route order */
	priceIds?: string[];
	adultCount: number;
	childCount: number;
	infantCount: number;
}

/** TripJack `dob` / `eD` / `pid` must be `YYYY-MM-DD`, not ISO datetime from our passenger form. */
function tripjackDateOnly(raw?: string): string | undefined {
	if (!raw?.trim()) return undefined;
	const s = raw.trim();
	const ymd = s.match(/^(\d{4}-\d{2}-\d{2})/);
	if (ymd) return ymd[1];
	const t = Date.parse(s);
	if (Number.isNaN(t)) return undefined;
	const d = new Date(t);
	const y = d.getFullYear();
	const mo = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${mo}-${day}`;
}

/** TripJack docs expect contacts like `+919500112233` on `deliveryInfo` / `contactInfo`. */
function tripjackPhoneE164(raw: string): string {
	const s = raw.trim().replace(/[\s-]/g, "");
	if (!s) return s;
	if (s.startsWith("+")) return s;
	const digits = s.replace(/\D/g, "");
	if (digits.length === 10) return `+91${digits}`;
	if (digits.length >= 11 && digits.startsWith("91")) return `+${digits}`;
	return digits ? `+${digits}` : s;
}

function tripjackFlightRouteSummary(flight: FlightResult): string {
	const groups = flight.Segments ?? [];
	if (!groups.length) return "Flight booking";
	const first = groups[0]?.[0];
	const lastGroup = groups[groups.length - 1];
	const last = lastGroup?.[lastGroup.length - 1];
	const from = airportLabelFromFields(
		first?.Origin?.Airport?.AirportCode ||
			first?.Origin?.Airport?.CityCode ||
			"",
		first?.Origin?.Airport?.CityName,
	);
	const to = airportLabelFromFields(
		last?.Destination?.Airport?.AirportCode ||
			last?.Destination?.Airport?.CityCode ||
			"",
		last?.Destination?.Airport?.CityName,
	);
	if (from && to && from !== "" && to !== "") return `${from} → ${to}`;
	return "Flight booking";
}

function tripjackFlightLegDates(flight: FlightResult): {
	travelDateIso: string;
	returnDateIso: string | undefined;
	departureTimeLabel: string | undefined;
} {
	const groups = flight.Segments ?? [];
	const first = groups[0]?.[0];
	const lastGroup = groups[groups.length - 1];
	const last = lastGroup?.[lastGroup.length - 1];
	const depRaw = first?.Origin?.DepTime || first?.DepartureTime;
	const arrRaw = last?.Destination?.ArrTime || last?.ArrivalTime;
	const travel = depRaw ? new Date(depRaw) : new Date();
	const travelDateIso = Number.isNaN(travel.getTime())
		? new Date().toISOString()
		: travel.toISOString();
	let returnDateIso: string | undefined;
	if (arrRaw) {
		const end = new Date(arrRaw);
		if (!Number.isNaN(end.getTime())) returnDateIso = end.toISOString();
	}
	let departureTimeLabel: string | undefined;
	if (depRaw) {
		const d = new Date(depRaw);
		if (!Number.isNaN(d.getTime())) {
			departureTimeLabel = d.toLocaleTimeString(undefined, {
				hour: "2-digit",
				minute: "2-digit",
			});
		}
	}
	return { travelDateIso, returnDateIso, departureTimeLabel };
}

function mapPaxTypeToTripjack(
	paxType: number | string,
): "ADULT" | "CHILD" | "INFANT" {
	if (typeof paxType === "string") {
		if (paxType === "ADT" || paxType === "ADULT") return "ADULT";
		if (paxType === "CHD" || paxType === "CHILD") return "CHILD";
		return "INFANT";
	}
	if (paxType === 1) return "ADULT";
	if (paxType === 2) return "CHILD";
	return "INFANT";
}

type TripjackReviewFetchResult =
	| { ok: true; review: TripjackReviewResponse }
	| { ok: false; error: string };

/** Survives React Strict Mode remounts (component ref resets); avoids a second `/fms/v1/review` that can hang until the route times out (~60s). */
const tripjackReviewInflightByKey = new Map<
	string,
	Promise<TripjackReviewFetchResult>
>();
const tripjackReviewSuccessByKey = new Map<string, TripjackReviewResponse>();

export default function TripjackBookingClient({
	traceId,
	priceId,
	returnPriceId,
	priceIds: priceIdsProp,
	adultCount,
	childCount,
	infantCount,
}: Props) {
	const reviewPriceIds = useMemo(() => {
		if (priceIdsProp?.length) return priceIdsProp;
		return [priceId, returnPriceId].filter(
			(id): id is string => typeof id === "string" && id.trim().length > 0,
		);
	}, [priceIdsProp, priceId, returnPriceId]);
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [review, setReview] = useState<TripjackReviewResponse | null>(null);
	const [fareRules, setFareRules] = useState<FareRuleResponse | null>(null);
	const [fareRulesLoading, setFareRulesLoading] = useState(false);
	const [tjSsrPicks, setTjSsrPicks] = useState<TripjackSsrPickState>(emptyTripjackSsrPickState);
	const [passengers, setPassengers] = useState<PassengerDetail[]>([]);

	const reviewFlight: FlightResult | null = useMemo(
		() =>
			review
				? extractTripjackReviewFlight(review, priceId, {
						returnPriceId,
						priceIds: reviewPriceIds,
						adultCount,
						childCount,
						infantCount,
					})
				: null,
		[review, priceId, returnPriceId, reviewPriceIds, adultCount, childCount, infantCount],
	);

	const tjSegments = useMemo(() => tripjackFlatSegmentsFromReview(review), [review]);

	const passengersForSsr = useMemo(
		() =>
			passengers.length > 0
				? passengers
				: tripjackPlaceholderPassengers(adultCount, childCount, infantCount),
		[passengers, adultCount, childCount, infantCount],
	);

	const fareSsrShape = useMemo(
		() =>
			tripjackPicksToFareSsrShape(
				tjSegments,
				tjSsrPicks,
				adultCount,
				childCount,
				infantCount,
			),
		[tjSegments, tjSsrPicks, adultCount, childCount, infantCount],
	);

	const conditionFlags = useMemo(
		() => deriveConditionFlags(review?.conditions),
		[review?.conditions],
	);

	const fareAlertMessage = useMemo(
		() => buildFareAlertMessage(review?.alerts),
		[review?.alerts],
	);

	const totalAmount = useMemo(() => {
		const ssr = tripjackSsrExtraTotal(tjSsrPicks);
		const fc = fareComponentFromReviewTotal(review);
		const apiTotal = fc?.TF ?? fc?.NF;
		const fromSupplier = typeof apiTotal === "number" ? apiTotal : undefined;
		const fromFare = reviewFlight?.Fare?.PublishedFare;
		const base =
			fromSupplier ??
			(typeof fromFare === "number" ? fromFare : 0);
		return base + ssr;
	}, [review, reviewFlight, tjSsrPicks]);

	useEffect(() => {
		const priceIds = reviewPriceIds;
		if (!priceIds.length) {
			setLoading(false);
			setError(
				"Missing fare selection. Open this page from flight search results again.",
			);
			return;
		}

		const reviewCacheKey = priceIds.join("\0");
		let cancelled = false;

		const loadReviewOnce = (): Promise<TripjackReviewFetchResult> => {
			const cachedOk = tripjackReviewSuccessByKey.get(reviewCacheKey);
			if (cachedOk) {
				return Promise.resolve({ ok: true, review: cachedOk });
			}

			const existing = tripjackReviewInflightByKey.get(reviewCacheKey);
			if (existing) return existing;

			const p = (async (): Promise<TripjackReviewFetchResult> => {
				const reviewRes = await fetch("/api/travel/tripjack-flight/review", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ priceIds }),
				});
				const reviewData = await reviewRes.json().catch(() => ({}));
				if (!reviewRes.ok || !reviewData?.success) {
					return {
						ok: false,
						error:
							(typeof reviewData?.error === "string" && reviewData.error) ||
							"Unable to load TripJack review",
					};
				}
				const reviewPayload = reviewData.data as TripjackReviewResponse;
				const apiMessage =
					reviewPayload?.errors?.[0]?.message ||
					reviewPayload?.alerts?.[0]?.message ||
					reviewPayload?.status?.message;
				if (!reviewPayload?.bookingId) {
					return {
						ok: false,
						error:
							apiMessage ||
							"TripJack review did not return a valid booking reference. Please search again.",
					};
				}
				tripjackReviewSuccessByKey.set(reviewCacheKey, reviewPayload);
				return { ok: true, review: reviewPayload };
			})();

			tripjackReviewInflightByKey.set(reviewCacheKey, p);
			void p.finally(() => {
				tripjackReviewInflightByKey.delete(reviewCacheKey);
			});
			return p;
		};

		const init = async () => {
			setLoading(true);
			setError(null);
			setFareRules(null);
			setFareRulesLoading(false);
			try {
				const result = await loadReviewOnce();
				if (cancelled) return;
				if (!result.ok) {
					throw new Error(result.error);
				}
				setReview(result.review);
				// Show flight + passenger + SSR sections immediately (AIRiQ-style). Fare rules and seat map load in parallel after this.
				setLoading(false);

				const bookingId = result.review.bookingId;
				setFareRulesLoading(true);
				void (async () => {
					try {
						const fareRuleRes = await fetch("/api/travel/tripjack-flight/fare-rules", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								id: bookingId,
								flowType: "REVIEW",
								traceId,
							}),
						});
						if (cancelled) return;
						if (fareRuleRes.ok) {
							const fareRuleData = await fareRuleRes.json();
							if (cancelled) return;
							setFareRules(fareRuleData as FareRuleResponse);
						}
					} finally {
						if (!cancelled) setFareRulesLoading(false);
					}
				})();
			} catch (e) {
				if (cancelled) return;
				setError(e instanceof Error ? e.message : "Failed to load TripJack booking data");
				setLoading(false);
			}
		};
		void init();
		return () => {
			cancelled = true;
		};
	}, [reviewPriceIds, traceId]);

	const handleBookingSubmit = async (passengerData: PassengerDetail[]) => {
		if (!review?.bookingId) {
			setError("Review must be completed before booking");
			return;
		}
		if (!passengerData?.length) {
			setError("Please provide passenger details");
			return;
		}
		const lead = passengerData.find((p) => p.IsLeadPax) || passengerData[0];
		if (!lead?.Email || !lead?.ContactNo) {
			setError("Lead passenger email and contact number are required");
			return;
		}

		const reviewTF = fareComponentFromReviewTotal(review)?.TF;
		if (typeof reviewTF === "number" && Math.abs(totalAmount - reviewTF - tripjackSsrExtraTotal(tjSsrPicks)) > 1) {
			console.warn(
				"[TripJack] Amount mismatch: UI total",
				totalAmount,
				"vs review TF",
				reviewTF,
			);
		}

		if (conditionFlags.requireGst && !isTripjackMandatoryGstComplete(lead)) {
			const msg = "GST details are required for this booking.";
			setError(msg);
			toast.error(msg);
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			const phone = tripjackPhoneE164(lead.ContactNo);
			const roundAmount = Math.round(totalAmount * 100) / 100;
			const useHold = review.conditions?.isBA === true;
			const gstInfo = buildTripjackGstInfo(lead);

			const travellers: TripjackTravellerInfo[] = passengerData.map((p, idx) => {
				const ssr = tripjackTravellerSsrForPax(tjSegments, idx, tjSsrPicks);
				const dob = tripjackDateOnly(p.DateOfBirth);
				const passportExpiry = tripjackDateOnly(p.PassportExpiry);
				const passportIssue = tripjackDateOnly(p.PassportIssueDate);
				const hasPassport = Boolean(p.PassportNo?.trim());
				const nationality = p.Nationality?.trim() || p.CountryCode?.trim() || "IN";
				const pan =
					p.PAN?.trim() ||
					((p.PaxType === 2 || p.PaxType === 3) && p.GuardianDetails?.PAN?.trim()
						? p.GuardianDetails.PAN.trim()
						: undefined);
				return {
					ti: (p.Title || "MR").toUpperCase(),
					fN: p.FirstName || "",
					lN: p.LastName || "",
					pt: mapPaxTypeToTripjack(p.PaxType),
					gd: Number(p.Gender) === 2 ? "FEMALE" : "MALE",
					dob,
					...(hasPassport
						? {
								pNum: p.PassportNo!.trim(),
								eD: passportExpiry,
								pid: passportIssue,
								pNat: nationality,
							}
						: { pNat: nationality }),
					pan,
					di: p.DocumentId?.trim() || undefined,
					...ssr,
				};
			});

			let contactInfo = {
				emails: [lead.Email.trim()],
				contacts: [phone],
				ecn:
					[lead.FirstName, lead.LastName].filter(Boolean).join(" ").trim() ||
					"Lead passenger",
			};
			if (conditionFlags.requireEmergencyContact) {
				const emPhone = lead.EmergencyContactPhone?.trim()
					? tripjackPhoneE164(lead.EmergencyContactPhone)
					: phone;
				contactInfo = {
					emails: [lead.EmergencyEmail?.trim() || lead.Email.trim()],
					contacts: [emPhone],
					ecn: lead.EmergencyContactName?.trim() || contactInfo.ecn,
				};
			}

			const bookBody: Record<string, unknown> = {
				bookingId: review.bookingId,
				travellerInfo: travellers,
				contactInfo,
				deliveryInfo: { emails: [lead.Email.trim()], contacts: [phone] },
			};
			if (gstInfo) bookBody.gstInfo = gstInfo;
			if (!useHold) {
				bookBody.paymentInfos = [{ amount: roundAmount }];
			}

			const bookRes = await fetch("/api/travel/tripjack-flight/book", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bookBody),
			});
			const bookData = await bookRes.json();
			if (!bookRes.ok || !bookData?.success) {
				const payload = bookData?.providerPayload as
					| { errors?: Array<{ message?: string }> }
					| undefined;
				const providerMsg =
					payload?.errors?.[0]?.message ||
					(typeof bookData?.data?.errors?.[0]?.message === "string"
						? bookData.data.errors[0].message
						: null);
				throw new Error(
					providerMsg ||
						(typeof bookData?.error === "string" && bookData.error) ||
						"TripJack booking failed",
				);
			}

			if (useHold) {
				const fvRes = await fetch("/api/travel/tripjack-flight/fare-validate", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bookingId: review.bookingId }),
				});
				const fvData = await fvRes.json();
				if (!fvRes.ok || !fvData?.success) {
					throw new Error(
						(typeof fvData?.error === "string" && fvData.error) ||
							"TripJack fare validation failed before confirm",
					);
				}

				const confirmRes = await fetch("/api/travel/tripjack-flight/confirm-book", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						bookingId: review.bookingId,
						paymentInfos: [{ amount: roundAmount }],
					}),
				});
				const confirmData = await confirmRes.json();
				if (!confirmRes.ok || !confirmData?.success) {
					throw new Error(
						(typeof confirmData?.error === "string" && confirmData.error) ||
							"TripJack confirm-book failed",
					);
				}
			}

			const finalBookingId = review.bookingId;
			let pnr: string | undefined;
			try {
				const detRes = await fetch("/api/travel/tripjack-flight/booking-details", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						bookingId: finalBookingId,
						requirePaxPricing: true,
					}),
				});
				const detData = await detRes.json();
				if (detRes.ok && detData?.success && typeof detData.pnr === "string") {
					pnr = detData.pnr;
				}
			} catch {
				/* best-effort */
			}

			if (reviewFlight) {
				const { travelDateIso, returnDateIso, departureTimeLabel } =
					tripjackFlightLegDates(reviewFlight);
				const displayName = [lead.Title, lead.FirstName, lead.LastName]
					.filter(Boolean)
					.join(" ")
					.trim();
				void fetch("/api/bookings/tripjack-flight", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						tripjackBookingId: finalBookingId,
						name: displayName || `${lead.FirstName} ${lead.LastName}`.trim(),
						email: lead.Email.trim(),
						phone: lead.ContactNo?.trim() || undefined,
						leadFirstName: lead.FirstName,
						leadLastName: lead.LastName,
						routeSummary: tripjackFlightRouteSummary(reviewFlight),
						travelDate: travelDateIso,
						returnDate: returnDateIso,
						departureTime: departureTimeLabel,
						travelers: adultCount + childCount + infantCount,
						totalAmount,
						status: "CONFIRMED",
					}),
				})
					.then(async (res) => {
						if (res.status === 401) {
							toast.info("Sign in to save this trip under My Trips.");
						}
					})
					.catch(() => {
						/* best-effort: confirmation still works if My Trips save fails */
					});
			}

			toast.success("TripJack booking completed successfully");
			const confirmQs = new URLSearchParams({
				source: "tripjack",
				bookingId: finalBookingId,
			});
			if (pnr) confirmQs.set("pnr", pnr);
			router.push(`/travel-portal/booking/confirmation?${confirmQs.toString()}`);
		} catch (e) {
			const msg = e instanceof Error ? e.message : "Booking failed";
			setError(msg);
			toast.error(msg);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardContent className="py-8 text-center">
						<Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!reviewFlight || !review?.bookingId) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<Card className="max-w-md w-full">
					<CardContent className="py-8 text-center space-y-4">
						<p className="text-gray-600">{error || "TripJack flight is no longer available."}</p>
						<Link
							href="/travel-portal"
							className="inline-flex items-center rounded bg-black px-4 py-2 text-white"
						>
							<Search className="mr-2 h-4 w-4" />
							Search Flights Again
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-[calc(8rem+env(safe-area-inset-bottom))]">
			<h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">
				Complete Your Booking
			</h1>
			{fareAlertMessage && (
				<div className="mb-6 rounded border border-amber-300 bg-amber-50 p-3 text-amber-800 flex items-start gap-2">
					<AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
					<span>{fareAlertMessage}</span>
				</div>
			)}

			{error && (
				<div className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-red-700">
					{error}
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
				<div className="lg:col-span-8 space-y-8">
					<section>
						<FlightDetails flightResult={reviewFlight} />
					</section>

					<section>
						<PassengerDetails
							adultCount={adultCount}
							childCount={childCount}
							infantCount={infantCount}
							onBookingSubmit={handleBookingSubmit}
							onPassengersChange={setPassengers}
							flightResult={reviewFlight}
							isSubmitting={isSubmitting}
							requirePassport={conditionFlags.requirePassport}
							requirePassportExpiry={conditionFlags.requirePassportExpiry}
							requirePassportFull={conditionFlags.requirePassportFull}
							requireDob={conditionFlags.requireDob}
							requireGST={conditionFlags.requireGst}
							gstOptional={
								conditionFlags.gstApplicable && !conditionFlags.requireGst
							}
							requirePAN={conditionFlags.requirePan}
							requireDocumentId={conditionFlags.requireDocumentId}
							requireEmergencyContact={conditionFlags.requireEmergencyContact}
							ssrCharges={{
								baggage: fareSsrShape.baggage,
								meals: fareSsrShape.meals,
								seats: fareSsrShape.seats,
								specialServices: fareSsrShape.specialServices,
							}}
						/>
					</section>

					{review?.bookingId ? (
						<section>
							<TripjackSSRSelection
								bookingId={review.bookingId}
								segments={tjSegments}
								adultCount={adultCount}
								childCount={childCount}
								infantCount={infantCount}
								passengers={passengersForSsr}
								picks={tjSsrPicks}
								onPicksChange={setTjSsrPicks}
							/>
						</section>
					) : null}

					<section>
						<FareRulesView fareRules={fareRules} isLoading={fareRulesLoading} />
					</section>
				</div>

				<div className="lg:col-span-4 h-full">
					<div className="sticky top-6 space-y-6">
						<FareBreakdown
							flight={reviewFlight}
							showValidation={false}
							ssrCharges={{
								baggage: fareSsrShape.baggage,
								meals: fareSsrShape.meals,
								seats: fareSsrShape.seats,
								specialServices: fareSsrShape.specialServices,
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

