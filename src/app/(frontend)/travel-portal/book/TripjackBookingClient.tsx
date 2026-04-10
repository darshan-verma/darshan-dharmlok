"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FlightResult } from "@/types/tbo";
import type { PassengerDetail, FareRuleResponse } from "@/types/tbo";
import type { TripjackReviewResponse, TripjackTravellerInfo } from "@/types/tripjackFlight";
import { extractTripjackReviewFlight } from "@/lib/tripjackFlightBooking";
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
import { Loader2, Search } from "lucide-react";
import Link from "next/link";

interface Props {
	traceId: string;
	priceId: string;
	returnPriceId?: string;
	adultCount: number;
	childCount: number;
	infantCount: number;
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

export default function TripjackBookingClient({
	traceId,
	priceId,
	returnPriceId,
	adultCount,
	childCount,
	infantCount,
}: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [review, setReview] = useState<TripjackReviewResponse | null>(null);
	const [fareRules, setFareRules] = useState<FareRuleResponse | null>(null);
	const [fareRulesLoading, setFareRulesLoading] = useState(false);
	const [tripType, setTripType] = useState<"instant" | "hold">("instant");
	const [tjSsrPicks, setTjSsrPicks] = useState<TripjackSsrPickState>(emptyTripjackSsrPickState);
	const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
	/** One in-flight review per priceIds key so React Strict Mode / HMR cannot fire two TripJack reviews (second often returns 400). */
	const tripjackReviewPromiseByKeyRef = useRef(
		new Map<string, Promise<TripjackReviewFetchResult>>(),
	);

	const reviewFlight: FlightResult | null = useMemo(
		() =>
			review
				? extractTripjackReviewFlight(review, priceId, {
						returnPriceId,
						adultCount,
						childCount,
						infantCount,
					})
				: null,
		[review, priceId, returnPriceId, adultCount, childCount, infantCount],
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

	const totalAmount = useMemo(() => {
		const ssr = tripjackSsrExtraTotal(tjSsrPicks);
		const fc = review?.totalPriceInfo?.totalFareDetail?.fc;
		const apiTotal = fc?.TF ?? fc?.NF;
		const fromSupplier = typeof apiTotal === "number" ? apiTotal : undefined;
		// Supplier total for payment; if missing, match displayed fare from review flight
		const fromFare = reviewFlight?.Fare?.PublishedFare;
		const base =
			fromSupplier ??
			(typeof fromFare === "number" ? fromFare : 0);
		return base + ssr;
	}, [review, reviewFlight, tjSsrPicks]);

	useEffect(() => {
		const priceIds = [priceId, returnPriceId].filter(
			(x): x is string => typeof x === "string" && x.trim().length > 0,
		);
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
			const cache = tripjackReviewPromiseByKeyRef.current;
			const existing = cache.get(reviewCacheKey);
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
				return { ok: true, review: reviewPayload };
			})();

			cache.set(reviewCacheKey, p);
			void p.finally(() => {
				cache.delete(reviewCacheKey);
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
	}, [priceId, returnPriceId, traceId]);

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
		setIsSubmitting(true);
		setError(null);
		try {
			const travellers: TripjackTravellerInfo[] = passengerData.map((p, idx) => {
				const ssr = tripjackTravellerSsrForPax(tjSegments, idx, tjSsrPicks);
				return {
					ti: (p.Title || "MR").toUpperCase(),
					fN: p.FirstName || "",
					lN: p.LastName || "",
					pt: mapPaxTypeToTripjack(p.PaxType),
					gd: Number(p.Gender) === 2 ? "FEMALE" : "MALE",
					dob: p.DateOfBirth || undefined,
					pNum: p.PassportNo || undefined,
					eD: p.PassportExpiry || undefined,
					pNat: p.Nationality || "IN",
					...ssr,
				};
			});

			const paymentInfos = tripType === "instant" ? [{ amount: totalAmount }] : undefined;
			const bookRes = await fetch("/api/travel/tripjack-flight/book", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					bookingId: review.bookingId,
					travellerInfo: travellers,
					deliveryInfo: { emails: [lead.Email], contacts: [lead.ContactNo] },
					paymentInfos,
				}),
			});
			const bookData = await bookRes.json();
			if (!bookRes.ok || !bookData?.success) {
				throw new Error(bookData?.error || "TripJack booking failed");
			}

			const finalBookingId = review.bookingId;
			if (tripType === "hold") {
				const confirmFareRes = await fetch("/api/travel/tripjack-flight/confirm-fare", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bookingId: finalBookingId }),
				});
				const confirmFareData = await confirmFareRes.json();
				if (!confirmFareRes.ok) {
					throw new Error(confirmFareData?.error || "Confirm fare failed");
				}

				const confirmBookRes = await fetch("/api/travel/tripjack-flight/confirm-book", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						bookingId: finalBookingId,
						paymentInfos: [{ amount: totalAmount }],
					}),
				});
				const confirmBookData = await confirmBookRes.json();
				if (!confirmBookRes.ok) {
					throw new Error(confirmBookData?.error || "Confirm booking failed");
				}
			}

			toast.success("TripJack booking completed successfully");
			router.push(
				`/travel-portal/booking/confirmation?source=tripjack&bookingId=${encodeURIComponent(finalBookingId)}`,
			);
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
						<div className="mb-4 flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-4">
							<label className="text-sm">
								<input
									type="radio"
									name="tripType"
									className="mr-2"
									checked={tripType === "instant"}
									onChange={() => setTripType("instant")}
								/>
								Instant Ticket
							</label>
							<label className="text-sm">
								<input
									type="radio"
									name="tripType"
									className="mr-2"
									checked={tripType === "hold"}
									onChange={() => setTripType("hold")}
								/>
								Hold + Confirm
							</label>
						</div>
						<PassengerDetails
							adultCount={adultCount}
							childCount={childCount}
							infantCount={infantCount}
							onBookingSubmit={handleBookingSubmit}
							onPassengersChange={setPassengers}
							flightResult={reviewFlight}
							isSubmitting={isSubmitting}
							requirePassport={review?.conditions?.pcs === true}
							requirePassportFull={review?.conditions?.pcs === true}
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

