"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Star,
	MapPin,
	Phone,
	Clock,
	CheckCircle,
	Utensils,
	Mail,
	Globe,
	ChevronDown,
	ChevronUp,
	BedDouble,
	Maximize2,
	Users,
	Eye,
	Building2,
	Wifi,
	Coffee,
	Car,
	Dumbbell,
	Shield,
	Info,
	AlertCircle,
} from "lucide-react";
import type { Room } from "@/types/hotelApi";
import type {
	TripjackHotelStaticDetail,
	TripjackHotelRoomType,
	TripjackHotelPricingOption,
} from "@/types/tripjack";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Pick the best (largest) image href from a links object */
function getBestImageUrl(
	links: Record<string, { href: string }>,
): string | null {
	const preferred = [
		"1000px",
		"800px",
		"640px",
		"500px",
		"350px",
		"200px",
		"100px",
		"70px",
	];
	for (const k of preferred) {
		if (links[k]?.href) return links[k].href;
	}
	const vals = Object.values(links);
	return vals[vals.length - 1]?.href || vals[0]?.href || null;
}

/** Pick a thumbnail href from a links object */
function getThumbnailUrl(
	links: Record<string, { href: string }>,
): string | null {
	const preferred = ["200px", "350px", "100px", "70px", "500px", "640px"];
	for (const k of preferred) {
		if (links[k]?.href) return links[k].href;
	}
	const vals = Object.values(links);
	return vals[0]?.href || null;
}

/** Strip HTML tags and decode common entities */
function stripHtml(html: string): string {
	if (!html) return "";
	return html
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n\n")
		.replace(/<\/li>/gi, "\n")
		.replace(/<li>/gi, "• ")
		.replace(/<[^>]*>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/**
 * TripJack description values are sometimes JSON-stringified
 * (e.g. `{"1":"paragraph one","2":"paragraph two"}`).
 * This helper unwraps them to a clean plain-text string.
 */
function parseDescriptionText(str?: string): string {
	if (!str) return "";
	const trimmed = str.trimStart();
	if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
		try {
			const parsed: unknown = JSON.parse(str);
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				return Object.values(parsed as Record<string, unknown>)
					.filter(Boolean)
					.map((v) => stripHtml(String(v)))
					.filter(Boolean)
					.join("\n\n");
			}
			if (Array.isArray(parsed)) {
				return parsed
					.filter(Boolean)
					.map((v) => stripHtml(String(v)))
					.join("\n\n");
			}
		} catch {
			// fall through
		}
	}
	return stripHtml(str);
}

/** Format a price amount with an appropriate currency prefix */
function fmtPrice(amount: number, currency?: string): string {
	const symbols: Record<string, string> = {
		INR: "₹",
		USD: "$",
		EUR: "€",
		GBP: "£",
		AED: "AED ",
		SGD: "S$",
		AUD: "A$",
	};
	const sym = currency
		? (symbols[currency.toUpperCase()] ?? `${currency} `)
		: "₹";
	return `${sym}${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Return a contextual icon for an amenity name */
function amenityIcon(name: string) {
	const n = name.toLowerCase();
	if (n.includes("wifi") || n.includes("internet"))
		return <Wifi className="w-4 h-4" />;
	if (n.includes("restaurant") || n.includes("dining") || n.includes("food"))
		return <Utensils className="w-4 h-4" />;
	if (n.includes("parking") || n.includes("car"))
		return <Car className="w-4 h-4" />;
	if (n.includes("gym") || n.includes("fitness") || n.includes("pool"))
		return <Dumbbell className="w-4 h-4" />;
	if (n.includes("coffee") || n.includes("breakfast"))
		return <Coffee className="w-4 h-4" />;
	return <CheckCircle className="w-4 h-4" />;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRating({ rating }: { rating?: string | null }) {
	if (!rating) return null;
	const stars = parseFloat(rating);
	if (!stars || stars <= 0) return null;
	const full = Math.floor(stars);
	return (
		<div className="flex items-center gap-1">
			{Array.from({ length: full }).map((_, i) => (
				<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
			))}
			{stars % 1 >= 0.5 && (
				<Star className="w-5 h-5 fill-yellow-200 text-yellow-400" />
			)}
			<span className="ml-1 text-sm font-medium text-gray-600">
				{rating} stars
			</span>
		</div>
	);
}

function HotelMapEmbed({
	lat,
	lng,
	address,
}: {
	lat: number;
	lng: number;
	address?: string;
}) {
	const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
	if (apiKey) {
		return (
			<iframe
				width="100%"
				height="100%"
				style={{ border: 0 }}
				src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=15`}
				allowFullScreen
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
				title="Hotel location map"
			/>
		);
	}
	const url = address
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
		: `https://www.google.com/maps?q=${lat},${lng}`;
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			className="flex flex-col items-center justify-center h-full min-h-[12rem] bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl"
		>
			<MapPin className="w-12 h-12 mx-auto mb-2 text-gray-500" />
			<p className="text-sm text-gray-700 font-medium">View on Google Maps</p>
		</a>
	);
}

