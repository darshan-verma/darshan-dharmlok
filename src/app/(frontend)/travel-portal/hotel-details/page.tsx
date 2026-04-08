"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
	ArrowLeft,
	Utensils,
	Mail,
	Globe,
	ChevronDown,
	ChevronUp,
	BedDouble,
	Maximize2,
	Users,
	Eye,
	Timer,
	AlertCircle,
} from "lucide-react";
import type { Room } from "@/types/hotelApi";
import { captureAndSendSnapshot } from "@/lib/audit/snapshotClient";
import { TripjackHotelDetailsUI } from "@/components/travel-portal/TripjackHotelDetailsUI";
import type {
	TripjackHotelStaticDetail,
	TripjackHotelPricingOption,
} from "@/types/tripjack";
import { TRIPJACK_HOTEL_PRICING_SESSION_KEY } from "@/lib/tripjackPricingNormalize";
import { useSearchSession } from "@/hooks/useSearchSession";

// Hotel Map Component — embeds Google Maps when API key is set (requires Maps Embed API enabled in Cloud Console)
function HotelMap({
	latitude,
	longitude,
	address,
}: {
	latitude: string;
	longitude: string;
	address: string;
}) {
	const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

	useEffect(() => {
		if (!apiKey && process.env.NODE_ENV === "development") {
			console.warn(
				"⚠️ Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and enable Maps Embed API: https://console.cloud.google.com/apis/library/maps-embed-backend.googleapis.com",
			);
		}
	}, [apiKey]);

	if (apiKey) {
		// Exact location: use coordinates so the map centers on the hotel
		const query = `${latitude},${longitude}`;
		return (
			<iframe
				width="100%"
				height="100%"
				style={{ border: 0 }}
				src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}&zoom=15`}
				allowFullScreen
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
				title="Hotel location map"
			/>
		);
	}

	const mapsUrl = address
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
		: `https://www.google.com/maps?q=${latitude},${longitude}`;
	return (
		<a
			href={mapsUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="flex flex-col items-center justify-center h-full min-h-[12rem] bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl"
		>
			<MapPin className="w-12 h-12 mx-auto mb-2 text-gray-500" />
			<p className="text-sm text-gray-700 font-medium mb-1">
				View location on Google Maps
			</p>
			<p className="text-xs text-gray-500 text-center px-4">
				Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and enable Maps Embed API for
				embedded map
			</p>
		</a>
	);
}

function HotelDetailsContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const hotelCode = searchParams.get("hotelCode");
	const source = searchParams.get("source");
	const isTripjack = source === "TRIPJACK";

	// Raw TripJack static detail — used by the dedicated TripJack UI
	const [tjDetail, setTjDetail] = useState<TripjackHotelStaticDetail | null>(
		null,
	);
	const [tjStaticWarning, setTjStaticWarning] = useState<string | null>(null);

	const [hotelDetails, setHotelDetails] = useState<{
		// Core
		HotelName?: string;
		Chain?: string;
		PropertyType?: string;
		HotelRating?: string | number;
		// Location
		CityName?: string;
		CountryName?: string;
		Address?: string;
		PinCode?: string;
		// Contact
		PhoneNumber?: string;
		Fax?: string;
		Email?: string;
		HotelWebsiteUrl?: string;
		FaxNumber?: string;
		// Check-in / Check-out
		CheckInTime?: string;
		CheckInTill?: string;
		CheckOutFrom?: string;
		CheckOutTime?: string;
		CheckInMinAge?: string;
		// Descriptions
		Headline?: string;
		Description?: string;
		DescriptionDining?: string;
		DescriptionLocation?: string;
		DescriptionAttractions?: string;
		DescriptionAmenities?: string;
		DescriptionRooms?: string;
		DescriptionRenovations?: string;
		DescriptionBusinessAmenities?: string;
		// Policies
		Instructions?: string;
		SpecialInstructions?: string;
		KnowBeforeYouGo?: string;
		MandatoryFeesText?: string;
		OptionalFeesText?: string;
		HouseRules?: Record<string, string>;
		// Media & Facilities
		Images?: string | string[];
		HotelFacilities?: string | string[];
		// TBO-style Attractions
		Attractions?:
			| string
			| Array<{ key: string; value: string }>
			| Record<string, string>;
		// Map
		Map?:
			| string
			| {
					Latitude?: string;
					Longitude?: string;
					latitude?: string;
					longitude?: string;
			  };
		// Room types (static info)
		HotelRooms?: Array<{
			RoomTypeName?: string;
			RoomTypeCode?: string;
			RoomDescription?: string;
			Amenities?: string[];
			BedConfig?: string;
			AreaSqFt?: number;
			AreaSqM?: number;
			Views?: string[];
			MaxOccupancy?: number;
			RoomImages?: string[];
		}>;
		// TBO fees
		HotelFees?: {
			Mandatory?: Array<{ Name?: string; Amount?: number }>;
			Optional?: Array<{ Name?: string; Amount?: number }>;
		};
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
	const [tjRawOptions, setTjRawOptions] = useState<
		TripjackHotelPricingOption[]
	>([]);
	const [tjReviewHash, setTjReviewHash] = useState<string>("");
	const [tjCorrelationId, setTjCorrelationId] = useState<string>("");
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
	const [isAttractionsOpen, setIsAttractionsOpen] = useState(false);
	const [visibleImages, setVisibleImages] = useState(8); // Show first 8 images initially

	// Search session countdown (TripJack sessions last ~15 min)
	const {
		isExpired,
		isWarning,
		formattedTime,
		startSession,
		isActive: sessionActive,
	} = useSearchSession();

	// Get search parameters
	const checkIn = searchParams.get("checkIn");
	const checkOut = searchParams.get("checkOut");
	const rooms = searchParams.get("rooms");
	const adults = searchParams.get("adults");
	const children = searchParams.get("children");

	useEffect(() => {
		if (!hotelCode) {
			setError("Hotel code is required");
			setIsLoading(false);
			return;
		}

		fetchHotelDetails();

		// Fetch available rooms if search parameters are provided
		if (checkIn && checkOut && rooms && adults) {
			fetchAvailableRooms();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hotelCode, checkIn, checkOut, rooms, adults, children]);

	const fetchHotelDetails = async () => {
		if (!hotelCode) return;

		setIsLoading(true);
		setError(null);

		try {
			if (isTripjack) {
				setTjStaticWarning(null);
				// ── TripJack static detail ──────────────────────────────────────────
				const response = await fetch(
					"/api/travel/tripjack-hotel/static-detail",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ hid: hotelCode }),
					},
				);
				const result = await response.json();
				if (!result.success || !result.data) {
					// Graceful fallback — static detail not available for this hotel
					// (test API keys often have limited hotel coverage).
					// Show minimal shell so rooms can still be fetched and booked.
					const fallbackName =
						searchParams.get("hotelName") ||
						searchParams.get("name") ||
						`Hotel ${hotelCode}`;
					const fallbackCity =
						searchParams.get("location") || searchParams.get("city") || "";
					console.warn(
						`TripJack static detail unavailable for ${hotelCode}:`,
						result.error,
					);
					setTjStaticWarning(
						`Static hotel details are unavailable for this property (${hotelCode}). Showing live room options only.`,
					);
					setTjDetail({
						tjHotelId: hotelCode || "",
						name: fallbackName,
						is_active: true,
						...(fallbackCity
							? { locale: { address: { city: fallbackCity } } }
							: {}),
					});
					setHotelDetails({
						HotelName: fallbackName,
						CityName: fallbackCity,
						HotelRating: searchParams.get("rating") || undefined,
					});
					return;
				}
				const raw = result.data as TripjackHotelStaticDetail;
				const d: TripjackHotelStaticDetail = {
					...raw,
					tjHotelId: raw.tjHotelId?.trim() || hotelCode || "",
					name:
						raw.name?.trim() ||
						searchParams.get("hotelName") ||
						searchParams.get("name") ||
						`Hotel ${hotelCode}`,
				};

				if (result.meta?.incompleteStatic) {
					setTjStaticWarning(
						`TripJack returned limited static content for ${hotelCode}. Description, photos, or address may be incomplete; live room options are still available.`,
					);
				}

				setTjDetail(d);

				// Parse policy strings (may be nested JSON strings or plain text)
				const parseJsonStringValues = (str?: string): string | undefined => {
					if (!str) return undefined;
					try {
						const obj: Record<string, string> = JSON.parse(str);
						return Object.values(obj).filter(Boolean).join("\n\n");
					} catch {
						return str;
					}
				};

				// Map TripJack static detail to the UI shape
				const images: string[] = [];
				if (Array.isArray(d.images)) {
					for (const img of d.images) {
						const sizes = img.links
							? (Object.values(img.links) as { href: string }[])
							: [];
						const href = (sizes[sizes.length - 1] ?? sizes[0])?.href;
						if (href) images.push(href);
					}
				}
				setHotelDetails({
					// Core
					HotelName: d.name,
					Chain: d.chain
						? [d.chain.name, d.chain.brand?.name].filter(Boolean).join(" › ")
						: undefined,
					PropertyType: d.property_type?.name,
					HotelRating: d.star_rating,
					// Location
					CityName: d.locale?.address?.city,
					CountryName: d.locale?.address?.countryname,
					Address: d.locale?.address?.fulladdr,
					PinCode: d.locale?.address?.postal_code,
					// Contact
					PhoneNumber: d.locale?.phone?.[0],
					Fax: d.locale?.fax?.[0],
					Email: d.locale?.email?.[0],
					// Check-in / Check-out
					CheckInTime: d.policies?.checkInCheckOut?.checkin_from,
					CheckInTill: d.policies?.checkInCheckOut?.checkin_till,
					CheckOutFrom: d.policies?.checkInCheckOut?.checkout_from,
					CheckOutTime: d.policies?.checkInCheckOut?.checkout_till,
					CheckInMinAge: d.policies?.checkInCheckOut?.checkin_min_age,
					// Descriptions — all direct top-level keys in d.descriptions
					Headline: d.descriptions?.headline || undefined,
					Description: d.descriptions?.default || undefined,
					DescriptionDining: d.descriptions?.dining || undefined,
					DescriptionLocation: d.descriptions?.location || undefined,
					DescriptionAttractions: d.descriptions?.attractions || undefined,
					DescriptionAmenities: d.descriptions?.amenities || undefined,
					DescriptionRooms: d.descriptions?.rooms || undefined,
					DescriptionRenovations: d.descriptions?.renovations || undefined,
					DescriptionBusinessAmenities:
						d.descriptions?.business_amenities || undefined,
					// Policies — each is also a nested JSON string
					Instructions: parseJsonStringValues(d.policies?.instructions),
					SpecialInstructions: parseJsonStringValues(
						d.policies?.special_instructions,
					),
					KnowBeforeYouGo: parseJsonStringValues(
						d.policies?.know_before_you_go,
					),
					MandatoryFeesText: parseJsonStringValues(d.policies?.mandatory_fees),
					OptionalFeesText: parseJsonStringValues(d.policies?.optional_fees),
					HouseRules: d.policies?.houseRules,
					// Media & Facilities
					Images: images,
					HotelFacilities: d.amenities
						? Object.values(
								d.amenities as Record<string, { name: string }>,
							).map((a) => a.name)
						: [],
					Map: d.locale?.coordinates
						? {
								Latitude: String(d.locale.coordinates.lat),
								Longitude: String(d.locale.coordinates.long),
							}
						: undefined,
					// Room types — keyed dict; r.name is the display name, r.room_inventory is the count
					HotelRooms: d.rooms
						? Object.values(
								d.rooms as Record<
									string,
									{
										name?: string;
										room_inventory?: string;
										descriptions?: { overview?: string };
										amenities?: Record<string, { name: string }>;
										bed_config?: {
											description?: string;
											configuration?: Record<
												string,
												{ type?: string; quantity?: number }
											>;
										};
										area?: { square_feet?: number; square_meters?: number };
										views?: Record<string, { name: string }>;
										occupancy?: { max_allowed?: { total?: number } };
										images?: Array<{
											links: Record<string, { href: string }>;
										}>;
									}
								>,
							).map((r) => {
								const roomImages: string[] = [];
								if (Array.isArray(r.images)) {
									for (const img of r.images) {
										const sizes = img.links
											? (Object.values(img.links) as { href: string }[])
											: [];
										const href = (sizes[sizes.length - 1] ?? sizes[0])?.href;
										if (href) roomImages.push(href);
									}
								}
								const maxOccupancy = r.occupancy?.max_allowed?.total;
								// Use API's human-readable bed description; fall back to building from config
								let bedConfigStr = r.bed_config?.description;
								if (!bedConfigStr && r.bed_config?.configuration) {
									const parts = Object.values(r.bed_config.configuration)
										.filter((c) => (c.quantity ?? 0) > 0)
										.map((c) => `${c.quantity} ${c.type}`);
									bedConfigStr =
										parts.length > 0 ? parts.join(", ") : undefined;
								}
								return {
									RoomTypeName: r.name,
									RoomDescription: r.descriptions?.overview,
									Amenities: r.amenities
										? Object.values(r.amenities).map((a) => a.name)
										: [],
									BedConfig: bedConfigStr,
									AreaSqFt: r.area?.square_feet,
									AreaSqM: r.area?.square_meters,
									Views: r.views
										? Object.values(r.views).map((v) => v.name)
										: [],
									MaxOccupancy:
										maxOccupancy && maxOccupancy > 0 ? maxOccupancy : undefined,
									RoomImages: roomImages,
								};
							})
						: [],
				});
			} else {
				// ── TBO hotel details ────────────────────────────────────────────────
				const response = await fetch(
					`/api/travel/hotel/details?hotelCode=${hotelCode}&language=EN&isRoomDetailRequired=true`,
				);
				const result = await response.json();

				if (!result.success) {
					setError(result.error || "Failed to fetch hotel details");
					return;
				}

				if (result.data?.HotelDetails) {
					let hotelDetails = result.data.HotelDetails;
					if (Array.isArray(hotelDetails) && hotelDetails.length > 0) {
						hotelDetails = hotelDetails[0];
					}
					setHotelDetails(hotelDetails);
				} else {
					setError("Hotel details not found");
				}
			}
		} catch (err) {
			console.error("Error fetching hotel details:", err);
			setError(
				err instanceof Error
					? err.message
					: "An error occurred while fetching hotel details",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchAvailableRooms = async () => {
		if (!hotelCode || !checkIn || !checkOut || !rooms || !adults) return;

		setIsLoadingRooms(true);

		try {
			const numRooms = parseInt(rooms);
			const numAdults = parseInt(adults);
			const numChildren = parseInt(children || "0");
			const adultsPerRoom = Math.floor(numAdults / numRooms);
			const childrenPerRoom = Math.floor(numChildren / numRooms);

			if (isTripjack) {
				// ── TripJack pricing (dynamic detail) ───────────────────────────────
				const tjRooms = Array(numRooms)
					.fill(null)
					.map(() => ({
						adults: adultsPerRoom || 1,
						...(childrenPerRoom > 0 && {
							children: childrenPerRoom,
							childAge: Array(childrenPerRoom).fill(5),
						}),
					}));

				const correlationFromUrl = searchParams.get("correlationId");
				const pricingCorrelation =
					tjCorrelationId ||
					correlationFromUrl ||
					(typeof crypto !== "undefined" && crypto.randomUUID
						? crypto.randomUUID()
						: `tj-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);

				const response = await fetch("/api/travel/tripjack-hotel/pricing", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						hid: hotelCode,
						checkIn,
						checkOut,
						rooms: tjRooms,
						currency: "INR",
						nationality: "106",
						correlationId: pricingCorrelation,
					}),
				});

				if (response.ok) {
					const result = await response.json();
					if (result.status?.success && Array.isArray(result.options)) {
						// Map TripJack options to the Room shape used by the UI
						const mapped: Room[] = result.options.map(
							(opt: {
								optionId: string;
								roomInfo: { id: string; name: string }[];
								inclusions: string[];
								mealBasis: string;
								bookingNotes?: string;
								pricing: { totalPrice: number; taxes: number };
								cancellation: {
									isRefundable: boolean;
									penalties: { from: string; to: string; amount: number }[];
								};
							}) => ({
								BookingCode: opt.optionId,
								Name: opt.roomInfo.map((r) => r.name),
								TotalFare: opt.pricing.totalPrice,
								TotalTax: opt.pricing.taxes,
								MealType: opt.mealBasis,
								IsRefundable: opt.cancellation.isRefundable,
								Inclusion: opt.inclusions.join(", "),
								RoomPromotion: opt.bookingNotes ? [opt.bookingNotes] : [],
								CancelPolicies: opt.cancellation.penalties.map((p, i) => ({
									Index: String(i),
									FromDate: p.from,
									ChargeType: "Amount" as const,
									CancellationCharge: p.amount,
								})),
								RoomID: opt.roomInfo.map((r) => r.id),
								DayRates: [],
								WithTransfers: false,
								Supplements: [],
							}),
						);
						setAvailableRooms(mapped);
						// also store raw options so the TripJack UI can show rich price details
						setTjRawOptions(result.options as TripjackHotelPricingOption[]);
						// store reviewHash & correlationId — required for the Review → Book flow
						const rhRaw =
							(typeof result.reviewHash === "string" && result.reviewHash) ||
							(typeof (result as { review_hash?: string }).review_hash ===
								"string" &&
								(result as { review_hash?: string }).review_hash) ||
							"";
						if (rhRaw) setTjReviewHash(rhRaw);
						const cidFinal =
							(typeof result.correlationId === "string" &&
								result.correlationId) ||
							(typeof (result as { correlation_id?: string }).correlation_id ===
								"string" &&
								(result as { correlation_id?: string }).correlation_id) ||
							pricingCorrelation;
						setTjCorrelationId(cidFinal);
						if (typeof window !== "undefined" && hotelCode) {
							try {
								sessionStorage.setItem(
									TRIPJACK_HOTEL_PRICING_SESSION_KEY,
									JSON.stringify({
										hid: hotelCode,
										reviewHash: rhRaw,
										correlationId: cidFinal,
										checkIn,
										checkOut,
									}),
								);
							} catch {
								// quota / private mode
							}
						}
						startSession();
						// backfill hotel name from pricing response if static detail returned nothing
						if (result.hotelName && !hotelDetails?.HotelName) {
							setHotelDetails((prev) => ({
								...prev,
								HotelName: result.hotelName as string,
							}));
						}
					}
				}
			} else {
				// ── TBO room search ──────────────────────────────────────────────────
				const paxRooms = Array(numRooms)
					.fill(null)
					.map(() => ({
						adults: adultsPerRoom || 1,
						children: childrenPerRoom,
						childrenAges: Array(childrenPerRoom).fill(5),
					}));

				const response = await fetch("/api/travel/hotel/search", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						checkIn,
						checkOut,
						hotelCodes: hotelCode,
						guestNationality: "IN",
						rooms: paxRooms,
						isDetailedResponse: true,
						filters: {},
					}),
				});

				const result = await response.json();

				if (result.success && result.data?.HotelResult) {
					const hotel = result.data.HotelResult.find(
						(h: { HotelCode: string }) =>
							String(h.HotelCode) === String(hotelCode),
					);
					if (hotel && hotel.Rooms) {
						setAvailableRooms(hotel.Rooms);
					}
				}
			}
		} catch (err) {
			console.error("Error fetching available rooms:", err);
		} finally {
			setIsLoadingRooms(false);
		}
	};

	const handleBookRoom = (room: Room) => {
		// Prepare room data to pass to booking page
		const roomData = {
			bookingCode: room.BookingCode,
			name: room.Name?.[0] || "Room",
			totalFare: room.TotalFare,
			totalTax: room.TotalTax,
			mealType: room.MealType,
			isRefundable: room.IsRefundable,
			inclusion: room.Inclusion,
			roomPromotion: room.RoomPromotion,
			cancelPolicies: room.CancelPolicies,
		};

		// Capture snapshot of hotel room selection
		captureAndSendSnapshot(
			{
				hotelCode: hotelCode || "",
				hotelName: hotelDetails?.HotelName || "",
				room: {
					bookingCode: room.BookingCode,
					name: room.Name?.[0] || "Room",
					totalFare: room.TotalFare,
					totalTax: room.TotalTax,
					mealType: room.MealType,
					isRefundable: room.IsRefundable,
				},
				checkIn: checkIn || "",
				checkOut: checkOut || "",
				rooms: rooms || "",
				adults: adults || "",
				children: children || "0",
			},
			{
				page: "hotel_results",
				user: {},
				booking: {
					type: "hotel",
					searchId: hotelCode || undefined,
					resultIndex: room.BookingCode,
				},
			},
		).catch(() => {
			// Silently fail - don't block user flow
		});

		let reviewHashForNav = tjReviewHash;
		let correlationForNav =
			tjCorrelationId || searchParams.get("correlationId") || "";
		if (isTripjack && typeof window !== "undefined") {
			try {
				const raw = sessionStorage.getItem(TRIPJACK_HOTEL_PRICING_SESSION_KEY);
				if (raw) {
					const o = JSON.parse(raw) as {
						hid?: string;
						reviewHash?: string;
						correlationId?: string;
					};
					if (String(o.hid) === String(hotelCode)) {
						if (!reviewHashForNav.trim() && o.reviewHash)
							reviewHashForNav = String(o.reviewHash);
						if (!correlationForNav.trim() && o.correlationId)
							correlationForNav = String(o.correlationId);
					}
				}
			} catch {
				/* ignore */
			}
		}

		// Navigate to booking page with all necessary data
		const params = new URLSearchParams({
			bookingCode: room.BookingCode,
			hotelCode: hotelCode || "",
			checkIn: checkIn || "",
			checkOut: checkOut || "",
			rooms: rooms || "",
			adults: adults || "",
			children: children || "0",
			roomData: encodeURIComponent(JSON.stringify(roomData)),
			...(isTripjack
				? {
						source: "TRIPJACK",
						...(reviewHashForNav.trim()
							? { reviewHash: reviewHashForNav.trim() }
							: {}),
						...(correlationForNav.trim()
							? { correlationId: correlationForNav.trim() }
							: {}),
					}
				: {}),
		});

		router.push(`/travel-portal/hotel-booking?${params.toString()}`);
	};

	// Parse images from API response
	const parseImages = (imagesData: string | string[] | undefined): string[] => {
		if (!imagesData) return [];

		try {
			if (Array.isArray(imagesData)) {
				return imagesData;
			}
			if (typeof imagesData === "string") {
				// Try parsing as JSON first
				try {
					const parsed = JSON.parse(imagesData);
					if (Array.isArray(parsed)) return parsed;
				} catch {
					// If not JSON, try comma-separated
					const split = imagesData
						.split(",")
						.map((img: string) => img.trim())
						.filter(Boolean);
					if (split.length > 0) return split;
					// If single URL
					if (imagesData.startsWith("http")) return [imagesData];
				}
			}
		} catch (e) {
			console.error("Error parsing images:", e);
		}

		return [];
	};

	// Parse facilities from API response
	const parseFacilities = (
		facilitiesData: string | string[] | undefined,
	): string[] => {
		if (!facilitiesData) return [];

		try {
			if (Array.isArray(facilitiesData)) {
				return facilitiesData;
			}
			if (typeof facilitiesData === "string") {
				// Try parsing as JSON first
				try {
					const parsed = JSON.parse(facilitiesData);
					if (Array.isArray(parsed)) return parsed;
				} catch {
					// If not JSON, try comma-separated
					return facilitiesData
						.split(",")
						.map((f: string) => f.trim())
						.filter(Boolean);
				}
			}
		} catch (e) {
			console.error("Error parsing facilities:", e);
		}

		return [];
	};

	// Parse attractions from API response
	const parseAttractions = (
		attractionsData:
			| string
			| Array<{ key: string; value: string }>
			| Record<string, string>
			| undefined,
	): Array<{ key: string; value: string }> => {
		if (!attractionsData) return [];

		try {
			if (Array.isArray(attractionsData)) {
				return attractionsData;
			}
			// If it's an object with numbered keys (e.g., "1) ", "2) ")
			if (
				typeof attractionsData === "object" &&
				!Array.isArray(attractionsData)
			) {
				return Object.entries(attractionsData)
					.map(([key, value]) => ({
						key: key.trim(),
						value: typeof value === "string" ? value.trim() : String(value),
					}))
					.filter((p) => p.key && p.value);
			}
			if (typeof attractionsData === "string") {
				try {
					const parsed = JSON.parse(attractionsData);
					if (Array.isArray(parsed)) return parsed;
					// If parsed object, convert to array
					if (typeof parsed === "object" && !Array.isArray(parsed)) {
						return Object.entries(parsed)
							.map(([key, value]) => ({
								key: key.trim(),
								value: typeof value === "string" ? value.trim() : String(value),
							}))
							.filter((p) => p.key && p.value);
					}
				} catch {
					// If not JSON, try parsing as key-value pairs
					const pairs = attractionsData.split(",").map((a: string) => {
						const [key, ...valueParts] = a.split(":");
						return {
							key: key?.trim() || "",
							value: valueParts.join(":").trim() || "",
						};
					});
					return pairs.filter((p) => p.key && p.value);
				}
			}
		} catch (e) {
			console.error("Error parsing attractions:", e);
		}

		return [];
	};

	// Helper function to strip HTML tags and decode HTML entities
	const stripHtml = (html: string): string => {
		if (!html) return "";
		// Create a temporary div element
		const tmp = document.createElement("div");
		tmp.innerHTML = html;
		// Get text content and clean up
		let text = tmp.textContent || tmp.innerText || "";
		// Remove extra whitespace
		text = text.replace(/\s+/g, " ").trim();
		return text;
	};

	// Helper function to format description with proper paragraphs
	const formatDescription = (description: string): string => {
		if (!description) return "";
		// Strip HTML
		let text = stripHtml(description);
		// Split by common paragraph markers and clean up
		text = text
			.replace(/<p>/gi, "\n\n")
			.replace(/<\/p>/gi, "")
			.replace(/<br\s*\/?>/gi, "\n")
			.replace(/<strong>/gi, "")
			.replace(/<\/strong>/gi, "")
			.replace(/<ul>/gi, "\n")
			.replace(/<\/ul>/gi, "")
			.replace(/<li>/gi, "• ")
			.replace(/<\/li>/gi, "\n")
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&nbsp;/g, " ");

		// Clean up multiple newlines
		text = text.replace(/\n{3,}/g, "\n\n").trim();
		return text;
	};

	const images = parseImages(hotelDetails?.Images);
	const facilities = parseFacilities(hotelDetails?.HotelFacilities);
	const attractions = parseAttractions(hotelDetails?.Attractions);
	const starRating = hotelDetails?.HotelRating
		? typeof hotelDetails.HotelRating === "number"
			? hotelDetails.HotelRating
			: parseInt(String(hotelDetails.HotelRating))
		: undefined;

	// Load more images when user scrolls or clicks
	const loadMoreImages = () => {
		setVisibleImages((prev) => Math.min(prev + 8, images.length));
	};

	// Parse map coordinates
	let latitude: string | null = null;
	let longitude: string | null = null;
	if (hotelDetails?.Map) {
		try {
			const mapData =
				typeof hotelDetails.Map === "string"
					? JSON.parse(hotelDetails.Map)
					: hotelDetails.Map;
			latitude = mapData?.Latitude || mapData?.latitude || null;
			longitude = mapData?.Longitude || mapData?.longitude || null;
		} catch (_e) {
			// If parsing fails, try extracting from pipe-separated or comma-separated string
			const mapStr =
				typeof hotelDetails.Map === "string" ? hotelDetails.Map : "";
			// Try pipe-separated first (format: "lat|lng")
			if (mapStr.includes("|")) {
				const coords = mapStr.split("|").map((c: string) => c.trim());
				if (coords.length >= 2) {
					latitude = coords[0];
					longitude = coords[1];
				}
			} else {
				// Try comma-separated
				const coords = mapStr.split(",").map((c: string) => c.trim());
				if (coords.length >= 2) {
					latitude = coords[0];
					longitude = coords[1];
				}
			}
		}
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="container mx-auto px-4 py-6">
					<Skeleton className="h-96 w-full mb-6" />
					<Skeleton className="h-64 w-full" />
				</div>
			</div>
		);
	}

	if (error || !hotelDetails) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<Card className="max-w-md">
					<CardContent className="p-6 text-center">
						<p className="text-red-600 mb-4">{error || "Hotel not found"}</p>
						<Button onClick={() => router.back()}>Go Back</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header with Back Button */}
			<div className="bg-white border-b sticky top-0 z-10">
				<div className="container mx-auto px-4 py-4">
					<Button
						variant="ghost"
						onClick={() => router.back()}
						className="mb-4"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Search
					</Button>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6 max-w-7xl">
				{/* Session expired / warning banner */}
				{isExpired && availableRooms.length > 0 && (
					<div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 flex items-center gap-2 text-sm">
						<Timer className="w-4 h-4 flex-shrink-0" />
						<span>
							Your pricing session has expired. Room prices may have changed.{" "}
							<button
								onClick={() => {
									setAvailableRooms([]);
									setTjRawOptions([]);
									fetchAvailableRooms();
								}}
								className="underline font-semibold"
							>
								Refresh prices
							</button>
						</span>
					</div>
				)}
				{sessionActive &&
					!isExpired &&
					isWarning &&
					availableRooms.length > 0 && (
						<div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 flex items-center gap-2 text-sm">
							<Timer className="w-4 h-4 flex-shrink-0" />
							<span>
								Pricing session expires in <strong>{formattedTime}</strong>.
								Book now or refresh for updated prices.
							</span>
						</div>
					)}
				{isTripjack ? (
					<>
						{tjStaticWarning && (
							<div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 flex items-start gap-2 text-sm">
								<AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
								<span>{tjStaticWarning}</span>
							</div>
						)}
						<TripjackHotelDetailsUI
							detail={
								tjDetail || {
									tjHotelId: hotelCode || "",
									// hotelName from pricing response may be available even when static detail failed
									name: hotelDetails?.HotelName || "",
									is_active: true,
									locale: hotelDetails?.CityName
										? { address: { city: hotelDetails.CityName } }
										: undefined,
								}
							}
							tjOptions={tjRawOptions}
							availableRooms={availableRooms}
							isLoadingRooms={isLoadingRooms}
							onBookRoom={handleBookRoom}
							onBookTjOption={(opt) => {
								// Map TripJack option back to Room shape so existing booking flow works
								const room: Room = {
									BookingCode: opt.optionId,
									Name: opt.roomInfo.map((r) => r.name),
									TotalFare: opt.pricing.totalPrice,
									TotalTax: opt.pricing.taxes,
									MealType: opt.mealBasis,
									IsRefundable: opt.cancellation.isRefundable,
									Inclusion: opt.inclusions.join(", "),
									RoomPromotion: opt.bookingNotes ? [opt.bookingNotes] : [],
									CancelPolicies: opt.cancellation.penalties.map((p, i) => ({
										Index: String(i),
										FromDate: p.from,
										ChargeType: "Amount" as const,
										CancellationCharge: p.amount,
									})),
									RoomID: opt.roomInfo.map((r) => r.id),
									DayRates: [],
									WithTransfers: false,
									Supplements: [],
								};
								handleBookRoom(room);
							}}
							checkIn={checkIn}
							checkOut={checkOut}
						/>
					</>
				) : (
					<>
						{/* Hotel Header */}
						<Card className="mb-6 shadow-lg border-0">
							<CardContent className="p-8">
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<h1 className="text-4xl font-bold text-gray-900 mb-1">
											{hotelDetails.HotelName}
										</h1>

										{/* Chain, brand, property type */}
										{(hotelDetails.Chain || hotelDetails.PropertyType) && (
											<p className="text-sm text-gray-500 mb-3">
												{[hotelDetails.PropertyType, hotelDetails.Chain]
													.filter(Boolean)
													.join(" · ")}
											</p>
										)}

										<div className="flex items-center gap-4 mb-4 flex-wrap">
											{starRating && (
												<div className="flex items-center gap-1">
													{Array.from({ length: starRating }).map((_, i) => (
														<Star
															key={i}
															className="w-5 h-5 fill-yellow-400 text-yellow-400"
														/>
													))}
												</div>
											)}
											<div className="flex items-center gap-1 text-gray-600">
												<MapPin className="w-5 h-5 text-blue-600" />
												<span className="font-medium">
													{hotelDetails.CityName}, {hotelDetails.CountryName}
												</span>
											</div>
											{hotelDetails.PinCode && (
												<span className="text-sm text-gray-500">
													PIN: {hotelDetails.PinCode}
												</span>
											)}
										</div>

										{/* Address */}
										{hotelDetails.Address && (
											<p className="text-gray-700 mb-4 text-lg">
												{hotelDetails.Address}
											</p>
										)}
									</div>
								</div>

								{/* Contact & Timing Info */}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
									{hotelDetails.PhoneNumber && (
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-50 rounded-lg">
												<Phone className="w-5 h-5 text-blue-600" />
											</div>
											<div>
												<p className="text-xs text-gray-500">Phone</p>
												<p className="text-sm font-medium text-gray-900">
													{hotelDetails.PhoneNumber}
												</p>
											</div>
										</div>
									)}
									{hotelDetails.Email && (
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-50 rounded-lg">
												<Mail className="w-5 h-5 text-blue-600" />
											</div>
											<div>
												<p className="text-xs text-gray-500">Email</p>
												<a
													href={`mailto:${hotelDetails.Email}`}
													className="text-sm font-medium text-blue-600 hover:underline"
												>
													{hotelDetails.Email}
												</a>
											</div>
										</div>
									)}
									{hotelDetails.HotelWebsiteUrl && (
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-50 rounded-lg">
												<Globe className="w-5 h-5 text-blue-600" />
											</div>
											<div>
												<p className="text-xs text-gray-500">Website</p>
												<a
													href={hotelDetails.HotelWebsiteUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm font-medium text-blue-600 hover:underline"
												>
													Visit Website
												</a>
											</div>
										</div>
									)}
									{(hotelDetails.FaxNumber || hotelDetails.Fax) && (
										<div className="flex items-center gap-3">
											<div className="p-2 bg-blue-50 rounded-lg">
												<Phone className="w-5 h-5 text-blue-600" />
											</div>
											<div>
												<p className="text-xs text-gray-500">Fax</p>
												<p className="text-sm font-medium text-gray-900">
													{hotelDetails.FaxNumber || hotelDetails.Fax}
												</p>
											</div>
										</div>
									)}
									{/* Check-in */}
									{(hotelDetails.CheckInTime || hotelDetails.CheckInTill) && (
										<div className="flex items-center gap-3">
											<div className="p-2 bg-green-50 rounded-lg">
												<Clock className="w-5 h-5 text-green-600" />
											</div>
											<div>
												<p className="text-xs text-gray-500">Check-in</p>
												<p className="text-sm font-medium text-gray-900">
													{[hotelDetails.CheckInTime, hotelDetails.CheckInTill]
														.filter(Boolean)
														.join(" – ")}
													{hotelDetails.CheckInMinAge && (
														<span className="block text-xs text-gray-500">
															Min age: {hotelDetails.CheckInMinAge}
														</span>
													)}
												</p>
											</div>
										</div>
									)}
									{/* Check-out */}
									{(hotelDetails.CheckOutFrom || hotelDetails.CheckOutTime) && (
										<div className="flex items-center gap-3">
											<div className="p-2 bg-green-50 rounded-lg">
												<Clock className="w-5 h-5 text-green-600" />
											</div>
											<div>
												<p className="text-xs text-gray-500">Check-out</p>
												<p className="text-sm font-medium text-gray-900">
													{[
														hotelDetails.CheckOutFrom,
														hotelDetails.CheckOutTime,
													]
														.filter(Boolean)
														.join(" – ")}
												</p>
											</div>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Hotel Images - Lazy Loading Gallery */}
						{images.length > 0 && (
							<Card className="mb-6 shadow-lg border-0">
								<CardContent className="p-6">
									<div className="flex items-center justify-between mb-4">
										<h2 className="text-2xl font-bold text-gray-900">
											Photo Gallery
										</h2>
										<span className="text-sm text-gray-500">
											{images.length} photos
										</span>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
										{/* Main Image */}
										<div className="md:col-span-2">
											<div className="relative w-full h-96 bg-gray-200 rounded-xl overflow-hidden shadow-md">
												<Image
													src={images[selectedImageIndex] || images[0]}
													alt={hotelDetails.HotelName || "Hotel image"}
													fill
													unoptimized
													className="object-cover transition-opacity duration-300"
													priority={selectedImageIndex === 0}
													loading={selectedImageIndex === 0 ? "eager" : "lazy"}
													onError={(e) => {
														e.currentTarget.style.display = "none";
													}}
												/>
											</div>
										</div>
										{/* Thumbnail Grid - Show first 4 */}
										{images.length > 1 && (
											<div className="grid grid-cols-2 gap-2">
												{images.slice(0, 4).map((image, index) => (
													<button
														key={index}
														onClick={() => setSelectedImageIndex(index)}
														className={`relative w-full h-24 bg-gray-200 rounded-lg overflow-hidden border-2 transition-all ${
															selectedImageIndex === index
																? "border-blue-600 ring-2 ring-blue-200"
																: "border-transparent hover:border-blue-300"
														}`}
													>
														<Image
															src={image}
															alt={`Hotel image ${index + 1}`}
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
									{/* All Images Grid - Lazy Load */}
									{images.length > 5 && (
										<div>
											<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
												{images.slice(0, visibleImages).map((image, index) => (
													<button
														key={index}
														onClick={() => setSelectedImageIndex(index)}
														className={`relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
															selectedImageIndex === index
																? "border-blue-600 ring-2 ring-blue-200"
																: "border-gray-200 hover:border-blue-300"
														}`}
													>
														<Image
															src={image}
															alt={`Hotel image ${index + 1}`}
															fill
															unoptimized
															className="object-cover"
															loading={index < 8 ? "lazy" : "lazy"}
															onError={(e) => {
																e.currentTarget.style.display = "none";
															}}
														/>
													</button>
												))}
											</div>
											{visibleImages < images.length && (
												<div className="text-center mt-4">
													<Button
														variant="outline"
														onClick={loadMoreImages}
														className="px-6"
													>
														Load More Photos ({images.length - visibleImages}{" "}
														remaining)
													</Button>
												</div>
											)}
										</div>
									)}
								</CardContent>
							</Card>
						)}

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Main Content */}
							<div className="lg:col-span-2 space-y-6">
								{/* Available Rooms Section */}
								{availableRooms.length > 0 && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<h2 className="text-2xl font-bold mb-6 text-gray-900">
												Available Rooms
											</h2>
											<div className="space-y-6">
												{availableRooms.map((room, index) => {
													const totalPrice = room.TotalFare + room.TotalTax;
													const inclusions = room.Inclusion
														? room.Inclusion.split(",")
														: [];

													return (
														<div
															key={index}
															className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all"
														>
															<div className="flex flex-col lg:flex-row justify-between gap-6">
																{/* Left: Room Details */}
																<div className="flex-1">
																	<h3 className="text-xl font-bold text-gray-900 mb-3">
																		{room.Name?.[0] ||
																			`Room Option ${index + 1}`}
																	</h3>

																	{/* Room Features */}
																	<div className="space-y-2 mb-4">
																		{inclusions
																			.slice(0, 5)
																			.map((inclusion, idx) => (
																				<div
																					key={idx}
																					className="flex items-center gap-2 text-sm text-gray-700"
																				>
																					<CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
																					<span>{inclusion.trim()}</span>
																				</div>
																			))}
																		{inclusions.length > 5 && (
																			<p className="text-xs text-gray-500 ml-6">
																				+{inclusions.length - 5} more amenities
																			</p>
																		)}
																		{room.MealType &&
																			room.MealType !== "Room_Only" && (
																				<div className="flex items-center gap-2 text-sm font-medium text-blue-600 mt-3">
																					<Utensils className="w-4 h-4" />
																					<span>
																						{room.MealType.replace(/_/g, " ")}
																					</span>
																				</div>
																			)}
																	</div>

																	{/* Cancellation Policy */}
																	<div className="flex gap-2 mt-4">
																		{room.IsRefundable ? (
																			<span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
																				✓ Free Cancellation
																			</span>
																		) : (
																			<span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
																				Non-Refundable
																			</span>
																		)}
																	</div>
																</div>

																{/* Right: Pricing & Book Button */}
																<div className="lg:border-l lg:pl-6 text-center lg:text-right min-w-[220px] flex flex-col justify-between">
																	<div>
																		<div className="mb-2">
																			<span className="text-3xl font-bold text-gray-900">
																				₹{" "}
																				{Math.round(totalPrice).toLocaleString(
																					"en-IN",
																				)}
																			</span>
																		</div>
																		<p className="text-xs text-gray-600 mb-1">
																			+ ₹{" "}
																			{Math.round(room.TotalTax).toLocaleString(
																				"en-IN",
																			)}{" "}
																			taxes & fees
																		</p>
																		<p className="text-sm text-gray-700 mb-4">
																			Per Night
																		</p>
																	</div>
																	<div>
																		<Button
																			onClick={() => handleBookRoom(room)}
																			className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 font-semibold"
																		>
																			BOOK NOW
																		</Button>
																		{room.IsRefundable && (
																			<p className="text-xs text-green-600 mt-3 font-medium">
																				✓ Free Cancellation Available
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
								)}

								{isLoadingRooms && (
									<Card>
										<CardContent className="p-6">
											<Skeleton className="h-32 w-full" />
										</CardContent>
									</Card>
								)}

								{/* Description */}
								{hotelDetails.Description && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<h2 className="text-2xl font-bold mb-2 text-gray-900">
												About This Hotel
											</h2>
											{hotelDetails.Headline && (
												<p className="text-base text-blue-700 font-medium mb-4">
													{hotelDetails.Headline}
												</p>
											)}
											<div className="prose prose-lg max-w-none">
												<p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
													{formatDescription(hotelDetails.Description)}
												</p>
											</div>
										</CardContent>
									</Card>
								)}

								{/* Dining */}
								{hotelDetails.DescriptionDining && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<div className="flex items-center gap-2 mb-4">
												<Utensils className="w-6 h-6 text-orange-500" />
												<h2 className="text-2xl font-bold text-gray-900">
													Dining
												</h2>
											</div>
											<p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
												{formatDescription(hotelDetails.DescriptionDining)}
											</p>
										</CardContent>
									</Card>
								)}

								{/* Location context */}
								{hotelDetails.DescriptionLocation && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<div className="flex items-center gap-2 mb-4">
												<MapPin className="w-6 h-6 text-blue-500" />
												<h2 className="text-2xl font-bold text-gray-900">
													The Neighbourhood
												</h2>
											</div>
											<p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
												{formatDescription(hotelDetails.DescriptionLocation)}
											</p>
										</CardContent>
									</Card>
								)}

								{/* Attractions from descriptions */}
								{hotelDetails.DescriptionAttractions && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<div className="flex items-center gap-2 mb-4">
												<MapPin className="w-6 h-6 text-green-500" />
												<h2 className="text-2xl font-bold text-gray-900">
													Nearby Attractions
												</h2>
											</div>
											<p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
												{formatDescription(hotelDetails.DescriptionAttractions)}
											</p>
										</CardContent>
									</Card>
								)}

								{/* Recreation & Services */}
								{hotelDetails.DescriptionAmenities && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<div className="flex items-center gap-2 mb-4">
												<CheckCircle className="w-6 h-6 text-purple-500" />
												<h2 className="text-2xl font-bold text-gray-900">
													Recreation &amp; Services
												</h2>
											</div>
											<p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
												{formatDescription(hotelDetails.DescriptionAmenities)}
											</p>
										</CardContent>
									</Card>
								)}

								{/* Room Overview */}
								{hotelDetails.DescriptionRooms && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<div className="flex items-center gap-2 mb-4">
												<BedDouble className="w-6 h-6 text-blue-500" />
												<h2 className="text-2xl font-bold text-gray-900">
													Room Overview
												</h2>
											</div>
											<p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
												{formatDescription(hotelDetails.DescriptionRooms)}
											</p>
										</CardContent>
									</Card>
								)}

								{/* Business Facilities */}
								{hotelDetails.DescriptionBusinessAmenities && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<div className="flex items-center gap-2 mb-4">
												<Globe className="w-6 h-6 text-gray-500" />
												<h2 className="text-2xl font-bold text-gray-900">
													Business Facilities
												</h2>
											</div>
											<p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
												{formatDescription(
													hotelDetails.DescriptionBusinessAmenities,
												)}
											</p>
										</CardContent>
									</Card>
								)}

								{/* Renovations */}
								{hotelDetails.DescriptionRenovations && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<div className="flex items-center gap-2 mb-4">
												<h2 className="text-2xl font-bold text-gray-900">
													Renovation Notice
												</h2>
											</div>
											<p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
												{formatDescription(hotelDetails.DescriptionRenovations)}
											</p>
										</CardContent>
									</Card>
								)}

								{/* Policies */}
								{(hotelDetails.Instructions ||
									hotelDetails.SpecialInstructions ||
									hotelDetails.KnowBeforeYouGo ||
									hotelDetails.MandatoryFeesText ||
									hotelDetails.OptionalFeesText ||
									(hotelDetails.HouseRules &&
										Object.keys(hotelDetails.HouseRules).length > 0)) && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<h2 className="text-2xl font-bold mb-6 text-gray-900">
												Policies &amp; Important Information
											</h2>
											<div className="space-y-6">
												{hotelDetails.Instructions && (
													<div>
														<h3 className="text-base font-semibold text-gray-800 mb-2">
															Property Instructions
														</h3>
														<p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
															{formatDescription(hotelDetails.Instructions)}
														</p>
													</div>
												)}
												{hotelDetails.SpecialInstructions && (
													<div>
														<h3 className="text-base font-semibold text-gray-800 mb-2">
															Special Instructions
														</h3>
														<p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
															{formatDescription(
																hotelDetails.SpecialInstructions,
															)}
														</p>
													</div>
												)}
												{hotelDetails.KnowBeforeYouGo && (
													<div>
														<h3 className="text-base font-semibold text-gray-800 mb-2">
															Know Before You Go
														</h3>
														<p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
															{formatDescription(hotelDetails.KnowBeforeYouGo)}
														</p>
													</div>
												)}
												{hotelDetails.MandatoryFeesText && (
													<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
														<h3 className="text-base font-semibold text-amber-800 mb-2">
															⚠ Mandatory Fees (charged at property)
														</h3>
														<p className="text-sm text-amber-900 whitespace-pre-line leading-relaxed">
															{formatDescription(
																hotelDetails.MandatoryFeesText,
															)}
														</p>
													</div>
												)}
												{hotelDetails.OptionalFeesText && (
													<div>
														<h3 className="text-base font-semibold text-gray-800 mb-2">
															Optional Fees
														</h3>
														<p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
															{formatDescription(hotelDetails.OptionalFeesText)}
														</p>
													</div>
												)}
												{hotelDetails.HouseRules &&
													Object.keys(hotelDetails.HouseRules).length > 0 && (
														<div>
															<h3 className="text-base font-semibold text-gray-800 mb-3">
																House Rules
															</h3>
															<div className="space-y-2">
																{Object.entries(hotelDetails.HouseRules).map(
																	([key, value]) => (
																		<div
																			key={key}
																			className="flex gap-3 text-sm p-2 bg-gray-50 rounded"
																		>
																			<span className="font-medium text-gray-700 capitalize min-w-[120px]">
																				{key.replace(/_/g, " ")}:
																			</span>
																			<span className="text-gray-600">
																				{value}
																			</span>
																		</div>
																	),
																)}
															</div>
														</div>
													)}
											</div>
										</CardContent>
									</Card>
								)}

								{/* Facilities */}
								{facilities.length > 0 && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<h2 className="text-2xl font-bold mb-6 text-gray-900">
												Hotel Facilities
											</h2>
											<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
												{facilities.map((facility, index) => (
													<div
														key={index}
														className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
													>
														<CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
														<span className="text-sm font-medium text-gray-700">
															{facility}
														</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

								{/* Hotel Room Types */}
								{hotelDetails.HotelRooms &&
									hotelDetails.HotelRooms.length > 0 && (
										<Card className="shadow-lg border-0">
											<CardContent className="p-8">
												<h2 className="text-2xl font-bold mb-6 text-gray-900">
													Room Types
												</h2>
												<div className="space-y-6">
													{hotelDetails.HotelRooms.map((roomType, index) => (
														<div
															key={index}
															className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
														>
															{/* Room image */}
															{roomType.RoomImages &&
																roomType.RoomImages.length > 0 && (
																	<div className="relative h-48 w-full">
																		<Image
																			src={roomType.RoomImages[0]}
																			alt={roomType.RoomTypeName || "Room"}
																			fill
																			unoptimized
																			className="object-cover"
																			sizes="(max-width: 768px) 100vw, 50vw"
																		/>
																	</div>
																)}
															<div className="p-5">
																<h3 className="text-lg font-semibold text-gray-900 mb-3">
																	{roomType.RoomTypeName ||
																		`Room Type ${index + 1}`}
																</h3>
																{/* Quick facts row */}
																{(roomType.BedConfig ||
																	roomType.AreaSqFt ||
																	roomType.MaxOccupancy) && (
																	<div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-700">
																		{roomType.BedConfig && (
																			<span className="flex items-center gap-1">
																				<BedDouble className="w-4 h-4 text-gray-500" />
																				{roomType.BedConfig}
																			</span>
																		)}
																		{roomType.AreaSqFt && (
																			<span className="flex items-center gap-1">
																				<Maximize2 className="w-4 h-4 text-gray-500" />
																				{roomType.AreaSqFt} sq ft
																				{roomType.AreaSqM &&
																					` / ${roomType.AreaSqM} m²`}
																			</span>
																		)}
																		{roomType.MaxOccupancy && (
																			<span className="flex items-center gap-1">
																				<Users className="w-4 h-4 text-gray-500" />
																				Up to {roomType.MaxOccupancy} guests
																			</span>
																		)}
																	</div>
																)}
																{/* Views */}
																{roomType.Views &&
																	roomType.Views.length > 0 && (
																		<div className="flex flex-wrap gap-2 mb-3">
																			{roomType.Views.map((view, vi) => (
																				<span
																					key={vi}
																					className="flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded-full"
																				>
																					<Eye className="w-3 h-3" />
																					{view}
																				</span>
																			))}
																		</div>
																	)}
																{roomType.RoomDescription && (
																	<p className="text-sm text-gray-600 mb-3 leading-relaxed">
																		{formatDescription(
																			roomType.RoomDescription,
																		)}
																	</p>
																)}
																{/* Amenities */}
																{roomType.Amenities &&
																	roomType.Amenities.length > 0 && (
																		<div className="flex flex-wrap gap-2">
																			{roomType.Amenities.slice(0, 8).map(
																				(amenity, idx) => (
																					<span
																						key={idx}
																						className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
																					>
																						{amenity}
																					</span>
																				),
																			)}
																			{roomType.Amenities.length > 8 && (
																				<span className="text-xs text-gray-500 px-2 py-1">
																					+{roomType.Amenities.length - 8} more
																				</span>
																			)}
																		</div>
																	)}
															</div>
														</div>
													))}
												</div>
											</CardContent>
										</Card>
									)}

								{/* Hotel Fees */}
								{hotelDetails.HotelFees &&
									((hotelDetails.HotelFees.Mandatory &&
										hotelDetails.HotelFees.Mandatory.length > 0) ||
										(hotelDetails.HotelFees.Optional &&
											hotelDetails.HotelFees.Optional.length > 0)) && (
										<Card className="shadow-lg border-0">
											<CardContent className="p-8">
												<h2 className="text-2xl font-bold mb-6 text-gray-900">
													Hotel Fees
												</h2>
												<div className="space-y-4">
													{hotelDetails.HotelFees.Mandatory &&
														hotelDetails.HotelFees.Mandatory.length > 0 && (
															<div>
																<h3 className="text-lg font-semibold text-gray-900 mb-3">
																	Mandatory Fees
																</h3>
																<div className="space-y-2">
																	{hotelDetails.HotelFees.Mandatory.map(
																		(fee, index) => (
																			<div
																				key={index}
																				className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
																			>
																				<span className="text-sm font-medium text-gray-700">
																					{fee.Name}
																				</span>
																				{fee.Amount && (
																					<span className="text-sm font-bold text-red-600">
																						₹{fee.Amount}
																					</span>
																				)}
																			</div>
																		),
																	)}
																</div>
															</div>
														)}
													{hotelDetails.HotelFees.Optional &&
														hotelDetails.HotelFees.Optional.length > 0 && (
															<div>
																<h3 className="text-lg font-semibold text-gray-900 mb-3">
																	Optional Fees
																</h3>
																<div className="space-y-2">
																	{hotelDetails.HotelFees.Optional.map(
																		(fee, index) => (
																			<div
																				key={index}
																				className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
																			>
																				<span className="text-sm font-medium text-gray-700">
																					{fee.Name}
																				</span>
																				{fee.Amount && (
																					<span className="text-sm font-bold text-blue-600">
																						₹{fee.Amount}
																					</span>
																				)}
																			</div>
																		),
																	)}
																</div>
															</div>
														)}
												</div>
											</CardContent>
										</Card>
									)}

								{/* Attractions - Collapsible */}
								{attractions.length > 0 && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-8">
											<button
												onClick={() => setIsAttractionsOpen(!isAttractionsOpen)}
												className="flex items-center justify-between w-full mb-6"
											>
												<h2 className="text-2xl font-bold text-gray-900">
													Nearby Attractions
												</h2>
												{isAttractionsOpen ? (
													<ChevronUp className="w-6 h-6 text-gray-600" />
												) : (
													<ChevronDown className="w-6 h-6 text-gray-600" />
												)}
											</button>
											{isAttractionsOpen && (
												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													{attractions.map((attraction, index) => (
														<div
															key={index}
															className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
														>
															<div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
																<MapPin className="w-5 h-5 text-blue-600" />
															</div>
															<div className="flex-1">
																<p className="font-semibold text-gray-900 mb-1">
																	{attraction.key.replace(/^\d+\)\s*/, "")}
																</p>
																{attraction.value && (
																	<p className="text-sm text-gray-600">
																		{attraction.value}
																	</p>
																)}
															</div>
														</div>
													))}
												</div>
											)}
										</CardContent>
									</Card>
								)}
							</div>

							{/* Sidebar */}
							<div className="space-y-6">
								{/* Map */}
								{latitude && longitude && (
									<Card className="shadow-lg border-0">
										<CardContent className="p-6">
											<h2 className="text-xl font-bold mb-4 text-gray-900">
												Location
											</h2>
											<div className="relative w-full h-64 bg-gray-200 rounded-xl overflow-hidden shadow-md mb-4">
												<HotelMap
													latitude={latitude}
													longitude={longitude}
													address={hotelDetails.Address || ""}
												/>
											</div>
											{hotelDetails.Address && (
												<div className="p-3 bg-gray-50 rounded-lg">
													<p className="text-sm text-gray-700 font-medium">
														{hotelDetails.Address}
													</p>
													<a
														href={`https://www.google.com/maps?q=${latitude},${longitude}`}
														target="_blank"
														rel="noopener noreferrer"
														className="text-xs text-blue-600 hover:underline mt-2 inline-block"
													>
														View on Google Maps →
													</a>
												</div>
											)}
										</CardContent>
									</Card>
								)}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

export default function HotelDetailsPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50">
					<div className="container mx-auto px-4 py-6">
						<Skeleton className="h-96 w-full mb-6" />
						<Skeleton className="h-64 w-full" />
					</div>
				</div>
			}
		>
			<HotelDetailsContent />
		</Suspense>
	);
}
