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

interface PoojaService {
	id: string;
	name: string;
	description: string;
	price?: number;
	images?: string[];
	status?: string;
}

interface PoojaFilterResponse {
	statuses?: string[];
}

export default function BookPoojaPage() {
	const router = useRouter();
	const [services, setServices] = useState<PoojaService[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [selectedStatus, setSelectedStatus] = useState("Active");
	const [selectedPriceRange, setSelectedPriceRange] = useState("all");
	const [statusOptions, setStatusOptions] = useState<string[]>([]);

	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const isFetchingRef = useRef(false);
	const activeFilterKeyRef = useRef("");

	const activeFilterKey = useMemo(
		() => `${debouncedSearchQuery}|${selectedStatus}|${selectedPriceRange}`,
		[debouncedSearchQuery, selectedStatus, selectedPriceRange]
	);
	const availableStatusOptions = useMemo(() => {
		return Array.from(new Set(["Active", ...statusOptions])).sort((a, b) =>
			a.localeCompare(b)
		);
	}, [statusOptions]);

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
		setSelectedStatus("Active");
		setSelectedPriceRange("all");
	}, []);

	const fetchFilterOptions = useCallback(async () => {
		try {
			const response = await fetch("/api/pooja-categories?filtersOnly=true");
			if (!response.ok) throw new Error("Failed to fetch filter options");

			const data: PoojaFilterResponse = await response.json();
			const statuses = Array.isArray(data.statuses)
				? data.statuses.filter((status) => Boolean(status?.trim()))
				: [];

			setStatusOptions(statuses);
		} catch (err) {
			console.error("Error fetching pooja category filters:", err);
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
				});

				if (debouncedSearchQuery) {
					params.set("search", debouncedSearchQuery);
				}
				if (selectedStatus !== "all") {
					params.set("status", selectedStatus);
				}

				switch (selectedPriceRange) {
					case "under-1000":
						params.set("maxPrice", "1000");
						break;
					case "1000-5000":
						params.set("minPrice", "1000");
						params.set("maxPrice", "5000");
						break;
					case "above-5000":
						params.set("minPrice", "5000");
						break;
					default:
						break;
				}

				const response = await fetch(`/api/pooja-categories?${params.toString()}`);
				if (!response.ok) {
					throw new Error("Failed to fetch pooja services");
				}

				const data = await response.json();
				if (fetchKey !== activeFilterKeyRef.current) return;

				const categories: PoojaService[] = Array.isArray(data?.categories)
					? data.categories
					: [];

				const normalizedServices = categories.map(
					(cat: {
						id: string;
						name?: string;
						description?: string;
						price?: number;
						images?: string[];
						status?: string;
					}) => ({
						id: cat.id,
						name: cat.name || "Pooja Service",
						description:
							cat.description ||
							"Traditional pooja service performed with devotion.",
						price: cat.price,
						images: cat.images && cat.images.length > 0 ? cat.images : [],
						status: cat.status || "Inactive",
					})
				);

				setServices((prev) =>
					isFirstPage ? normalizedServices : [...prev, ...normalizedServices]
				);

				if (typeof data?.total === "number") {
					setTotalCount(data.total);
				} else if (isFirstPage) {
					setTotalCount(normalizedServices.length);
				}

				const totalPages: number =
					typeof data?.pagination?.totalPages === "number"
						? data.pagination.totalPages
						: nextPage;

				setPage(nextPage);
				setHasMore(nextPage < totalPages);
			} catch (err) {
				console.error("Error fetching pooja services:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load pooja services"
				);
			} finally {
				if (isFirstPage) {
					setLoading(false);
				} else {
					setLoadingMore(false);
				}
				isFetchingRef.current = false;
			}
		},
		[activeFilterKey, debouncedSearchQuery, selectedPriceRange, selectedStatus]
	);

	useEffect(() => {
		void fetchFilterOptions();
	}, [fetchFilterOptions]);

	useEffect(() => {
		setServices([]);
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
				pageSlug="book-pooja"
				title="Book Pooja"
				description="Discover and book traditional pooja services from experienced panditjis"
				alt="Book Pooja Banner"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up"
			/>

			{/* Pooja Services Cards Section */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					<div className="mb-8 rounded-2xl border border-white/50 bg-white/35 p-3 md:p-4 backdrop-blur-xl shadow-[0_10px_28px_rgba(40,32,20,0.12)]">
						<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
							<div className="relative w-full lg:flex-[1.2]">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8b9c]" />
								<Input
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search pooja service by name or description"
									className="h-11 rounded-xl border-white/60 bg-white/55 pl-10 text-[#243142] placeholder:text-[#738295] focus-visible:border-white/80 focus-visible:ring-white/70"
									aria-label="Search pooja services"
								/>
							</div>
							<Select value={selectedStatus} onValueChange={setSelectedStatus}>
								<SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295] sm:w-[200px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All statuses</SelectItem>
									{availableStatusOptions.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={selectedPriceRange}
								onValueChange={setSelectedPriceRange}
							>
								<SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295] sm:w-[200px]">
									<SelectValue placeholder="Filter by price" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All prices</SelectItem>
									<SelectItem value="under-1000">Under Rs. 1000</SelectItem>
									<SelectItem value="1000-5000">Rs. 1000 - Rs. 5000</SelectItem>
									<SelectItem value="above-5000">Above Rs. 5000</SelectItem>
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
							Showing {services.length} of {totalCount} pooja services
						</p>
					</div>

					{loading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-muted-foreground">Loading pooja services...</p>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-500">{error}</p>
						</div>
					) : services.length > 0 ? (
						<>
							<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
								{services.map((service) => (
									<ProfileCard
										key={service.id}
										variant="pooja-service"
										name={service.name}
										description={service.description}
										price={service.price}
										image={
											service.images && service.images.length > 0
												? service.images[0]
												: undefined
										}
										isVerified={service.status === "Active"}
										isBooking={bookingServiceId === service.id}
										onBook={() => {
											setBookingServiceId(service.id);
											router.push(`/book-pooja/${service.id}`);
										}}
										enableAnimations
									/>
								))}
							</div>

							{loadingMore && (
								<div className="flex flex-col items-center justify-center py-8">
									<Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
									<p className="text-sm text-muted-foreground">
										Loading more pooja services...
									</p>
								</div>
							)}

							{!hasMore && services.length > 0 && (
								<div className="text-center py-8 text-sm text-muted-foreground">
									You have reached the end.
								</div>
							)}

							<div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
						</>
					) : (
						<div className="text-center py-16 text-gray-500">
							<p className="text-xl">
								No pooja services match your search or filters.
							</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
