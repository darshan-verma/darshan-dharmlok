import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, User, IndianRupee, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatTravelPriceInr } from "@/lib/formatTravelPrice";
import type { TripjackCabBookingSnapshot } from "@/types/tripjack";

function formatInr(amount: number | undefined | null) {
	if (amount === undefined || amount === null || Number.isNaN(amount)) {
		return "—";
	}
	return `₹${formatTravelPriceInr(amount)}`;
}

function formatDateTime(iso?: string | null) {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleString("en-IN", {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

type PoliciesShape = {
	amendmentPolicy?: string;
	cancellationPolicy?: {
		description?: string;
		refundPercentage?: number;
		minHours?: number;
	}[];
	inclusions?: string[];
	exclusions?: string[];
	waitingTime?: string;
	termsAndPolicies?: string[];
	meetAndGreet?: { type?: string; description?: string };
};

function getPolicies(data: TripjackCabBookingSnapshot): PoliciesShape | null {
	const raw = data.additionalInfo as { policies?: PoliciesShape } | undefined;
	return raw?.policies ?? null;
}

export interface CabBookingDetailsViewProps {
	data: TripjackCabBookingSnapshot;
	showTitle?: boolean;
}

export default function CabBookingDetailsView({
	data,
	showTitle = true,
}: CabBookingDetailsViewProps) {
	const policies = getPolicies(data);
	const vehicleImg = data.bookingVehicle?.images;

	return (
		<div className="space-y-6">
			{showTitle && (
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h2 className="text-xl font-semibold tracking-tight">Cab booking</h2>
						<p className="text-sm text-muted-foreground">
							Reference{" "}
							<span className="font-mono text-foreground">{data.id}</span>
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Badge variant="secondary">{data.status}</Badge>
						{data.paymentStatus ? (
							<Badge variant="outline">Payment: {data.paymentStatus}</Badge>
						) : null}
						{data.rideStatus ? (
							<Badge variant="outline">Ride: {data.rideStatus}</Badge>
						) : null}
					</div>
				</div>
			)}

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<User className="h-4 w-4" />
							Passenger
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						<p className="font-medium">
							{data.passenger?.fullName ||
								[data.passenger?.firstName, data.passenger?.lastName]
									.filter(Boolean)
									.join(" ") ||
								"—"}
						</p>
						<p className="text-muted-foreground">{data.passenger?.email || "—"}</p>
						<p className="text-muted-foreground">{data.passenger?.phone || "—"}</p>
						<p className="text-muted-foreground">
							Pax / luggage: {data.passengerCount ?? "—"} /{" "}
							{data.luggageCount ?? "—"}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<Car className="h-4 w-4" />
							Vehicle
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<p className="font-medium">{data.bookingVehicle?.clazz || "—"}</p>
						<p className="text-muted-foreground">
							Capacity: {data.bookingVehicle?.maxCapacity ?? "—"} · Luggage:{" "}
							{data.bookingVehicle?.luggageCapacity ?? "—"}
						</p>
						{vehicleImg ? (
							<div className="relative mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
								<Image
									src={vehicleImg}
									alt={data.bookingVehicle?.clazz || "Vehicle"}
									fill
									className="object-contain p-2"
									unoptimized
								/>
							</div>
						) : null}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center gap-2 text-base">
						<MapPin className="h-4 w-4" />
						Journey
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<div className="grid gap-2 sm:grid-cols-2">
						<div>
							<p className="text-xs font-medium uppercase text-muted-foreground">
								Pickup
							</p>
							<p>{data.journey?.source || "—"}</p>
						</div>
						<div>
							<p className="text-xs font-medium uppercase text-muted-foreground">
								Drop
							</p>
							<p>{data.journey?.destination || "—"}</p>
						</div>
					</div>
					<Separator />
					<div className="grid gap-2 sm:grid-cols-2">
						<div>
							<p className="text-xs text-muted-foreground">Pickup time</p>
							<p className="font-medium">{formatDateTime(data.journey?.pickupDate)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Est. end</p>
							<p>{formatDateTime(data.journey?.tripEndDate)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Type</p>
							<p>
								{data.journey?.journeyType || "—"} · {data.tripType || "—"}
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Distance / duration</p>
							<p>
								{data.journey?.distance || "—"} ·{" "}
								{typeof data.journey?.duration === "number"
									? `${data.journey.duration} min`
									: "—"}
							</p>
						</div>
						{data.journey?.flightDetails?.number ? (
							<div className="sm:col-span-2">
								<p className="text-xs text-muted-foreground">Flight</p>
								<p className="font-medium">{data.journey.flightDetails.number}</p>
							</div>
						) : null}
						{data.journey?.timezone ? (
							<div>
								<p className="text-xs text-muted-foreground">Timezone</p>
								<p>{data.journey.timezone}</p>
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<IndianRupee className="h-4 w-4" />
							Price
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Total</span>
							<span className="font-semibold">
								{formatInr(data.totalPrice)} {data.currency || "INR"}
							</span>
						</div>
						{data.priceBreakup ? (
							<>
								<Separator />
								<div className="flex justify-between">
									<span className="text-muted-foreground">Gross</span>
									<span>{formatInr(data.priceBreakup.grossAmount)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">TripJack tax</span>
									<span>{formatInr(data.priceBreakup.tjTaxAmount)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Management fee</span>
									<span>{formatInr(data.priceBreakup.tjManagementFee)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Agent markup</span>
									<span>{formatInr(data.priceBreakup.agentMarkupPrice)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Net payable</span>
									<span>{formatInr(data.priceBreakup.agentNetPayable)}</span>
								</div>
							</>
						) : null}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Booking & agent</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<div className="flex justify-between gap-2">
							<span className="text-muted-foreground">Quote / child</span>
							<span className="text-right font-mono text-xs">
								{data.quoteId || "—"} / {data.childQuoteId || "—"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Vendor</span>
							<span>{data.vendorId ?? "—"}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Agent ID</span>
							<span>{data.agentId || "—"}</span>
						</div>
						<div className="flex justify-between gap-2">
							<span className="text-muted-foreground">Agent email</span>
							<span className="text-right break-all">{data.agentEmail || "—"}</span>
						</div>
						<div className="flex justify-between gap-2">
							<span className="text-muted-foreground">Agent phone</span>
							<span className="text-right">{data.agentMobile || "—"}</span>
						</div>
						{data.serviceRequest ? (
							<div>
								<p className="text-xs text-muted-foreground">Service request</p>
								<p>{data.serviceRequest}</p>
							</div>
						) : null}
						{data.consent ? (
							<div>
								<p className="text-xs text-muted-foreground">Consent</p>
								<p>{data.consent}</p>
							</div>
						) : null}
						{data.trackingLink ? (
							<div className="pt-2">
								<Link
									href={data.trackingLink}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
								>
									Track ride
									<ExternalLink className="h-3.5 w-3.5" />
								</Link>
							</div>
						) : null}
					</CardContent>
				</Card>
			</div>

			{policies ? (
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Policies</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{policies.waitingTime ? (
							<div>
								<p className="text-xs font-medium uppercase text-muted-foreground">
									Waiting
								</p>
								<p>{policies.waitingTime}</p>
							</div>
						) : null}
						{policies.meetAndGreet ? (
							<div>
								<p className="text-xs font-medium uppercase text-muted-foreground">
									Meet & greet
								</p>
								<p>
									{policies.meetAndGreet.type}: {policies.meetAndGreet.description}
								</p>
							</div>
						) : null}
						{policies.cancellationPolicy &&
						policies.cancellationPolicy.length > 0 ? (
							<div>
								<p className="text-xs font-medium uppercase text-muted-foreground">
									Cancellation
								</p>
								<ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
									{policies.cancellationPolicy.map((c, i) => (
										<li key={i}>
											{c.description}
											{c.refundPercentage != null
												? ` (${c.refundPercentage}% refund)`
												: ""}
										</li>
									))}
								</ul>
							</div>
						) : null}
						{policies.inclusions && policies.inclusions.length > 0 ? (
							<div>
								<p className="text-xs font-medium uppercase text-muted-foreground">
									Inclusions
								</p>
								<ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
									{policies.inclusions.map((line, i) => (
										<li key={i}>{line}</li>
									))}
								</ul>
							</div>
						) : null}
						{policies.amendmentPolicy ? (
							<p className="text-muted-foreground">{policies.amendmentPolicy}</p>
						) : null}
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
