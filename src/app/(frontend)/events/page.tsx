"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 24;

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
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [bookingEventId, setBookingEventId] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedType, setSelectedType] = useState("all");
	const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
	const [typeOptions, setTypeOptions] = useState<string[]>([]);

	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const isFetchingRef = useRef(false);
	const activeFilterKeyRef = useRef("");

	const activeFilterKey = useMemo(
		() => `${debouncedSearchQuery}|${selectedCategory}|${selectedType}`,
		[debouncedSearchQuery, selectedCategory, selectedType]
	);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 300);

		return () => window.clearTimeout(timer);
	}, [searchQuery]);

	useEffect(() => {
		activeFilterKeyRef.current = activeFilterKey;
	}, [activeFilterKey]);

	const clearFilters = useCallback(() => {
		setSearchQuery("");
		setSelectedCategory("all");
		setSelectedType("all");
	}, []);

	const fetchFilterOptions = useCallback(async () => {
		try {
			const response = await fetch("/api/events?filtersOnly=true&status=Active");
			if (!response.ok) {
				throw new Error("Failed to fetch event filters");
			}
			const data = await response.json();
			setCategoryOptions(Array.isArray(data?.categories) ? data.categories : []);
			setTypeOptions(Array.isArray(data?.types) ? data.types : []);
		} catch (err) {
			console.error("Error fetching event filters:", err);
		}
	}, []);

	const fetchPage = useCallback(
		async (nextPage: number, force = false) => {
			if (isFetchingRef.current && !force) return;
			isFetchingRef.current = true;
			const isFirstPage = nextPage === 1;
			const fetchKey = activeFilterKey;

			try {
				if (isFirstPage) {
					setLoading(true);
				} else {
					setLoadingMore(true);
				}
				setError(null);

				const params = new URLSearchParams({
					page: String(nextPage),
					limit: String(PAGE_SIZE),
					status: "Active",
				});

				if (debouncedSearchQuery) {
					params.set("search", debouncedSearchQuery);
				}
				if (selectedCategory !== "all") {
					params.set("category", selectedCategory);
				}
				if (selectedType !== "all") {
					params.set("type", selectedType);
				}

				const response = await fetch(`/api/events?${params.toString()}`);
				if (!response.ok) {
					throw new Error("Failed to fetch events");
				}
				const data = await response.json();
				if (fetchKey !== activeFilterKeyRef.current) return;

				const content: Event[] = Array.isArray(data?.content) ? data.content : [];
				setEvents((prev) => (isFirstPage ? content : [...prev, ...content]));

				if (typeof data?.total === "number") {
					setTotalCount(data.total);
				} else if (isFirstPage) {
					setTotalCount(content.length);
				}

				const totalPages =
					typeof data?.pagination?.totalPages === "number"
						? data.pagination.totalPages
						: nextPage;

				setPage(nextPage);
				setHasMore(nextPage < totalPages);
			} catch (err) {
				console.error("Error fetching events:", err);
				setError(err instanceof Error ? err.message : "Failed to load events");
			} finally {
				if (isFirstPage) {
					setLoading(false);
				} else {
					setLoadingMore(false);
				}
				isFetchingRef.current = false;
			}
		},
		[activeFilterKey, debouncedSearchQuery, selectedCategory, selectedType]
	);

	useEffect(() => {
		void fetchFilterOptions();
	}, [fetchFilterOptions]);

	useEffect(() => {
		setEvents([]);
		setPage(0);
		setHasMore(true);
		setTotalCount(0);
		void fetchPage(1, true);
	}, [fetchPage]);

	useEffect(() => {
		if (loading) return;
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const firstEntry = entries[0];
				if (!firstEntry?.isIntersecting) return;
				if (!hasMore || loadingMore || isFetchingRef.current) return;
				void fetchPage(page + 1);
			},
			{
				root: null,
				rootMargin: "600px 0px",
				threshold: 0,
			}
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [fetchPage, hasMore, loading, loadingMore, page]);

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

			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					<div className="mb-8 rounded-2xl border border-white/50 bg-white/35 p-3 md:p-4 backdrop-blur-xl shadow-[0_10px_28px_rgba(40,32,20,0.12)]">
						<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
							<div className="relative w-full lg:flex-[1.2]">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8b9c]" />
								<Input
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search events by name, category, or place"
									className="h-11 rounded-xl border-white/60 bg-white/55 pl-10 text-[#243142] placeholder:text-[#738295] focus-visible:border-white/80 focus-visible:ring-white/70"
									aria-label="Search events"
								/>
							</div>

							<Select value={selectedCategory} onValueChange={setSelectedCategory}>
								<SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295] sm:w-[220px]">
									<SelectValue placeholder="Filter by category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All categories</SelectItem>
									{categoryOptions.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select value={selectedType} onValueChange={setSelectedType}>
								<SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295] sm:w-[180px]">
									<SelectValue placeholder="Filter by type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All types</SelectItem>
									{typeOptions.map((type) => (
										<SelectItem key={type} value={type}>
											{type}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Button
								type="button"
								variant="outline"
								className="h-11 rounded-xl border-white/65 bg-white/60 text-[#2c3a4e] hover:bg-white/75 hover:text-[#1f2b3d] lg:ml-auto"
								onClick={clearFilters}
							>
								<X className="h-4 w-4" />
								Clear filters
							</Button>
						</div>

						<p className="mt-3 text-sm text-[#65778f]">
							Showing {events.length} of {totalCount} events
						</p>
					</div>

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
						<>
							<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
								{events.map((event) => (
									<ProfileCard
										key={event.id}
										variant="event"
										name={event.title}
										description={
											event.description || "Join us for this spiritual event."
										}
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
										enableAnimations
									/>
								))}
							</div>

							{loadingMore && (
								<div className="flex flex-col items-center justify-center py-8">
									<Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
									<p className="text-sm text-muted-foreground">
										Loading more events...
									</p>
								</div>
							)}

							{!hasMore && events.length > 0 && (
								<div className="text-center py-8 text-sm text-muted-foreground">
									You have reached the end.
								</div>
							)}

							<div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
						</>
					) : (
						<div className="text-center py-16 text-gray-500">
							<p className="text-xl">No events match your search or filters.</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
