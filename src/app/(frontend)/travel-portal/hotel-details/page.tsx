"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import type { Room } from "@/types/hotelApi";

// Hotel Map Component
function HotelMap({
	latitude,
	longitude,
	address,
}: {
	latitude: string;
	longitude: string;
	address: string;
}) {
	// Get API key from environment variable
	// Note: NEXT_PUBLIC_* variables are available at build time and runtime in client components
	const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

	// Log warning in development if API key is missing
	useEffect(() => {
		if (!apiKey && process.env.NODE_ENV === "development") {
			console.warn(
				"⚠️ Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file"
			);
		}
	}, [apiKey]);

	// If API key is available, use Maps Embed API
	if (apiKey) {
		// Use the address if available, otherwise use coordinates
		const query = address || `${latitude},${longitude}`;
		return (
			<iframe
				width="100%"
				height="100%"
				style={{ border: 0 }}
				src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(query)}`}
				allowFullScreen
				loading="lazy"
				referrerPolicy="no-referrer-when-downgrade"
			/>
		);
	}

	// Fallback: Use Google Maps link with coordinates
	const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
	return (
		<a
			href={mapsUrl}
			target="_blank"
			rel="noopener noreferrer"
			className="flex items-center justify-center h-full bg-gray-100 hover:bg-gray-200 transition-colors"
		>
			<div className="text-center p-4">
				<MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
				<p className="text-sm text-gray-600 mb-2">Click to view on Google Maps</p>
				<p className="text-xs text-gray-500">
					(Google Maps API key required for embedded map)
				</p>
			</div>
		</a>
	);
}

export default function HotelDetailsPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const hotelCode = searchParams.get("hotelCode");

	const [hotelDetails, setHotelDetails] = useState<{
		HotelName?: string;
		CityName?: string;
		CountryName?: string;
		Address?: string;
		PhoneNumber?: string;
		Email?: string;
		HotelWebsiteUrl?: string;
		FaxNumber?: string;
		PinCode?: string;
		CheckInTime?: string;
		CheckOutTime?: string;
		HotelRating?: string | number;
		Description?: string;
		Images?: string | string[];
		HotelFacilities?: string | string[];
		Attractions?: string | Array<{ key: string; value: string }> | Record<string, string>;
		Map?: string | { Latitude?: string; Longitude?: string; latitude?: string; longitude?: string };
		HotelRooms?: Array<{
			RoomTypeName?: string;
			RoomTypeCode?: string;
			RoomDescription?: string;
			Amenities?: string[];
		}>;
		HotelFees?: {
			Mandatory?: Array<{ Name?: string; Amount?: number }>;
			Optional?: Array<{ Name?: string; Amount?: number }>;
		};
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
	const [isLoadingRooms, setIsLoadingRooms] = useState(false);
	const [isAttractionsOpen, setIsAttractionsOpen] = useState(false);
	const [visibleImages, setVisibleImages] = useState(8); // Show first 8 images initially
	
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
			const response = await fetch(
				`/api/travel/hotel/details?hotelCode=${hotelCode}&language=EN&isRoomDetailRequired=true`
			);
			const result = await response.json();

			if (!result.success) {
				setError(result.error || "Failed to fetch hotel details");
				setIsLoading(false);
				return;
			}

			if (result.data?.HotelDetails) {
				// Handle both array and object formats
				let hotelDetails = result.data.HotelDetails;
				if (Array.isArray(hotelDetails) && hotelDetails.length > 0) {
					hotelDetails = hotelDetails[0];
				}
				setHotelDetails(hotelDetails);
			} else {
				setError("Hotel details not found");
			}
		} catch (err) {
			console.error("Error fetching hotel details:", err);
			setError(err instanceof Error ? err.message : "An error occurred while fetching hotel details");
		} finally {
			setIsLoading(false);
		}
	};

	const fetchAvailableRooms = async () => {
		if (!hotelCode || !checkIn || !checkOut || !rooms || !adults) return;

		setIsLoadingRooms(true);

		try {
			// Prepare room configuration
			const numRooms = parseInt(rooms);
			const numAdults = parseInt(adults);
			const numChildren = parseInt(children || "0");
			
			const adultsPerRoom = Math.floor(numAdults / numRooms);
			const childrenPerRoom = Math.floor(numChildren / numRooms);

			const paxRooms = Array(numRooms)
				.fill(null)
				.map(() => ({
					adults: adultsPerRoom || 1,
					children: childrenPerRoom,
					childrenAges: Array(childrenPerRoom).fill(5),
				}));

			// Call hotel search API with just this hotel
			const response = await fetch("/api/travel/hotel/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					checkIn: checkIn,
					checkOut: checkOut,
					hotelCodes: hotelCode,
					guestNationality: "IN",
					rooms: paxRooms,
					isDetailedResponse: true,
					filters: {},
				}),
			});

			const result = await response.json();

			if (result.success && result.data?.HotelResult) {
				// Find the hotel in results
				const hotel = result.data.HotelResult.find(
					(h: { HotelCode: string }) => String(h.HotelCode) === String(hotelCode)
				);
				
				if (hotel && hotel.Rooms) {
					setAvailableRooms(hotel.Rooms);
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
					const split = imagesData.split(",").map((img: string) => img.trim()).filter(Boolean);
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
	const parseFacilities = (facilitiesData: string | string[] | undefined): string[] => {
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
					return facilitiesData.split(",").map((f: string) => f.trim()).filter(Boolean);
				}
			}
		} catch (e) {
			console.error("Error parsing facilities:", e);
		}

		return [];
	};

	// Parse attractions from API response
	const parseAttractions = (attractionsData: string | Array<{ key: string; value: string }> | Record<string, string> | undefined): Array<{ key: string; value: string }> => {
		if (!attractionsData) return [];

		try {
			if (Array.isArray(attractionsData)) {
				return attractionsData;
			}
			// If it's an object with numbered keys (e.g., "1) ", "2) ")
			if (typeof attractionsData === "object" && !Array.isArray(attractionsData)) {
				return Object.entries(attractionsData).map(([key, value]) => ({
					key: key.trim(),
					value: typeof value === "string" ? value.trim() : String(value),
				})).filter((p) => p.key && p.value);
			}
			if (typeof attractionsData === "string") {
				try {
					const parsed = JSON.parse(attractionsData);
					if (Array.isArray(parsed)) return parsed;
					// If parsed object, convert to array
					if (typeof parsed === "object" && !Array.isArray(parsed)) {
						return Object.entries(parsed).map(([key, value]) => ({
							key: key.trim(),
							value: typeof value === "string" ? value.trim() : String(value),
						})).filter((p) => p.key && p.value);
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
			const mapData = typeof hotelDetails.Map === "string"
				? JSON.parse(hotelDetails.Map)
				: hotelDetails.Map;
			latitude = mapData?.Latitude || mapData?.latitude || null;
			longitude = mapData?.Longitude || mapData?.longitude || null;
		} catch (_e) {
			// If parsing fails, try extracting from pipe-separated or comma-separated string
			const mapStr = typeof hotelDetails.Map === "string" ? hotelDetails.Map : "";
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
				{/* Hotel Header */}
				<Card className="mb-6 shadow-lg border-0">
					<CardContent className="p-8">
						<div className="flex items-start justify-between mb-4">
							<div className="flex-1">
								<h1 className="text-4xl font-bold text-gray-900 mb-3">
									{hotelDetails.HotelName}
								</h1>

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
									<p className="text-gray-700 mb-4 text-lg">{hotelDetails.Address}</p>
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
										<p className="text-sm font-medium text-gray-900">{hotelDetails.PhoneNumber}</p>
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
										<a href={`mailto:${hotelDetails.Email}`} className="text-sm font-medium text-blue-600 hover:underline">
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
										<a href={hotelDetails.HotelWebsiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
											Visit Website
										</a>
									</div>
								</div>
							)}
							{hotelDetails.FaxNumber && (
								<div className="flex items-center gap-3">
									<div className="p-2 bg-blue-50 rounded-lg">
										<Phone className="w-5 h-5 text-blue-600" />
									</div>
									<div>
										<p className="text-xs text-gray-500">Fax</p>
										<p className="text-sm font-medium text-gray-900">{hotelDetails.FaxNumber}</p>
									</div>
								</div>
							)}
							{hotelDetails.CheckInTime && (
								<div className="flex items-center gap-3">
									<div className="p-2 bg-green-50 rounded-lg">
										<Clock className="w-5 h-5 text-green-600" />
									</div>
									<div>
										<p className="text-xs text-gray-500">Check-in</p>
										<p className="text-sm font-medium text-gray-900">{hotelDetails.CheckInTime}</p>
									</div>
								</div>
							)}
							{hotelDetails.CheckOutTime && (
								<div className="flex items-center gap-3">
									<div className="p-2 bg-green-50 rounded-lg">
										<Clock className="w-5 h-5 text-green-600" />
									</div>
									<div>
										<p className="text-xs text-gray-500">Check-out</p>
										<p className="text-sm font-medium text-gray-900">{hotelDetails.CheckOutTime}</p>
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
								<h2 className="text-2xl font-bold text-gray-900">Photo Gallery</h2>
								<span className="text-sm text-gray-500">{images.length} photos</span>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
								{/* Main Image */}
								<div className="md:col-span-2">
									<div className="relative w-full h-96 bg-gray-200 rounded-xl overflow-hidden shadow-md">
										<Image
											src={images[selectedImageIndex] || images[0]}
											alt={hotelDetails.HotelName || "Hotel image"}
											fill
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
												Load More Photos ({images.length - visibleImages} remaining)
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
									<h2 className="text-2xl font-bold mb-6 text-gray-900">Available Rooms</h2>
									<div className="space-y-6">
										{availableRooms.map((room, index) => {
											const totalPrice = room.TotalFare + room.TotalTax;
											const inclusions = room.Inclusion ? room.Inclusion.split(",") : [];
											
											return (
												<div
													key={index}
													className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all"
												>
													<div className="flex flex-col lg:flex-row justify-between gap-6">
														{/* Left: Room Details */}
														<div className="flex-1">
															<h3 className="text-xl font-bold text-gray-900 mb-3">
																{room.Name?.[0] || `Room Option ${index + 1}`}
															</h3>
															
															{/* Room Features */}
															<div className="space-y-2 mb-4">
																{inclusions.slice(0, 5).map((inclusion, idx) => (
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
																{room.MealType && room.MealType !== "Room_Only" && (
																	<div className="flex items-center gap-2 text-sm font-medium text-blue-600 mt-3">
																		<Utensils className="w-4 h-4" />
																		<span>{room.MealType.replace(/_/g, " ")}</span>
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
																		₹ {Math.round(totalPrice).toLocaleString("en-IN")}
																	</span>
																</div>
																<p className="text-xs text-gray-600 mb-1">
																	+ ₹ {Math.round(room.TotalTax).toLocaleString("en-IN")} taxes & fees
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
									<h2 className="text-2xl font-bold mb-6 text-gray-900">About This Hotel</h2>
									<div className="prose prose-lg max-w-none">
										<p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
											{formatDescription(hotelDetails.Description)}
										</p>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Facilities */}
						{facilities.length > 0 && (
							<Card className="shadow-lg border-0">
								<CardContent className="p-8">
									<h2 className="text-2xl font-bold mb-6 text-gray-900">Hotel Facilities</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{facilities.map((facility, index) => (
											<div
												key={index}
												className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
											>
												<CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
												<span className="text-sm font-medium text-gray-700">{facility}</span>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Hotel Room Types */}
						{hotelDetails.HotelRooms && hotelDetails.HotelRooms.length > 0 && (
							<Card className="shadow-lg border-0">
								<CardContent className="p-8">
									<h2 className="text-2xl font-bold mb-6 text-gray-900">Room Types</h2>
									<div className="space-y-4">
										{hotelDetails.HotelRooms.map((roomType, index) => (
											<div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
												<h3 className="text-lg font-semibold text-gray-900 mb-2">
													{roomType.RoomTypeName || `Room Type ${index + 1}`}
												</h3>
												{roomType.RoomDescription && (
													<p className="text-sm text-gray-600 mb-3">
														{roomType.RoomDescription}
													</p>
												)}
												{roomType.Amenities && roomType.Amenities.length > 0 && (
													<div className="flex flex-wrap gap-2">
														{roomType.Amenities.map((amenity, idx) => (
															<span
																key={idx}
																className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
															>
																{amenity}
															</span>
														))}
													</div>
												)}
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Hotel Fees */}
						{hotelDetails.HotelFees && (
							((hotelDetails.HotelFees.Mandatory && hotelDetails.HotelFees.Mandatory.length > 0) || 
							 (hotelDetails.HotelFees.Optional && hotelDetails.HotelFees.Optional.length > 0)) && (
								<Card className="shadow-lg border-0">
									<CardContent className="p-8">
										<h2 className="text-2xl font-bold mb-6 text-gray-900">Hotel Fees</h2>
										<div className="space-y-4">
											{hotelDetails.HotelFees.Mandatory && hotelDetails.HotelFees.Mandatory.length > 0 && (
												<div>
													<h3 className="text-lg font-semibold text-gray-900 mb-3">Mandatory Fees</h3>
													<div className="space-y-2">
														{hotelDetails.HotelFees.Mandatory.map((fee, index) => (
															<div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
																<span className="text-sm font-medium text-gray-700">{fee.Name}</span>
																{fee.Amount && (
																	<span className="text-sm font-bold text-red-600">₹{fee.Amount}</span>
																)}
															</div>
														))}
													</div>
												</div>
											)}
											{hotelDetails.HotelFees.Optional && hotelDetails.HotelFees.Optional.length > 0 && (
												<div>
													<h3 className="text-lg font-semibold text-gray-900 mb-3">Optional Fees</h3>
													<div className="space-y-2">
														{hotelDetails.HotelFees.Optional.map((fee, index) => (
															<div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
																<span className="text-sm font-medium text-gray-700">{fee.Name}</span>
																{fee.Amount && (
																	<span className="text-sm font-bold text-blue-600">₹{fee.Amount}</span>
																)}
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							)
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
						{(latitude && longitude) && (
							<Card className="shadow-lg border-0 sticky top-24">
								<CardContent className="p-6">
									<h2 className="text-xl font-bold mb-4 text-gray-900">Location</h2>
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
			</div>
		</div>
	);
}
