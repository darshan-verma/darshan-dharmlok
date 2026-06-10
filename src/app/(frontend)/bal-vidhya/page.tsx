"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, BookOpen } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { PageBanner } from "@/components/shared/PageBanner";
import { ProfileCard } from "@/components/ui/profile-card";
import {
	BalVidhyaViewer,
	type BalVidhyaItem,
} from "./components/BalVidhyaViewer";
import { SimpleSearchFilterBar } from "@/components/shared/SimpleSearchFilterBar";

const PAGE_SIZE = 24;

export default function BalVidhyaPage() {
	const [items, setItems] = useState<BalVidhyaItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [viewerItem, setViewerItem] = useState<BalVidhyaItem | null>(null);
	const [viewerOpen, setViewerOpen] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [selectedReligiousCategory, setSelectedReligiousCategory] = useState("all");

	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const isFetchingRef = useRef(false);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 300);
		return () => window.clearTimeout(timer);
	}, [searchQuery]);

	const handleReligiousCategoryChange = (value: string) => {
		setSelectedReligiousCategory(value);
		setItems([]);
		setPage(0);
		setHasMore(true);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setItems([]);
		setPage(0);
		setHasMore(true);
	};

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedReligiousCategory("all");
		setItems([]);
		setPage(0);
		setHasMore(true);
	};

	const fetchPage = useCallback(async (nextPage: number) => {
		// Prevent overlapping calls from observer + state updates.
		if (isFetchingRef.current) return;
		isFetchingRef.current = true;
		const isFirstPage = nextPage === 1;

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
			if (selectedReligiousCategory !== "all") {
				params.set("religiousCategory", selectedReligiousCategory);
			}
			if (debouncedSearchQuery) {
				params.set("search", debouncedSearchQuery);
			}
			const res = await fetch(`/api/balvidhya?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch Bal Vidhya content");

			const data = await res.json();
			const content: BalVidhyaItem[] = data?.content ?? [];
			const active = content.filter(
				(item: { status?: string }) => item.status === "Active"
			);

			setItems((prev) => (isFirstPage ? active : [...prev, ...active]));

			const totalPages: number =
				typeof data?.pagination?.totalPages === "number"
					? data.pagination.totalPages
					: nextPage;

			setPage(nextPage);
			setHasMore(nextPage < totalPages);
		} catch (err) {
			console.error("Error fetching Bal Vidhya:", err);
			setError(
				err instanceof Error ? err.message : "Failed to load Bal Vidhya content"
			);
		} finally {
			if (isFirstPage) {
				setLoading(false);
			} else {
				setLoadingMore(false);
			}
			isFetchingRef.current = false;
		}
	}, [selectedReligiousCategory, debouncedSearchQuery]);

	useEffect(() => {
		setItems([]);
		setPage(0);
		setHasMore(true);
		void fetchPage(1);
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

	const openViewer = async (item: BalVidhyaItem) => {
		setViewerItem(item);
		setViewerOpen(true);

		// Count a real impression when a user opens item details.
		try {
			const res = await fetch(`/api/balvidhya/${item.id}/impression`, {
				method: "POST",
			});
			if (!res.ok) return;
			const data: { id: string; impressions: number } = await res.json();
			setItems((prev) =>
				prev.map((entry) =>
					entry.id === data.id ? { ...entry, impressions: data.impressions } : entry
				)
			);
			setViewerItem((prev) =>
				prev && prev.id === data.id
					? { ...prev, impressions: data.impressions }
					: prev
			);
		} catch (error) {
			console.error("Failed to track Bal Vidhya impression:", error);
		}
	};

	return (
		<div className="min-h-screen bg-white">
			<Header />

			<PageBanner
				pageSlug="bal-vidhya"
				title="Bal Vidhya"
				description="Educational content, books and videos for children"
				alt="Bal Vidhya Banner"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up"
			/>

			{/* Content cards */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					<SimpleSearchFilterBar
						page="bal-vidhya"
						searchQuery={searchQuery}
						onSearchChange={handleSearchChange}
						searchPlaceholder="Search by name or description"
						religiousValue={selectedReligiousCategory}
						onReligiousChange={handleReligiousCategoryChange}
						onClear={clearFilters}
						resultText={
							!loading && !error
								? `${items.length} item${items.length !== 1 ? "s" : ""} loaded`
								: undefined
						}
					/>
					{loading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-muted-foreground">Loading Bal Vidhya content...</p>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-500">{error}</p>
						</div>
					) : items.length > 0 ? (
						<>
							<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
								{items.map((item) => (
									<div key={item.id} className="w-full max-w-[380px]">
										<ProfileCard
											variant="dharamshala"
											name={item.name}
											description={
												item.description?.slice(0, 120) ||
												`${item.type === "book" ? "Book" : "Video"} • ${item.category ?? "Other"}`
											}
											image={item.thumbnailUrl}
											isVerified={item.status === "Active"}
											followers={item.impressions ?? 0}
											followersLabel="Impressions"
											showSecondaryStat={false}
											onBook={() => void openViewer(item)}
											enableAnimations
											className="w-full max-w-[380px] h-[28rem] min-h-[28rem]"
										/>
									</div>
								))}
							</div>

							{loadingMore && (
								<div className="flex flex-col items-center justify-center py-8">
									<Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
									<p className="text-sm text-muted-foreground">
										Loading more content...
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
							<BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-400" />
							<p className="text-xl">No Bal Vidhya content available at the moment.</p>
						</div>
					)}
				</div>
			</section>

			<BalVidhyaViewer
				item={viewerItem}
				open={viewerOpen}
				onOpenChange={setViewerOpen}
			/>

			<Footer />
		</div>
	);
}
