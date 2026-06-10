"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, BookOpen, Search, X } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";
import { ReligiousCategoryFilter } from "@/components/shared/ReligiousCategoryFilter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardsPagination, CARDS_PER_PAGE } from "@/components/shared/CardsPagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	EbookViewer,
	type EbookItem,
} from "./components/EbookViewer";

interface EbookApiItem {
	id: string;
	title: string;
	date: string;
	description: string;
	type: string;
	category: string;
	detail?: string;
	status: string;
	bookCover?: string;
	bookFile?: string;
	createdAt?: string;
	updatedAt?: string;
}

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalCount: number;
}

export default function EBookPage() {
	const [books, setBooks] = useState<EbookItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [viewerItem, setViewerItem] = useState<EbookItem | null>(null);
	const [viewerOpen, setViewerOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedReligiousCategory, setSelectedReligiousCategory] = useState("all");
	const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 300);
		return () => window.clearTimeout(timer);
	}, [searchQuery]);

	const fetchCategoryOptions = useCallback(async () => {
		try {
			const res = await fetch("/api/ebook?page=1&limit=500&status=Active");
			if (!res.ok) return;
			const data = await res.json();
			const content: EbookApiItem[] = data?.content ?? [];
			const categories = Array.from(
				new Set(
					content
						.map((item) => item.category?.trim())
						.filter((value): value is string => Boolean(value))
				)
			).sort((a, b) => a.localeCompare(b));
			setCategoryOptions(categories);
		} catch (err) {
			console.error("Error fetching e-book categories:", err);
		}
	}, []);

	useEffect(() => {
		void fetchCategoryOptions();
	}, [fetchCategoryOptions]);

	useEffect(() => {
		const fetchEbooks = async () => {
			try {
				setLoading(true);
				setError(null);

				const params = new URLSearchParams({
					page: String(currentPage),
					limit: String(CARDS_PER_PAGE),
					status: "Active",
				});
				if (selectedCategory !== "all") {
					params.set("category", selectedCategory);
				}
				if (selectedReligiousCategory !== "all") {
					params.set("religiousCategory", selectedReligiousCategory);
				}
				if (debouncedSearchQuery) {
					params.set("search", debouncedSearchQuery);
				}

				const res = await fetch(`/api/ebook?${params.toString()}`);
				if (!res.ok) throw new Error("Failed to fetch e-books");
				const data = await res.json();
				const content: EbookApiItem[] = (
					(data?.content ?? []) as EbookApiItem[]
				).filter((item) => item.status === "Active");

				setBooks(
					content.map((e) => ({
						id: e.id,
						title: e.title,
						description: e.description,
						bookCover: e.bookCover,
						bookFile: e.bookFile,
						status: e.status,
					}))
				);

				if (data?.pagination) {
					setPagination({
						currentPage: data.pagination.currentPage,
						totalPages: data.pagination.totalPages,
						totalCount: data.total ?? content.length,
					});
				}
			} catch (err) {
				console.error("Error fetching e-books:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load e-books"
				);
			} finally {
				setLoading(false);
			}
		};

		void fetchEbooks();
	}, [currentPage, selectedCategory, selectedReligiousCategory, debouncedSearchQuery]);

	useEffect(() => {
		if (currentPage > 1) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentPage]);

	const handleCategoryChange = (value: string) => {
		setSelectedCategory(value);
		setCurrentPage(1);
	};

	const handleReligiousCategoryChange = (value: string) => {
		setSelectedReligiousCategory(value);
		setCurrentPage(1);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);
		setCurrentPage(1);
	};

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedCategory("all");
		setSelectedReligiousCategory("all");
		setCurrentPage(1);
	};

	const openViewer = (item: EbookItem) => {
		setViewerItem(item);
		setViewerOpen(true);
	};

	return (
		<div className="min-h-screen bg-white">
			<Header />

			<PageBanner
				pageSlug="e-book"
				title="E-Books"
				description="Read spiritual and devotional books online"
				alt="E-Books Banner"
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
									onChange={(e) => handleSearchChange(e.target.value)}
									placeholder="Search e-books by title"
									className="h-11 rounded-xl border-white/60 bg-white/55 pl-10 text-[#243142] placeholder:text-[#738295] focus-visible:border-white/80 focus-visible:ring-white/70"
									aria-label="Search e-books"
								/>
							</div>

							<Select value={selectedCategory} onValueChange={handleCategoryChange}>
								<SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295] sm:w-[200px]">
									<SelectValue placeholder="All genres" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All genres</SelectItem>
									{categoryOptions.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<ReligiousCategoryFilter
								variant="select"
								hideLabel
								allLabel="All traditions"
								value={selectedReligiousCategory}
								onChange={handleReligiousCategoryChange}
								page="e-book"
								className="w-full sm:w-[200px]"
								selectClassName="h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295]"
							/>

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

						{pagination && (
							<p className="mt-3 text-sm text-[#65778f]">
								{pagination.totalCount} e-book{pagination.totalCount !== 1 ? "s" : ""} found
							</p>
						)}
					</div>

					{loading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-muted-foreground">Loading e-books...</p>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-500">{error}</p>
						</div>
					) : books.length > 0 ? (
						<>
							<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
								{books.map((book) => (
									<div key={book.id} className="w-full max-w-[380px]">
										<ProfileCard
											variant="ebook"
											name={book.title}
											description={
												book.description?.slice(0, 120) || "Read this book online"
											}
											image={book.bookCover}
											isVerified={book.status === "Active"}
											onBook={() => openViewer(book)}
											enableAnimations
											className="w-full max-w-[380px] h-[28rem] min-h-[28rem]"
										/>
									</div>
								))}
							</div>
							{pagination && (
								<CardsPagination
									currentPage={pagination.currentPage}
									totalPages={pagination.totalPages}
									totalCount={pagination.totalCount}
									onPageChange={setCurrentPage}
								/>
							)}
						</>
					) : (
						<div className="text-center py-16 text-gray-500">
							<BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-400" />
							<p className="text-xl">No e-books match your filters.</p>
						</div>
					)}
				</div>
			</section>

			<EbookViewer
				item={viewerItem}
				open={viewerOpen}
				onOpenChange={setViewerOpen}
			/>

			<Footer />
		</div>
	);
}
