"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CabBookingDetailsView from "@/components/travel-portal/CabBookingDetailsView";
import type {
	TripjackBookingResponseData,
	TripjackJourneyInfo,
	TripjackRouteDetails,
	TripjackPolicies,
	TripjackQuoteItem,
	TripjackQuotesGroup,
} from "@/types/tripjack";
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";

interface CabQuoteCardProps {
	group: TripjackQuotesGroup;
	quote: TripjackQuoteItem;
	journeyInfo: TripjackJourneyInfo;
	routeDetails: TripjackRouteDetails;
}

interface BookingApiResponse {
	success: boolean;
	message?: string;
	error?: string;
	data?: TripjackBookingResponseData;
	travelBookingId?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s-]{8,20}$/;

function formatCurrency(value: number) {
	return `₹${formatTravelPriceInr(value)}`;
}

function getHighlights(policies?: TripjackPolicies) {
	const meetAndGreet =
		typeof policies?.meetAndGreet === "object" &&
		policies?.meetAndGreet &&
		!Array.isArray(policies.meetAndGreet)
			? policies.meetAndGreet.description || policies.meetAndGreet.type
			: Array.isArray(policies?.meetAndGreet)
				? policies.meetAndGreet[0]
				: undefined;

	return [
		policies?.waitingTime,
		meetAndGreet,
		policies?.inclusions?.[0],
		policies?.cancellationPolicy?.[0]?.description,
	].filter(Boolean) as string[];
}