function DescSection({
	title,
	text,
	icon,
}: {
	title: string;
	text?: string;
	icon?: React.ReactNode;
}) {
	const parsed = parseDescriptionText(text);
	if (!parsed) return null;
	return (
		<Card className="shadow-sm border-0">
			<CardContent className="p-6">
				<div className="flex items-center gap-2 mb-3">
					{icon}
					<h2 className="text-xl font-bold text-gray-900">{title}</h2>
				</div>
				<p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">
					{parsed}
				</p>
			</CardContent>
		</Card>
	);
}

function PolicyItem({
	title,
	text,
	icon,
}: {
	title: string;
	text: string;
	icon?: React.ReactNode;
}) {
	return (
		<div>
			<h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
				{icon}
				{title}
			</h3>
			<p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
				{text}
			</p>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
	if (!value) return null;
	return (
		<div className="flex gap-2 text-sm">
			<span className="text-gray-400 font-medium min-w-[110px] flex-shrink-0">
				{label}:
			</span>
			<span className="text-gray-700 break-words">{value}</span>
		</div>
	);
}

// ─── Room-type card helper ───────────────────────────────────────────────────

function RoomTypeCard({ room }: { room: TripjackHotelRoomType }) {
	// Sort hero image first
	const sortedRoomImages = [
		...(room.images || []).filter((i) => i.hero_image),
		...(room.images || []).filter((i) => !i.hero_image),
	];
	const primaryImage = sortedRoomImages[0];
	const primaryImageUrl = primaryImage
		? getBestImageUrl(primaryImage.links)
		: null;

	const bedDesc =
		room.bed_config?.description ||
		(() => {
			if (!room.bed_config?.configuration) return undefined;
			return Object.values(room.bed_config.configuration)
				.filter((c) => (c.quantity || 0) > 0)
				.map((c) => `${c.quantity}× ${c.type}${c.size ? ` (${c.size})` : ""}`)
				.join(", ");
		})();

	const maxOcc = room.occupancy?.max_allowed?.total;
	const maxAdults = room.occupancy?.max_allowed?.adults;
	const maxChildren = room.occupancy?.max_allowed?.children;
	const roomAmenities = room.amenities
		? Object.values(room.amenities).map((a) => a.name)
		: [];
	const views = room.views ? Object.values(room.views).map((v) => v.name) : [];
	const overview = parseDescriptionText(room.descriptions?.overview);

	return (
		<div className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
			{primaryImageUrl && (
				<div className="relative h-52 w-full bg-gray-200">
					<Image
						src={primaryImageUrl}
						alt={primaryImage?.caption || room.name}
						fill
						unoptimized
						className="object-cover"
						loading="lazy"
						onError={(e) => {
							e.currentTarget.style.display = "none";
						}}
					/>
					{primaryImage?.caption && (
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
							<p className="text-white text-xs">{primaryImage.caption}</p>
						</div>
					)}
				</div>
			)}

			<div className="p-5">
				{/* Name + inventory badges */}
				<div className="flex items-start justify-between gap-3 mb-3">
					<h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
					<div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
						{room.room_count != null && room.room_count > 0 && (
							<span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">
								{room.room_count} units
							</span>
						)}
						{room.room_inventory && (
							<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
								{room.room_inventory} inventory
							</span>
						)}
					</div>
				</div>

				{/* Quick facts row */}
				<div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
					{bedDesc && (
						<span className="flex items-center gap-1.5">
							<BedDouble className="w-4 h-4 text-gray-400" />
							{bedDesc}
						</span>
					)}
					{room.living_room_count != null && room.living_room_count > 0 && (
						<span className="flex items-center gap-1.5">
							<Building2 className="w-4 h-4 text-gray-400" />
							{room.living_room_count} living area
							{room.living_room_count !== 1 ? "s" : ""}
						</span>
					)}
					{room.bed_config?.bedroom_count != null &&
						room.bed_config.bedroom_count > 0 && (
							<span className="flex items-center gap-1.5">
								<BedDouble className="w-4 h-4 text-gray-400" />
								{room.bed_config.bedroom_count} bedroom
								{room.bed_config.bedroom_count !== 1 ? "s" : ""}
							</span>
						)}
					{room.bed_config?.bed_count != null &&
						room.bed_config.bed_count > 0 && (
							<span className="text-xs text-gray-500">
								({room.bed_config.bed_count} bed
								{room.bed_config.bed_count !== 1 ? "s" : ""} total)
							</span>
						)}
					{(room.area?.square_feet || room.area?.square_meters) && (
						<span className="flex items-center gap-1.5">
							<Maximize2 className="w-4 h-4 text-gray-400" />
							{room.area?.square_feet ? `${room.area.square_feet} sq ft` : ""}
							{room.area?.square_feet && room.area?.square_meters ? " / " : ""}
							{room.area?.square_meters ? `${room.area.square_meters} m²` : ""}
						</span>
					)}
					{maxOcc && maxOcc > 0 && (
						<span className="flex items-center gap-1.5">
							<Users className="w-4 h-4 text-gray-400" />
							Max {maxOcc} guests
							{(maxAdults || maxChildren) && (
								<span className="text-xs text-gray-400 ml-1">
									(
									{[
										maxAdults ? `${maxAdults} adults` : null,
										maxChildren ? `${maxChildren} children` : null,
									]
										.filter(Boolean)
										.join(", ")}
									)
								</span>
							)}
						</span>
					)}
				</div>

				{/* Views */}
				{views.length > 0 && (
					<div className="flex flex-wrap gap-2 mb-3">
						{views.map((v, i) => (
							<span
								key={i}
								className="flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded-full"
							>
								<Eye className="w-3 h-3" />
								{v}
							</span>
						))}
					</div>
				)}

				{/* Overview */}
				{overview && (
					<p className="text-sm text-gray-600 mb-3 leading-relaxed">
						{overview}
					</p>
				)}

				{/* Room amenities */}
				{roomAmenities.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{roomAmenities.slice(0, 10).map((a, i) => (
							<span
								key={i}
								className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
							>
								{a}
							</span>
						))}
						{roomAmenities.length > 10 && (
							<span className="text-xs text-gray-400 px-1 py-1">
								+{roomAmenities.length - 10} more
							</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface TripjackHotelDetailsUIProps {
	detail: TripjackHotelStaticDetail;
	/** Raw TripJack pricing options — preferred over availableRooms for richer display */
	tjOptions?: TripjackHotelPricingOption[];
	availableRooms: Room[];
	isLoadingRooms: boolean;
	onBookRoom: (room: Room) => void;
	/** bookingCode → Room for BOOK NOW navigation */
	onBookTjOption?: (option: TripjackHotelPricingOption) => void;
	checkIn?: string | null;
	checkOut?: string | null;
}

// ─── TripJack option card (rich pricing display) ────────────────────────────

function formatPenaltyDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString("en-IN", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	} catch {
		return iso;
	}
}

function TripjackOptionCard({
	option,
	index,
	onBook,
}: {
	option: TripjackHotelPricingOption;
	index: number;
	onBook: (opt: TripjackHotelPricingOption) => void;
}) {
	const { pricing, compliance, cancellation, inclusions } = option;
	const hasMfOrMft = (pricing.mf || 0) > 0 || (pricing.mft || 0) > 0;
	const hasDiscount = (pricing.discount || 0) > 0;
	const today = new Date();
	const freeSlab = cancellation.penalties.find(
		(p) => p.amount === 0 && new Date(p.to) > today,
	);
	const freeCancelDeadline = freeSlab ? formatPenaltyDate(freeSlab.to) : null;

	// Unique room names (deduplicated)
	const roomNames = [...new Set(option.roomInfo.map((r) => r.name))];

	return (
		<div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all">
			<div className="flex flex-col lg:flex-row justify-between gap-6">
				{/* ── Left: Room details ── */}
				<div className="flex-1">
					{/* Header row: names + optionType */}
					<div className="flex flex-wrap items-start gap-2 mb-3">
						<h3 className="text-lg font-bold text-gray-900">
							{roomNames.join(" + ") || `Room Option ${index + 1}`}
						</h3>
						<span className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
							{option.optionType}
						</span>
					</div>

					{/* All room slots */}
					{option.roomInfo.length > 1 && (
						<div className="text-xs text-gray-500 mb-3 space-y-1">
							{option.roomInfo.map((r, i) => (
								<div key={i}>
									<span className="font-medium">Room {i + 1}:</span> {r.name}
								</div>
							))}
						</div>
					)}

					{/* Meal basis */}
					{option.mealBasis && (
						<div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-3">
							<Utensils className="w-4 h-4" />
							{option.mealBasis}
						</div>
					)}

					{/* Inclusions */}
					{inclusions.length > 0 && (
						<div className="space-y-1 mb-3">
							{inclusions.map((inc, i) => (
								<div
									key={i}
									className="flex items-center gap-2 text-sm text-gray-700"
								>
									<CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
									{inc}
								</div>
							))}
						</div>
					)}

					{/* Booking notes */}
					{option.bookingNotes && (
						<div className="text-xs text-gray-500 italic bg-gray-50 border-l-2 border-gray-300 pl-3 py-1.5 mb-3 rounded-r whitespace-pre-line">
							{option.bookingNotes}
						</div>
					)}

					{/* Compliance badges */}
					<div className="flex flex-wrap gap-2 mb-3">
						<span
							className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
								option.commercial.type === "COMMISSIONABLE"
									? "text-teal-700 bg-teal-50 border-teal-200"
									: "text-gray-500 bg-gray-50 border-gray-200"
							}`}
						>
							{option.commercial.type === "COMMISSIONABLE"
								? "Commissionable"
								: "Net Rate"}
						</span>
						{cancellation.isRefundable ? (
							<span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
								&#10003; Free Cancellation
								{freeCancelDeadline && (
									<span className="ml-1 font-normal">
										until {freeCancelDeadline}
									</span>
								)}
							</span>
						) : (
							<span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
								Non-Refundable
							</span>
						)}
						{compliance.panRequired && (
							<span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
								PAN Required
							</span>
						)}
						{compliance.passportRequired && (
							<span className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
								Passport Required
							</span>
						)}
						{compliance.gstType !== "NA" && (
							<span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
								GST: {compliance.gstType}
							</span>
						)}
					</div>

					{/* Cancellation penalties */}
					{cancellation.penalties.length > 0 && (
						<div className="mt-2">
							<p className="text-xs font-semibold text-gray-600 mb-1">
								Cancellation policy:
							</p>
							<div className="space-y-1">
								{cancellation.penalties.map((p, i) => (
									<div
										key={i}
										className={`text-xs px-2.5 py-1.5 rounded flex items-center justify-between gap-3 ${
											p.amount === 0
												? "bg-green-50 text-green-800"
												: "bg-red-50 text-red-800"
										}`}
									>
										<span>
											{formatPenaltyDate(p.from)} – {formatPenaltyDate(p.to)}
										</span>
										<span className="font-semibold">
											{p.amount === 0
												? "Free"
												: fmtPrice(p.amount, pricing.currency)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</div>

				{/* ── Right: Price + Book ── */}
				<div className="lg:border-l lg:pl-6 min-w-[220px] flex flex-col justify-between">
					<div className="mb-4">
						{/* Strikethrough gross price */}
						{pricing.strikethrough &&
							pricing.strikethrough > pricing.totalPrice && (
								<p className="text-sm text-gray-400 line-through text-right">
									{fmtPrice(pricing.strikethrough, pricing.currency)}
								</p>
							)}
						{/* Total */}
						<p className="text-3xl font-bold text-gray-900 text-right">
							{fmtPrice(pricing.totalPrice, pricing.currency)}
						</p>
						{/* Price breakdown */}
						<div className="mt-2 space-y-1 text-right">
							<div className="text-xs text-gray-500 flex justify-between gap-4">
								<span>Base price</span>
								<span>{fmtPrice(pricing.basePrice, pricing.currency)}</span>
							</div>
							{hasDiscount && (
								<div className="text-xs text-green-600 flex justify-between gap-4">
									<span>Discount</span>
									<span>- {fmtPrice(pricing.discount, pricing.currency)}</span>
								</div>
							)}
							<div className="text-xs text-gray-500 flex justify-between gap-4">
								<span>Taxes</span>
								<span>{fmtPrice(pricing.taxes, pricing.currency)}</span>
							</div>
							{hasMfOrMft && (
								<>
									{(pricing.mf || 0) > 0 && (
										<div className="text-xs text-gray-500 flex justify-between gap-4">
											<span>Management Fee</span>
											<span>{fmtPrice(pricing.mf, pricing.currency)}</span>
										</div>
									)}
									{(pricing.mft || 0) > 0 && (
										<div className="text-xs text-gray-500 flex justify-between gap-4">
											<span>Mgmt. Fee Tax</span>
											<span>{fmtPrice(pricing.mft, pricing.currency)}</span>
										</div>
									)}
								</>
							)}
							<div className="border-t pt-1 text-xs font-semibold text-gray-700 flex justify-between gap-4">
								<span>Total</span>
								<span>{fmtPrice(pricing.totalPrice, pricing.currency)}</span>
							</div>
						</div>
					</div>
					<div>
						<Button
							onClick={() => onBook(option)}
							className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-5"
						>
							BOOK NOW
						</Button>
						{cancellation.isRefundable && (
							<p className="text-xs text-green-600 mt-2 font-medium text-center">
								&#10003; Free Cancellation Available
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TripjackHotelDetailsUI({
	detail,
	tjOptions,
	availableRooms,
	isLoadingRooms,
	onBookRoom,
	onBookTjOption,
}: TripjackHotelDetailsUIProps) {
	const [selectedImageIdx, setSelectedImageIdx] = useState(0);
	const [visibleImages, setVisibleImages] = useState(8);
	const [showAllAmenities, setShowAllAmenities] = useState(false);

	// ── Images — hero first ──────────────────────────────────────────────────
	const allImages: { full: string; thumb: string; caption?: string }[] = [
		...(detail.images || []).filter((i) => i.is_hero_image),
		...(detail.images || []).filter((i) => !i.is_hero_image),
	].flatMap((img) => {
		const full = getBestImageUrl(img.links);
		const thumb = getThumbnailUrl(img.links);
		if (!full) return [];
		return [{ full, thumb: thumb || full, caption: img.caption }];
	});

	// ── Amenities ─────────────────────────────────────────────────────────────
	const amenityList = detail.amenities
		? Object.values(detail.amenities)
				.map((a) => a.name)
				.sort()
		: [];

	// ── Descriptions ──────────────────────────────────────────────────────────
	const desc = detail.descriptions || {};
	const knownDescKeys = new Set([
		"default",
		"headline",
		"dining",
		"location",
		"attractions",
		"amenities",
		"rooms",
		"renovations",
		"business_amenities",
		"national_ratings",
	]);
	const extraDescriptions = Object.entries(desc).filter(
		([k, v]) => !knownDescKeys.has(k) && v,
	);

	// ── Policies ──────────────────────────────────────────────────────────────
	const pol = detail.policies || {};
	const cci = pol.checkInCheckOut;
	const policyInstruction = parseDescriptionText(pol.instructions);
	const policySpecial = parseDescriptionText(pol.special_instructions);
	const policyKnow = parseDescriptionText(pol.know_before_you_go);
	const policyMandatory = parseDescriptionText(pol.mandatory_fees);
	const policyOptional = parseDescriptionText(pol.optional_fees);
	const houseRules = pol.houseRules || {};
	const hasPolicies =
		policyInstruction ||
		policySpecial ||
		policyKnow ||
		policyMandatory ||
		policyOptional ||
		Object.keys(houseRules).length > 0;

	// ── Rooms ─────────────────────────────────────────────────────────────────
	const roomTypes: TripjackHotelRoomType[] = detail.rooms
		? (Object.values(detail.rooms) as TripjackHotelRoomType[])
		: [];

	// ── Map ───────────────────────────────────────────────────────────────────
	const coords = detail.locale?.coordinates;
	const address = detail.locale?.address?.fulladdr;

	// ── Chain / brand ─────────────────────────────────────────────────────────
	const chainDisplay = [detail.chain?.brand?.name, detail.chain?.name]
		.filter(Boolean)
		.join(" · ");

	// ─────────────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6">
			{/* Inactive hotel warning */}
			{detail.is_active === false && (
				<div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
					<AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
					<p className="text-sm text-red-700 font-medium">
						This hotel is currently unlisted (inactive) and may not be available
						for booking.
					</p>
				</div>
			)}
			{/* ── Hotel Header ───────────────────────────────────────────────── */}
			<Card className="shadow-lg border-0">
				<CardContent className="p-8">
					<div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
						<div className="flex-1">
							{/* Name */}
							<h1 className="text-4xl font-bold text-gray-900 mb-1">
								{detail.name}
							</h1>

							{/* Property type · chain */}
							{(detail.property_type?.name || chainDisplay) && (
								<p className="text-sm text-gray-500 mb-3">
									{[detail.property_type?.name, chainDisplay]
										.filter(Boolean)
										.join(" · ")}
								</p>
							)}

							{/* Stars + location + property-type badge */}
							<div className="flex flex-wrap items-center gap-3 mb-4">
								{detail.star_rating && (
									<StarRating rating={detail.star_rating} />
								)}
								<div className="flex items-center gap-1.5 text-gray-600">
									<MapPin className="w-4 h-4 text-blue-600" />
									<span className="font-medium text-sm">
										{[
											detail.locale?.address?.city,
											detail.locale?.address?.statename,
											detail.locale?.address?.countryname,
										]
											.filter(Boolean)
											.join(", ")}
									</span>
								</div>
								{detail.locale?.address?.postal_code && (
									<span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
										PIN {detail.locale.address.postal_code}
									</span>
								)}
								{detail.property_type?.name && (
									<span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-medium flex items-center gap-1">
										<Building2 className="w-3 h-3" />
										{detail.property_type.name}
									</span>
								)}
							</div>

							{/* Full address — fallback to line_1/line_2/region if fulladdr absent */}
							{(address ||
								detail.locale?.address?.line_1 ||
								detail.locale?.address?.line_2) && (
								<p className="text-gray-600 text-sm leading-relaxed">
									{address ||
										[
											detail.locale?.address?.line_1,
											detail.locale?.address?.line_2,
											detail.locale?.address?.region,
										]
											.filter(Boolean)
											.join(", ")}
								</p>
							)}
						</div>

						{/* Provider badge */}
						<div className="flex-shrink-0">
							<span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
								TripJack
							</span>
						</div>
					</div>

					{/* Contact & timing grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
						{/* Phone */}
						{detail.locale?.phone && detail.locale.phone.length > 0 && (
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
									<Phone className="w-4 h-4 text-blue-600" />
								</div>
								<div>
									<p className="text-xs text-gray-400">Phone</p>
									<p className="text-sm font-medium text-gray-900">
										{detail.locale.phone[0]}
									</p>
								</div>
							</div>
						)}

						{/* Email */}
						{detail.locale?.email && detail.locale.email.length > 0 && (
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
									<Mail className="w-4 h-4 text-blue-600" />
								</div>
								<div>
									<p className="text-xs text-gray-400">Email</p>
									<a
										href={`mailto:${detail.locale.email[0]}`}
										className="text-sm font-medium text-blue-600 hover:underline truncate block max-w-[180px]"
									>
										{detail.locale.email[0]}
									</a>
								</div>
							</div>
						)}

						{/* Fax */}
						{detail.locale?.fax && detail.locale.fax.length > 0 && (
							<div className="flex items-center gap-3">
								<div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
									<Phone className="w-4 h-4 text-gray-500" />
								</div>
								<div>
									<p className="text-xs text-gray-400">Fax</p>
									<p className="text-sm text-gray-700">
										{detail.locale.fax[0]}
									</p>
								</div>
							</div>
						)}

						{/* Check-in */}
						{cci && (cci.checkin_from || cci.checkin_till) && (
							<div className="flex items-center gap-3">
								<div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
									<Clock className="w-4 h-4 text-green-600" />
								</div>
								<div>
									<p className="text-xs text-gray-400">Check-in</p>
									<p className="text-sm font-medium text-gray-900">
										{[cci.checkin_from, cci.checkin_till]
											.filter(Boolean)
											.join(" – ")}
										{cci.checkin_min_age && (
											<span className="block text-xs text-gray-500">
												Min age: {cci.checkin_min_age}
											</span>
										)}
									</p>
								</div>
							</div>
						)}

						{/* Check-out */}
						{cci && (cci.checkout_from || cci.checkout_till) && (
							<div className="flex items-center gap-3">
								<div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
									<Clock className="w-4 h-4 text-orange-500" />
								</div>
								<div>
									<p className="text-xs text-gray-400">Check-out</p>
									<p className="text-sm font-medium text-gray-900">
										{[cci.checkout_from, cci.checkout_till]
											.filter(Boolean)
											.join(" – ")}
									</p>
								</div>
							</div>
						)}

						{/* Globe / website fallback link */}
						{detail.locale?.address?.city && (
							<div className="flex items-center gap-3">
								<div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
									<Globe className="w-4 h-4 text-purple-600" />
								</div>
								<div>
									<p className="text-xs text-gray-400">City</p>
									<p className="text-sm font-medium text-gray-900">
										{detail.locale.address.city}
										{detail.locale.address.statename
											? `, ${detail.locale.address.statename}`
											: ""}
									</p>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* ── Photo Gallery ──────────────────────────────────────────────── */}
			{allImages.length > 0 && (
				<Card className="shadow-lg border-0">
					<CardContent className="p-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold text-gray-900">Photo Gallery</h2>
							<span className="text-sm text-gray-400">
								{allImages.length} photos
							</span>
						</div>

						{/* Main image + 4 thumbnails */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
							<div className="md:col-span-2">
								<div className="relative w-full h-96 bg-gray-200 rounded-xl overflow-hidden shadow-md">
									<Image
										src={allImages[selectedImageIdx]?.full || allImages[0].full}
										alt={allImages[selectedImageIdx]?.caption || detail.name}
										fill
										unoptimized
										className="object-cover transition-opacity duration-300"
										priority={selectedImageIdx === 0}
										onError={(e) => {
											e.currentTarget.style.display = "none";
										}}
									/>
									{allImages[selectedImageIdx]?.caption && (
										<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
											<p className="text-white text-xs">
												{allImages[selectedImageIdx].caption}
											</p>
										</div>
									)}
								</div>
							</div>

							{allImages.length > 1 && (
								<div className="grid grid-cols-2 gap-2 content-start">
									{allImages.slice(0, 4).map((img, i) => (
										<button
											key={i}
											onClick={() => setSelectedImageIdx(i)}
											className={`relative w-full h-24 bg-gray-200 rounded-lg overflow-hidden border-2 transition-all ${
												selectedImageIdx === i
													? "border-blue-600 ring-2 ring-blue-200"
													: "border-transparent hover:border-blue-300"
											}`}
										>
											<Image
												src={img.thumb}
												alt={img.caption || `Image ${i + 1}`}
												fill
												unoptimized
												className="object-cover"
												loading="lazy"
												onError={(e) => {
													e.currentTarget.style.display = "none";
												}}
											/>
										</button>
									))}
								</div>
							)}
						</div>

						{/* All-images lazy grid */}
						{allImages.length > 5 && (
							<div>
								<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
									{allImages.slice(0, visibleImages).map((img, i) => (
										<button
											key={i}
											onClick={() => setSelectedImageIdx(i)}
											className={`relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
												selectedImageIdx === i
													? "border-blue-600 ring-2 ring-blue-200"
													: "border-gray-200 hover:border-blue-300"
											}`}
										>
											<Image
												src={img.thumb}
												alt={img.caption || `Image ${i + 1}`}
												fill
												unoptimized
												className="object-cover"
												loading="lazy"
												onError={(e) => {
													e.currentTarget.style.display = "none";
												}}
											/>
										</button>
									))}
								</div>
								{visibleImages < allImages.length && (
									<div className="text-center mt-4">
										<Button
											variant="outline"
											onClick={() =>
												setVisibleImages((p) =>
													Math.min(p + 8, allImages.length),
												)
											}
										>
											Load More Photos ({allImages.length - visibleImages}{" "}
											remaining)
										</Button>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* ── Two-column content layout ──────────────────────────────────── */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* ── Main column (2/3) ──────────────────────────────────────── */}
				<div className="lg:col-span-2 space-y-6">
					{/* Available Rooms — prefer raw TripJack options for richer data */}
					{tjOptions && tjOptions.length > 0 ? (
						<Card className="shadow-lg border-0">
							<CardContent className="p-8">
								<h2 className="text-2xl font-bold mb-6 text-gray-900">
									Available Rooms
								</h2>
								<div className="space-y-6">
									{tjOptions.map((opt, i) => (
										<TripjackOptionCard
											key={opt.optionId}
											option={opt}
											index={i}
											onBook={(o) => {
												if (onBookTjOption) {
													onBookTjOption(o);
												} else {
													// fallback: find matching mapped room
													const fallback = availableRooms.find(
														(r) => r.BookingCode === o.optionId,
													);
													if (fallback) onBookRoom(fallback);
												}
											}}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					) : availableRooms.length > 0 ? (
						<Card className="shadow-lg border-0">
							<CardContent className="p-8">
								<h2 className="text-2xl font-bold mb-6 text-gray-900">
									Available Rooms
								</h2>
								<div className="space-y-6">
									{availableRooms.map((room, idx) => {
										const totalPrice = room.TotalFare + room.TotalTax;
										const inclusions = room.Inclusion
											? room.Inclusion.split(",")
											: [];
										return (
											<div
												key={idx}
												className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all"
											>
												<div className="flex flex-col lg:flex-row justify-between gap-6">
													<div className="flex-1">
														<h3 className="text-xl font-bold text-gray-900 mb-3">
															{room.Name?.[0] || `Room Option ${idx + 1}`}
														</h3>
														<div className="space-y-2 mb-4">
															{inclusions.slice(0, 5).map((inc, i) => (
																<div
																	key={i}
																	className="flex items-center gap-2 text-sm text-gray-700"
																>
																	<CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
																	<span>{inc.trim()}</span>
																</div>
															))}
															{inclusions.length > 5 && (
																<p className="text-xs text-gray-500 ml-6">
																	+{inclusions.length - 5} more
																</p>
															)}
															{room.MealType &&
																room.MealType !== "Room_Only" && (
																	<div className="flex items-center gap-2 text-sm font-medium text-blue-600 mt-2">
																		<Utensils className="w-4 h-4" />
																		<span>
																			{room.MealType.replace(/_/g, " ")}
																		</span>
																	</div>
																)}
														</div>
														<div className="flex gap-2 mt-2">
															{room.IsRefundable ? (
																<span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
																	&#10003; Free Cancellation
																</span>
															) : (
																<span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
																	Non-Refundable
																</span>
															)}
														</div>
													</div>
													<div className="lg:border-l lg:pl-6 text-center lg:text-right min-w-[200px] flex flex-col justify-between">
														<div>
															<span className="text-3xl font-bold text-gray-900">
																&#x20B9;{" "}
																{Math.round(totalPrice).toLocaleString("en-IN")}
															</span>
															<p className="text-xs text-gray-500 mt-1 mb-4">
																incl. &#x20B9;{" "}
																{Math.round(room.TotalTax).toLocaleString(
																	"en-IN",
																)}{" "}
																taxes
															</p>
														</div>
														<div>
															<Button
																onClick={() => onBookRoom(room)}
																className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-5"
															>
																BOOK NOW
															</Button>
															{room.IsRefundable && (
																<p className="text-xs text-green-600 mt-2 font-medium">
																	&#10003; Free Cancellation
																</p>
															)}
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					) : null}

					{isLoadingRooms && (
						<Card>
							<CardContent className="p-6">
								<Skeleton className="h-32 w-full" />
							</CardContent>
						</Card>
					)}

					{/* About */}
					{(desc.default || desc.headline) && (
						<Card className="shadow-lg border-0">
							<CardContent className="p-6">
								<h2 className="text-xl font-bold text-gray-900 mb-3">
									About This Hotel
								</h2>
								{desc.headline && (
									<p className="text-sm text-blue-700 font-medium mb-3 leading-relaxed">
										{parseDescriptionText(desc.headline)}
									</p>
								)}
								{desc.default && (
									<p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">
										{parseDescriptionText(desc.default)}
									</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* Dining */}
					<DescSection
						title="Dining"
						text={desc.dining}
						icon={<Utensils className="w-5 h-5 text-orange-500" />}
					/>

					{/* Location / Neighbourhood */}
					<DescSection
						title="The Neighbourhood"
						text={desc.location}
						icon={<MapPin className="w-5 h-5 text-blue-500" />}
					/>

					{/* Attractions */}
					<DescSection
						title="Nearby Attractions"
						text={desc.attractions}
						icon={<MapPin className="w-5 h-5 text-green-500" />}
					/>

					{/* Recreation & Services */}
					<DescSection
						title="Recreation & Services"
						text={desc.amenities}
						icon={<CheckCircle className="w-5 h-5 text-purple-500" />}
					/>

					{/* Room Overview */}
					<DescSection
						title="Room Overview"
						text={desc.rooms}
						icon={<BedDouble className="w-5 h-5 text-blue-500" />}
					/>

					{/* Business Facilities */}
					<DescSection
						title="Business Facilities"
						text={desc.business_amenities}
						icon={<Globe className="w-5 h-5 text-gray-500" />}
					/>

					{/* Renovation Notice */}
					<DescSection
						title="Renovation Notice"
						text={desc.renovations}
						icon={<Info className="w-5 h-5 text-amber-500" />}
					/>

					{/* National Ratings disclosure */}
					<DescSection
						title="Rating Methodology"
						text={desc.national_ratings}
						icon={<Star className="w-5 h-5 text-yellow-500" />}
					/>

					{/* Any extra description keys */}
					{extraDescriptions.map(([key, value]) => (
						<DescSection
							key={key}
							title={key
								.replace(/_/g, " ")
								.replace(/\b\w/g, (c) => c.toUpperCase())}
							text={value}
						/>
					))}

					{/* Hotel Amenities */}
					{amenityList.length > 0 && (
						<Card className="shadow-lg border-0">
							<CardContent className="p-6">
								<h2 className="text-xl font-bold text-gray-900 mb-4">
									Hotel Amenities
								</h2>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									{(showAllAmenities
										? amenityList
										: amenityList.slice(0, 18)
									).map((name, i) => (
										<div
											key={i}
											className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
										>
											<span className="text-green-500 flex-shrink-0">
												{amenityIcon(name)}
											</span>
											<span className="text-sm text-gray-700 font-medium leading-snug">
												{name}
											</span>
										</div>
									))}
								</div>
								{amenityList.length > 18 && (
									<button
										onClick={() => setShowAllAmenities((p) => !p)}
										className="mt-4 text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
									>
										{showAllAmenities ? (
											<>
												<ChevronUp className="w-4 h-4" /> Show less
											</>
										) : (
											<>
												<ChevronDown className="w-4 h-4" /> Show all{" "}
												{amenityList.length} amenities
											</>
										)}
									</button>
								)}
							</CardContent>
						</Card>
					)}

					{/* Room Types */}
					{roomTypes.length > 0 && (
						<Card className="shadow-lg border-0">
							<CardContent className="p-6">
								<h2 className="text-xl font-bold text-gray-900 mb-5">
									Room Types
								</h2>
								<div className="space-y-6">
									{roomTypes.map((room) => (
										<RoomTypeCard key={room.id} room={room} />
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Policies */}
					{hasPolicies && (
						<Card className="shadow-lg border-0">
							<CardContent className="p-6">
								<div className="flex items-center gap-2 mb-5">
									<Shield className="w-6 h-6 text-blue-600" />
									<h2 className="text-xl font-bold text-gray-900">
										Policies & Important Information
									</h2>
								</div>
								<div className="space-y-5">
									{policyInstruction && (
										<PolicyItem
											title="Property Instructions"
											text={policyInstruction}
											icon={<Info className="w-4 h-4 text-blue-500" />}
										/>
									)}
									{policySpecial && (
										<PolicyItem
											title="Special Instructions"
											text={policySpecial}
											icon={<AlertCircle className="w-4 h-4 text-orange-500" />}
										/>
									)}
									{policyKnow && (
										<PolicyItem
											title="Know Before You Go"
											text={policyKnow}
											icon={<Info className="w-4 h-4 text-green-500" />}
										/>
									)}
									{policyMandatory && (
										<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
											<h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
												<AlertCircle className="w-4 h-4" />
												Mandatory Fees (charged at property)
											</h3>
											<p className="text-sm text-amber-900 whitespace-pre-line leading-relaxed">
												{policyMandatory}
											</p>
										</div>
									)}
									{policyOptional && (
										<PolicyItem title="Optional Fees" text={policyOptional} />
									)}
									{Object.keys(houseRules).length > 0 && (
										<div>
											<h3 className="text-sm font-semibold text-gray-800 mb-3">
												House Rules
											</h3>
											<div className="space-y-2">
												{Object.entries(houseRules).map(([key, value]) => (
													<div
														key={key}
														className="flex gap-3 text-sm p-2.5 bg-gray-50 rounded"
													>
														<span className="font-medium text-gray-600 capitalize min-w-[140px] flex-shrink-0">
															{key.replace(/_/g, " ")}:
														</span>
														<span className="text-gray-700">{value}</span>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* ── Sidebar (1/3) ──────────────────────────────────────────── */}
				<div className="space-y-6">
					{/* Map */}
					{coords && (
						<Card className="shadow-lg border-0">
							<CardContent className="p-5">
								<h2 className="text-lg font-bold mb-3 text-gray-900">
									Location
								</h2>
								<div className="relative w-full h-56 bg-gray-200 rounded-xl overflow-hidden shadow-md mb-3">
									<HotelMapEmbed
										lat={coords.lat}
										lng={coords.long}
										address={address}
									/>
								</div>
								{address && (
									<div className="p-3 bg-gray-50 rounded-lg">
										<p className="text-xs text-gray-700 leading-relaxed">
											{address}
										</p>
										<a
											href={`https://www.google.com/maps?q=${coords.lat},${coords.long}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-xs text-blue-600 hover:underline mt-2 inline-block"
										>
											View on Google Maps &rarr;
										</a>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Hotel Info panel */}
					<Card className="shadow-sm border-0">
						<CardContent className="p-5">
							<h2 className="text-lg font-bold mb-4 text-gray-900">
								Hotel Info
							</h2>
							<div className="space-y-3">
								<InfoRow label="Hotel ID" value={detail.tjHotelId} />
								{detail.unicaId && (
									<InfoRow label="Unica ID" value={detail.unicaId} />
								)}
								{detail.property_type?.name && (
									<InfoRow
										label="Property Type"
										value={detail.property_type.name}
									/>
								)}
								{detail.chain?.name && (
									<InfoRow label="Chain" value={detail.chain.name} />
								)}
								{detail.chain?.brand?.name && (
									<InfoRow label="Brand" value={detail.chain.brand.name} />
								)}
								{detail.locale?.address?.statename && (
									<InfoRow
										label="State"
										value={detail.locale.address.statename}
									/>
								)}
								{detail.locale?.address?.citycode && (
									<InfoRow
										label="City Code"
										value={detail.locale.address.citycode}
									/>
								)}
								{detail.locale?.address?.regioncode && (
									<InfoRow
										label="Region Code"
										value={detail.locale.address.regioncode}
									/>
								)}
								{detail.locale?.address?.countryname && (
									<InfoRow
										label="Country"
										value={detail.locale.address.countryname}
									/>
								)}
								{detail.locale?.address?.countrycode && (
									<InfoRow
										label="Country Code"
										value={detail.locale.address.countrycode}
									/>
								)}
								{detail.locale?.address?.postal_code && (
									<InfoRow
										label="Postal Code"
										value={detail.locale.address.postal_code}
									/>
								)}
								{detail.star_rating && (
									<InfoRow label="Star Rating" value={detail.star_rating} />
								)}
							</div>
						</CardContent>
					</Card>

					{/* Additional phone numbers */}
					{detail.locale?.phone && detail.locale.phone.length > 1 && (
						<Card className="shadow-sm border-0">
							<CardContent className="p-5">
								<h2 className="text-base font-bold mb-3 text-gray-900">
									Contact Numbers
								</h2>
								<div className="space-y-2">
									{detail.locale.phone.map((ph, i) => (
										<div key={i} className="flex items-center gap-2 text-sm">
											<Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
											<span className="text-gray-700">{ph}</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
