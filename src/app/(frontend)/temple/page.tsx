"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageBanner } from "@/components/shared/PageBanner";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Search, X } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
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

interface Temple {
	id: string;
	name: string;
	state?: string;
	city?: string;
	status: string;
	address?: string;
	bannerImage?: string;
	coverImage?: string;
	imageFile?: string[];
}

interface FilterLocation {
	state: string;
	city: string;
}

export default function TemplePage() {
	const router = useRouter();
	const [items, setItems] = useState<Temple[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [navigatingId, setNavigatingId] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [selectedState, setSelectedState] = useState("all");
	const [selectedCity, setSelectedCity] = useState("all");
	const [filterLocations, setFilterLocations] = useState<FilterLocation[]>([]);

	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const isFetchingRef = useRef(false);
	const activeFilterKeyRef = useRef("");

	const activeFilterKey = useMemo(
		() => `${debouncedSearchQuery}|${selectedState}|${selectedCity}`,
		[debouncedSearchQuery, selectedState, selectedCity]
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

	const stateOptions = useMemo(() => {
		return Array.from(
			new Set(
				filterLocations
					.map((location) => location.state?.trim())
					.filter((value): value is string => Boolean(value))
			)
		).sort((a, b) => a.localeCompare(b));
	}, [filterLocations]);

	const cityOptions = useMemo(() => {
		const baseLocations =
			selectedState === "all"
				? filterLocations
				: filterLocations.filter(
						(location) => location.state?.trim() === selectedState
					);

		return Array.from(
			new Set(
				baseLocations
					.map((location) => location.city?.trim())
					.filter((value): value is string => Boolean(value))
			)
		).sort((a, b) => a.localeCompare(b));
	}, [filterLocations, selectedState]);

	const clearFilters = useCallback(() => {
		setSearchQuery("");
		setSelectedState("all");
		setSelectedCity("all");
	}, []);

	const fetchFilterOptions = useCallback(async () => {
		try {
			const res = await fetch("/api/temple?filtersOnly=true&status=Active");
			if (!res.ok) throw new Error("Failed to fetch filter options");

			const data = await res.json();
			const locations: FilterLocation[] = Array.isArray(data?.locations)
				? data.locations
				: [];

			setFilterLocations(
				locations.map((location) => ({
					state: location.state?.trim() || "",
					city: location.city?.trim() || "",
				}))
			);
		} catch (err) {
			console.error("Error fetching temple filters:", err);
		}
	}, []);

	const fetchPage = useCallback(async (nextPage: number, force = false) => {
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
			if (selectedState !== "all") {
				params.set("state", selectedState);
			}
			if (selectedCity !== "all") {
				params.set("city", selectedCity);
			}

			const res = await fetch(`/api/temple?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch temples");

			const data = await res.json();
			if (fetchKey !== activeFilterKeyRef.current) return;

			const content: Temple[] = Array.isArray(data?.content) ? data.content : [];

			setItems((prev) => (isFirstPage ? content : [...prev, ...content]));

			if (typeof data?.total === "number") {
				setTotalCount(data.total);
			} else if (isFirstPage) {
				setTotalCount(content.length);
			}

			const totalPages: number =
				typeof data?.pagination?.totalPages === "number"
					? data.pagination.totalPages
					: nextPage;

			setPage(nextPage);
			setHasMore(nextPage < totalPages);
		} catch (err) {
			console.error("Error fetching temples:", err);
			setError(err instanceof Error ? err.message : "Failed to load temples");
			} finally {
			if (isFirstPage) {
				setLoading(false);
			} else {
				setLoadingMore(false);
			}
			isFetchingRef.current = false;
			}
	}, [activeFilterKey, debouncedSearchQuery, selectedCity, selectedState]);

	useEffect(() => {
		void fetchFilterOptions();
	}, [fetchFilterOptions]);

	useEffect(() => {
		setItems([]);
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
				pageSlug="temple"
				title="Temples"
				description="Discover sacred temples and plan your visit"
				alt="Temples Banner"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl"
			/>

			{/* Cards */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					<div className="mb-8 rounded-2xl border border-white/50 bg-white/35 p-3 md:p-4 backdrop-blur-xl shadow-[0_10px_28px_rgba(40,32,20,0.12)]">
						<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
							<div className="relative w-full lg:flex-[1.2]">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8b9c]" />
								<Input
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search temple name or city"
									className="h-11 rounded-xl border-white/60 bg-white/55 pl-10 text-[#243142] placeholder:text-[#738295] focus-visible:border-white/80 focus-visible:ring-white/70"
									aria-label="Search temples"
								/>
							</div>
							<Select
								value={selectedState}
								onValueChange={(value) => {
									setSelectedState(value);
									setSelectedCity("all");
								}}
							>
								<SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295] sm:w-[200px]">
									<SelectValue placeholder="Filter by state" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All states</SelectItem>
									{stateOptions.map((state) => (
										<SelectItem key={state} value={state}>
											{state}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select value={selectedCity} onValueChange={setSelectedCity}>
								<SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295] sm:w-[200px]">
									<SelectValue placeholder="Filter by city" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All cities</SelectItem>
									{cityOptions.map((city) => (
										<SelectItem key={city} value={city}>
											{city}
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
							Showing {items.length} of {totalCount} temples
						</p>
					</div>

					{loading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-muted-foreground">Loading temples...</p>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-500">{error}</p>
						</div>
					) : items.length > 0 ? (
						<>
							<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
								{items.map((t) => {
									const image =
										t.bannerImage ||
										t.coverImage ||
										(t.imageFile && t.imageFile.length > 0 ? t.imageFile[0] : undefined);
									const subtitle = t.address || [t.city, t.state].filter(Boolean).join(", ");
									return (
										<ProfileCard
											key={t.id}
											variant="temple"
											name={t.name}
											description={subtitle || "A sacred place for prayer and devotion."}
											image={image}
											isVerified={t.status === "Active"}
											isBooking={navigatingId === t.id}
											onBook={() => {
												setNavigatingId(t.id);
												router.push(`/temple/${t.id}`);
											}}
											enableAnimations
										/>
									);
								})}
							</div>

							{loadingMore && (
								<div className="flex flex-col items-center justify-center py-8">
									<Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
									<p className="text-sm text-muted-foreground">
										Loading more temples...
									</p>
								</div>
							)}

							{!hasMore && items.length > 0 && (
								<div className="text-center py-8 text-sm text-muted-foreground">
									You have reached the end.
								</div>
							)}

							<div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
						</>
					) : (
						<div className="text-center py-16 text-gray-500">
							<MapPin className="w-10 h-10 mx-auto mb-3 text-gray-400" />
							<p className="text-xl">No temples match your search or filters.</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}

