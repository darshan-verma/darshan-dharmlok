"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";

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

export default function EventsPage() {
	const router = useRouter();
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [bookingEventId, setBookingEventId] = useState<string | null>(null);

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch("/api/events");
				if (!response.ok) {
					throw new Error("Failed to fetch events");
				}
				const data = await response.json();
				const allEvents: Event[] = Array.isArray(data) ? data : [];

				// Filter only active events
				const activeEvents = allEvents.filter(
					(event) => event.status === "Active"
				);

				setEvents(activeEvents);
			} catch (err) {
				console.error("Error fetching events:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to load events"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<Header />

			<PageBanner
				pageSlug="events"
				title="Events"
				description="Discover and join spiritual events, workshops, and gatherings"
				alt="Events Banner"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up"
			/>

			{/* Events Cards Section */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					{loading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-muted-foreground">Loading events...</p>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-500">{error}</p>
						</div>
					) : events.length > 0 ? (
						<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
							{events.map((event) => (
								<ProfileCard
									key={event.id}
									variant="event"
									name={event.title}
									description={event.description || "Join us for this spiritual event."}
									price={event.price}
									image={event.bannerImage}
									isVerified={event.status === "Active"}
									category={event.category}
									type={event.type}
									isBooking={bookingEventId === event.id}
									onBook={() => {
										setBookingEventId(event.id);
										router.push(`/events/${event.id}`);
									}}
									enableAnimations={true}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-16 text-gray-500">
							<p className="text-xl">No events available at the moment.</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