export default function CabQuoteCard({
	group,
	quote,
	journeyInfo,
	routeDetails,
}: CabQuoteCardProps) {
	const { data: session } = useSession();
	const defaultsStorageKey = useMemo(() => {
		const userId = session?.user?.id || "guest";
		return `tripjack-cab-booking-defaults:${userId}`;
	}, [session?.user?.id]);
	const [showBookingForm, setShowBookingForm] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [bookingError, setBookingError] = useState<string | null>(null);
	const [bookingResult, setBookingResult] =
		useState<TripjackBookingResponseData | null>(null);
	const [savedTravelBookingId, setSavedTravelBookingId] = useState<string | null>(
		null,
	);
	const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		flightNumber: "",
		serviceRequest: "",
		agentEmail: "",
		agentPhone: "",
		agentId: "617306",
		consent: false,
	});

	const image = group.vehicleImages?.[0];
	const netAmountValue = useMemo(() => {
		const onward = Number(quote.fareBreakup.onwardFare) || 0;
		const backward = Number(quote.fareBreakup.backwardFare) || 0;
		if (onward > 0 || backward > 0) {
			return onward + backward;
		}

		return Number(quote.fareBreakup.totalFare) || 0;
	}, [quote.fareBreakup]);
	const taxes = useMemo(() => {
		const onwardTax = Number(quote.fareBreakup.onwardTax) || 0;
		const backwardTax = Number(quote.fareBreakup.backwardTax) || 0;
		if (onwardTax > 0 || backwardTax > 0) {
			return onwardTax + backwardTax;
		}

		return Number(quote.fareBreakup.totalTax) || 0;
	}, [quote.fareBreakup]);
	const tjManagementFeeStr = useMemo(() => {
		const mf = Number(quote.fareBreakup.tjManagementFee);
		return Number.isFinite(mf) && mf > 0 ? mf.toFixed(2) : "0.00";
	}, [quote.fareBreakup]);
	const total = netAmountValue + taxes;
	const highlights = getHighlights(quote.policies).slice(0, 3);
	const defaultPaxCount = useMemo(() => {
		if (typeof quote.paxCount === "number" && quote.paxCount > 0) {
			return quote.paxCount;
		}

		const parsed = Number(group.paxCapacity || "1");
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
	}, [group.paxCapacity, quote.paxCount]);
	const defaultLuggageCount = useMemo(() => {
		if (typeof quote.luggageCount === "number" && quote.luggageCount >= 0) {
			return quote.luggageCount;
		}

		const parsed = Number(group.luggageCapacity || "0");
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
	}, [group.luggageCapacity, quote.luggageCount]);

	useEffect(() => {
		if (!session?.user) {
			return;
		}

		setFormData((prev) => {
			const fullName = (session.user.name || "").trim();
			const nameParts = fullName ? fullName.split(/\s+/) : [];
			const inferredFirstName = nameParts[0] || "";
			const inferredLastName = nameParts.slice(1).join(" ") || "";

			return {
				...prev,
				firstName: prev.firstName || inferredFirstName,
				lastName: prev.lastName || inferredLastName,
				email: prev.email || session.user.email || "",
				agentEmail: prev.agentEmail || session.user.email || "",
			};
		});
	}, [session?.user]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		try {
			const raw = window.localStorage.getItem(defaultsStorageKey);
			if (!raw) {
				return;
			}

			const saved = JSON.parse(raw) as {
				agentEmail?: string;
				agentPhone?: string;
				agentId?: string;
			};

			setFormData((prev) => ({
				...prev,
				agentEmail: prev.agentEmail || saved.agentEmail || "",
				agentPhone: prev.agentPhone || saved.agentPhone || "",
				agentId: prev.agentId || saved.agentId || "617306",
			}));
		} catch {
			// Ignore malformed cached defaults and continue with current values.
		}
	}, [defaultsStorageKey]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		try {
			window.localStorage.setItem(
				defaultsStorageKey,
				JSON.stringify({
					agentEmail: formData.agentEmail.trim(),
					agentPhone: formData.agentPhone.trim(),
					agentId: formData.agentId.trim(),
				}),
			);
		} catch {
			// Ignore storage write failures in restricted browser modes.
		}
	}, [
		defaultsStorageKey,
		formData.agentEmail,
		formData.agentId,
		formData.agentPhone,
	]);

	function validateForm() {
		if (!quote.quotationId || !quote.quoteChildId) {
			return "Selected quote is missing quote identifiers. Please refresh and search again.";
		}

		if (
			!formData.firstName.trim() ||
			!formData.lastName.trim() ||
			!formData.email.trim() ||
			!formData.phone.trim() ||
			!formData.agentEmail.trim() ||
			!formData.agentPhone.trim() ||
			!formData.agentId.trim()
		) {
			return "Please fill all required booking details.";
		}

		if (!EMAIL_REGEX.test(formData.email.trim())) {
			return "Please enter a valid passenger email.";
		}

		if (!EMAIL_REGEX.test(formData.agentEmail.trim())) {
			return "Please enter a valid agent email.";
		}

		if (!PHONE_REGEX.test(formData.phone.trim())) {
			return "Please enter a valid passenger phone number.";
		}

		if (!PHONE_REGEX.test(formData.agentPhone.trim())) {
			return "Please enter a valid agent phone number.";
		}

		if (!formData.consent) {
			return "Please provide consent before creating the booking.";
		}

		return null;
	}

	function updateFormField<K extends keyof typeof formData>(
		field: K,
		value: (typeof formData)[K],
	) {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	}

	async function submitBooking() {
		const validationError = validateForm();
		if (validationError) {
			setBookingError(validationError);
			return;
		}

		setIsSubmitting(true);
		setBookingError(null);
		setBookingResult(null);
		setSavedTravelBookingId(null);

		const parsedAgentId = Number(formData.agentId.trim());
		const normalizedAgentId = Number.isFinite(parsedAgentId)
			? parsedAgentId
			: formData.agentId.trim();

		try {
			const response = await fetch("/api/travel/cabs/booking", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					journeyInfo,
					routeDetail: routeDetails,
					addons: [],
					quotationInfo: {
						vehicleType: group.vehicleType,
						vehicleCategory: group.vehicleCategory,
						quoteId: quote.quotationId,
						childQuoteId: quote.quoteChildId,
						paxCount: defaultPaxCount,
						luggageCount: defaultLuggageCount,
						vendorId: quote.vendorId,
					},
					pricingInfo: {
						netAmount: netAmountValue.toFixed(2),
						addonsPrice: "0.00",
						tjTaxAmount: taxes.toFixed(2),
						tjManagementFee: tjManagementFeeStr,
						agentMarkup: 0,
						agentMarkupSplitup: {
							onwardJourneyMarkup: 0,
							returnJourneyMarkup: 0,
						},
						grossAmount: total.toFixed(2),
					},
					passengerDetail: {
						firstName: formData.firstName.trim(),
						lastName: formData.lastName.trim(),
						email: formData.email.trim(),
						phone: formData.phone.trim(),
						flightDetails: formData.flightNumber.trim()
							? {
									number: formData.flightNumber.trim(),
								}
							: undefined,
					},
					serviceRequest: formData.serviceRequest.trim() || undefined,
					consent: "yes",
					agentEmail: formData.agentEmail.trim(),
					agentPhone: formData.agentPhone.trim(),
					agentId: normalizedAgentId,
					vendorId: quote.vendorId,
				}),
			});

			const payload = (await response.json()) as BookingApiResponse;
			if (!response.ok || !payload.success || !payload.data) {
				throw new Error(payload.error || "Failed to create booking");
			}

			setBookingResult(payload.data);
			setSavedTravelBookingId(
				typeof payload.travelBookingId === "string"
					? payload.travelBookingId
					: null,
			);
		} catch (error) {
			setBookingError(
				error instanceof Error ? error.message : "Failed to create booking",
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<Card className="overflow-hidden border-gray-200 shadow-sm transition hover:shadow-lg">
			<CardContent className="p-0">
				<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_240px]">
					<div className="relative min-h-56 bg-gradient-to-br from-amber-100 to-orange-50">
						{image ? (
							<Image
								src={image}
								alt={group.label}
								fill
								className="object-cover"
								unoptimized
							/>
						) : (
							<div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
								Vehicle image unavailable
							</div>
						)}
					</div>

					<div className="space-y-4 p-6">
						<div className="flex flex-wrap items-start gap-3">
							<div>
								<div className="text-xl font-semibold text-gray-900">
									{group.label}
								</div>
								<div className="mt-1 text-sm text-gray-600">
									{group.similarType ||
										group.modelName ||
										`${group.vehicleType} ${group.vehicleCategory}`}
								</div>
							</div>
							<Badge
								variant="secondary"
								className="rounded-full bg-amber-100 text-amber-900"
							>
								Vendor {quote.vendorId}
							</Badge>
						</div>

						<div className="flex flex-wrap gap-2 text-sm text-gray-600">
							<Badge variant="outline" className="rounded-full">
								{quote.paxCount || group.paxCapacity || "-"} pax
							</Badge>
							<Badge variant="outline" className="rounded-full">
								{quote.luggageCount || group.luggageCapacity || "-"} luggage
							</Badge>
							<Badge variant="outline" className="rounded-full">
								{group.vehicleCategory}
							</Badge>
						</div>

						{highlights.length > 0 && (
							<div className="grid gap-2 text-sm text-gray-700">
								{highlights.map((highlight) => (
									<div
										key={highlight}
										className="rounded-xl bg-gray-50 px-3 py-2"
									>
										{highlight}
									</div>
								))}
							</div>
						)}
					</div>

					<div className="flex flex-col justify-between border-t border-gray-100 bg-gray-50 p-6 lg:border-l lg:border-t-0">
						<div>
							<div className="text-sm text-gray-500">Total trip fare</div>
							<div className="mt-2 text-3xl font-semibold text-gray-900">
								{formatCurrency(total)}
							</div>
							<div className="mt-2 space-y-1 text-sm text-gray-600">
								<div>Base fare: {formatCurrency(netAmountValue)}</div>
								<div>Taxes: {formatCurrency(taxes)}</div>
							</div>
						</div>

						<Button
							type="button"
							className="mt-4 w-full rounded-xl"
							onClick={() => {
								setShowBookingForm((prev) => !prev);
								setBookingError(null);
							}}
						>
							{showBookingForm ? "Close Booking Form" : "Book This Cab"}
						</Button>
					</div>
				</div>

				{showBookingForm && (
					<div className="border-t border-gray-200 bg-white p-6">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							<div className="space-y-2">
								<Label htmlFor={`firstName-${quote.quoteChildId}`}>
									First Name
								</Label>
								<Input
									id={`firstName-${quote.quoteChildId}`}
									value={formData.firstName}
									onChange={(event) =>
										updateFormField("firstName", event.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`lastName-${quote.quoteChildId}`}>
									Last Name
								</Label>
								<Input
									id={`lastName-${quote.quoteChildId}`}
									value={formData.lastName}
									onChange={(event) =>
										updateFormField("lastName", event.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`email-${quote.quoteChildId}`}>Email</Label>
								<Input
									id={`email-${quote.quoteChildId}`}
									type="email"
									value={formData.email}
									onChange={(event) =>
										updateFormField("email", event.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`phone-${quote.quoteChildId}`}>Phone</Label>
								<Input
									id={`phone-${quote.quoteChildId}`}
									value={formData.phone}
									onChange={(event) =>
										updateFormField("phone", event.target.value)
									}
									placeholder="+919999999999"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`flight-${quote.quoteChildId}`}>
									Flight Number (Optional)
								</Label>
								<Input
									id={`flight-${quote.quoteChildId}`}
									value={formData.flightNumber}
									onChange={(event) =>
										updateFormField("flightNumber", event.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`service-${quote.quoteChildId}`}>
									Service Request (Optional)
								</Label>
								<Input
									id={`service-${quote.quoteChildId}`}
									value={formData.serviceRequest}
									onChange={(event) =>
										updateFormField("serviceRequest", event.target.value)
									}
									placeholder="AC mandatory in car"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`agentEmail-${quote.quoteChildId}`}>
									Agent Email
								</Label>
								<Input
									id={`agentEmail-${quote.quoteChildId}`}
									type="email"
									value={formData.agentEmail}
									onChange={(event) =>
										updateFormField("agentEmail", event.target.value)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`agentPhone-${quote.quoteChildId}`}>
									Agent Phone
								</Label>
								<Input
									id={`agentPhone-${quote.quoteChildId}`}
									value={formData.agentPhone}
									onChange={(event) =>
										updateFormField("agentPhone", event.target.value)
									}
									placeholder="+919888888888"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor={`agentId-${quote.quoteChildId}`}>
									Agent ID
								</Label>
								<Input
									id={`agentId-${quote.quoteChildId}`}
									value={formData.agentId}
									onChange={(event) =>
										updateFormField("agentId", event.target.value)
									}
								/>
							</div>
						</div>

						<label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
							<input
								type="checkbox"
								checked={formData.consent}
								onChange={(event) =>
									updateFormField("consent", event.target.checked)
								}
							/>
							I confirm passenger consent for this booking.
						</label>

						{bookingError && (
							<div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{bookingError}
							</div>
						)}

						{bookingResult && (
							<div className="mt-3 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
								<p className="font-medium">
									Booking created:{" "}
									<span className="font-mono">{bookingResult.id}</span> (
									{bookingResult.status})
								</p>
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										variant="secondary"
										size="sm"
										className="rounded-lg"
										onClick={() => setBookingDetailsOpen(true)}
									>
										View booking
									</Button>
									{savedTravelBookingId ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="rounded-lg"
											asChild
										>
											<Link
												href={`/travel-portal/cab-booking/${savedTravelBookingId}`}
											>
												Open full page
											</Link>
										</Button>
									) : null}
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="rounded-lg"
										asChild
									>
										<Link href="/travel-portal/my-trips">My trips</Link>
									</Button>
								</div>
								{!savedTravelBookingId ? (
									<p className="text-xs text-emerald-800/90">
										Sign in before booking to save this trip under My Trips and open
										the full-page receipt.
									</p>
								) : null}
							</div>
						)}

						<div className="mt-4 flex justify-end">
							<Button
								type="button"
								onClick={() => void submitBooking()}
								disabled={isSubmitting}
								className="rounded-xl"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Creating booking...
									</>
								) : (
									"Confirm Booking"
								)}
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
			<Dialog open={bookingDetailsOpen} onOpenChange={setBookingDetailsOpen}>
				<DialogContent className="max-h-[min(90vh,800px)] max-w-2xl overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Cab booking details</DialogTitle>
						{bookingResult?.id ? (
							<p className="font-mono text-xs text-muted-foreground">
								{bookingResult.id}
							</p>
						) : null}
					</DialogHeader>
					{bookingResult ? (
						<CabBookingDetailsView data={bookingResult} showTitle={false} />
					) : null}
				</DialogContent>
			</Dialog>
		</>
	);
}
