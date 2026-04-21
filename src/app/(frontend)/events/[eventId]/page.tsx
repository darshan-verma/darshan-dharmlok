"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Calendar, Clock, MapPin, IndianRupee, Tag } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface Event {
	id: string;
	title: string;
	description?: string;
	bookingUrl?: string;
	address?: string;
	fromDate: string;
	fromTime?: string;
	toDate: string;
	toTime?: string;
	place?: string;
	location?: string;
	category: string;
	type: string;
	price?: number;
	bannerImage?: string;
	relatedImages?: string[];
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

export default function EventDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;

	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [isBooking, setIsBooking] = useState(false);
	const [bannerImageSrc, setBannerImageSrc] = useState<string>("");
	const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (!eventId) return;

		const fetchEvent = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch(`/api/events/${eventId}`);
				if (!response.ok) {
					if (response.status === 404) {
						throw new Error("Event not found");
					}
					throw new Error("Failed to fetch event details");
				}
				const data = await response.json();
				setEvent(data);
			} catch (err) {
				console.error("Error fetching event:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to load event details"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchEvent();
	}, [eventId]);

	const formatDate = (dateString: string) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		return date.toLocaleDateString("en-IN", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatTime = (timeString?: string) => {
		if (!timeString) return "";
		// Assuming time is in HH:MM format
		const [hours, minutes] = timeString.split(":");
		const hour = parseInt(hours, 10);
		const ampm = hour >= 12 ? "PM" : "AM";
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const handleBook = () => {
		if (event?.bookingUrl) {
			setIsBooking(true);
			window.open(event.bookingUrl, "_blank");
			setTimeout(() => setIsBooking(false), 1000);
		}
	};

	const allImages = event
		? [
				event.bannerImage,
				...(event.relatedImages || []),
		  ].filter((img): img is string => Boolean(img))
		: [];

	const FALLBACK_EVENT_IMAGE = "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";

	useEffect(() => {
		if (!event) return;
		setBannerImageSrc(event.bannerImage || FALLBACK_EVENT_IMAGE);
		setFailedImages(new Set());
		setSelectedImageIndex(0);
	}, [event]);

	const markImageAsFailed = (src?: string) => {
		if (!src) return;
		setFailedImages((prev) => {
			if (prev.has(src)) return prev;
			const next = new Set(prev);
			next.add(src);
			return next;
		});
	};

	const getSafeImageSrc = (src?: string) => {
		if (!src) return FALLBACK_EVENT_IMAGE;
		if (failedImages.has(src)) return FALLBACK_EVENT_IMAGE;
		return src;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
					<p className="text-lg text-muted-foreground">Loading event details...</p>
				</div>
				<Footer />
			</div>
		);
	}

	if (error || !event) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<p className="text-lg text-red-500">{error || "Event not found"}</p>
					<button
						onClick={() => router.push("/events")}
						className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
					>
						Back to Events
					</button>
				</div>
				<Footer />
			</div>
		);
	}

	const bannerImage = bannerImageSrc || FALLBACK_EVENT_IMAGE;

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Banner Section */}
			<section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
				<div className="absolute inset-0">
					<Image
						src={bannerImage}
						alt={event.title}
						fill
						sizes="100vw"
						unoptimized
						className="object-cover"
						priority
						onError={() => setBannerImageSrc(FALLBACK_EVENT_IMAGE)}
					/>
					<div className="absolute inset-0 bg-black/40" />
				</div>

				{/* Text Overlay */}
				<div className="relative z-10 h-full flex items-center justify-center">
					<div className="container mx-auto px-4 text-center">
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4 drop-shadow-2xl">
							{event.title}
						</h1>
						<div className="flex items-center justify-center gap-3 flex-wrap">
							{event.category && (
								<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium">
									<Tag className="w-4 h-4" />
									{event.category}
								</span>
							)}
							{event.type && (
								<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium">
									{event.type}
								</span>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<section className={`py-12 bg-[#f5f5f0] ${event.price !== undefined && event.price !== null ? 'pb-24 lg:pb-12' : ''}`}>
				<div className="container mx-auto px-4 max-w-7xl">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Main Content Column */}
						<div className="lg:col-span-2 space-y-8">
							{/* Description */}
							{event.description && (
								<div className="bg-white rounded-2xl p-6 shadow-sm">
									<h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
										About This Event
									</h2>
									<div
										className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
										dangerouslySetInnerHTML={{
											__html: event.description.replace(/\n/g, "<br />"),
										}}
									/>
								</div>
							)}

							{/* Event Details */}
							<div className="bg-white rounded-2xl p-6 shadow-sm">
								<h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
									Event Details
								</h2>
								<div className="space-y-4">
									{/* Date */}
									<div className="flex items-start gap-4">
										<Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
										<div>
											<p className="font-semibold text-gray-900">Date</p>
											<p className="text-gray-600">
												{formatDate(event.fromDate)}
												{event.fromDate !== event.toDate &&
													` - ${formatDate(event.toDate)}`}
											</p>
										</div>
									</div>

									{/* Time */}
									{(event.fromTime || event.toTime) && (
										<div className="flex items-start gap-4">
											<Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
											<div>
												<p className="font-semibold text-gray-900">Timings</p>
												<p className="text-gray-600">
													{event.fromTime && formatTime(event.fromTime)}
													{event.fromTime && event.toTime && " - "}
													{event.toTime && formatTime(event.toTime)}
												</p>
											</div>
										</div>
									)}

									{/* Place */}
									{event.place && (
										<div className="flex items-start gap-4">
											<MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
											<div>
												<p className="font-semibold text-gray-900">Venue</p>
												<p className="text-gray-600">{event.place}</p>
											</div>
										</div>
									)}

									{/* Address */}
									{event.address && (
										<div className="flex items-start gap-4">
											<MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
											<div>
												<p className="font-semibold text-gray-900">Address</p>
												<p className="text-gray-600">{event.address}</p>
											</div>
										</div>
									)}
								</div>
							</div>

							{/* Location Map */}
							{event.location && (
								<div className="bg-white rounded-2xl p-6 shadow-sm">
									<h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
										Location
									</h2>
									<div
										className="w-full rounded-lg overflow-hidden"
										dangerouslySetInnerHTML={{ __html: event.location }}
									/>
								</div>
							)}

							{/* Gallery */}
							{allImages.length > 0 && (
								<div className="bg-white rounded-2xl p-6 shadow-sm">
									<h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
										Photo Gallery
									</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* Main Image */}
										{allImages.length > 0 && (
											<div className="md:col-span-2">
												<Dialog>
													<DialogTrigger asChild>
														<div className="relative w-full h-96 bg-gray-200 rounded-xl overflow-hidden shadow-md cursor-pointer hover:opacity-90 transition-opacity">
															<Image
																src={getSafeImageSrc(
																	allImages[selectedImageIndex] || allImages[0]
																)}
																alt={`Event image ${selectedImageIndex + 1}`}
																fill
																sizes="(max-width: 768px) 100vw, 66vw"
																unoptimized
																className="object-cover"
																priority={selectedImageIndex === 0}
																onError={() =>
																	markImageAsFailed(
																		allImages[selectedImageIndex] || allImages[0]
																	)
																}
															/>
														</div>
													</DialogTrigger>
													<DialogContent className="max-w-4xl">
														<DialogHeader>
															<DialogTitle>{event.title}</DialogTitle>
														</DialogHeader>
														<div className="relative w-full aspect-video mt-4">
															<Image
																src={getSafeImageSrc(
																	allImages[selectedImageIndex] || allImages[0]
																)}
																alt={`Event image ${selectedImageIndex + 1}`}
																fill
																sizes="90vw"
																unoptimized
																className="object-contain"
																onError={() =>
																	markImageAsFailed(
																		allImages[selectedImageIndex] || allImages[0]
																	)
																}
															/>
														</div>
													</DialogContent>
												</Dialog>
											</div>
										)}
										{/* Thumbnail Grid */}
										{allImages.length > 1 && (
											<div className="md:col-span-2 grid grid-cols-4 gap-2">
												{allImages.slice(0, 8).map((image, index) => (
													<button
														key={index}
														onClick={() => setSelectedImageIndex(index)}
														className={`relative w-full h-24 bg-gray-200 rounded-lg overflow-hidden border-2 transition-all ${
															selectedImageIndex === index
																? "border-primary ring-2 ring-primary/20"
																: "border-transparent hover:border-primary/50"
														}`}
													>
														<Image
															src={getSafeImageSrc(image)}
															alt={`Event thumbnail ${index + 1}`}
															fill
															sizes="(max-width: 768px) 22vw, 9vw"
															unoptimized
															className="object-cover"
															loading="lazy"
															onError={() => markImageAsFailed(image)}
														/>
													</button>
												))}
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Sidebar */}
						<div className="lg:col-span-1">
							<div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
								{event.price !== undefined && event.price !== null && (
									<div className="mb-6">
										<p className="text-sm text-gray-600 mb-2">Price</p>
										<div className="flex items-center gap-2">
											<IndianRupee className="w-5 h-5 text-primary" />
											<span className="text-3xl font-bold text-gray-900">
												{event.price.toLocaleString("en-IN")}
											</span>
										</div>
									</div>
								)}
								<button
									onClick={handleBook}
									disabled={isBooking || !event.bookingUrl}
									className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
								>
									{isBooking ? (
										<>
											<Loader2 className="h-5 w-5 animate-spin" />
											Processing...
										</>
									) : (
										"Book Now"
									)}
								</button>
								{!event.bookingUrl && (
									<p className="text-sm text-gray-500 mt-2 text-center">
										Booking URL not available
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Bottom Booking Navbar */}
			{event.price !== undefined && event.price !== null && (
				<div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 lg:hidden">
					<div className="container mx-auto px-4 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<IndianRupee className="w-5 h-5 text-primary" />
								<span className="text-2xl font-bold text-gray-900">
									{event.price.toLocaleString("en-IN")}
								</span>
							</div>
							<button
								onClick={handleBook}
								disabled={isBooking || !event.bookingUrl}
								className="px-6 py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
							>
								{isBooking ? (
									<>
										<Loader2 className="h-5 w-5 animate-spin" />
										Processing...
									</>
								) : (
									"Book Now"
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			<Footer />
		</div>
	);
}
