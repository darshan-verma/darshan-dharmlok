"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";
import { extractPlainTextFromBlockNote } from "@/lib/blog-content";
import { SimpleSearchFilterBar } from "@/components/shared/SimpleSearchFilterBar";
import { CardsPagination, CARDS_PER_PAGE } from "@/components/shared/CardsPagination";

interface Blog {
	id: string;
	title: string;
	content: string;
	coverImage?: string;
	bannerImage?: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

export default function BlogsPage() {
	const router = useRouter();
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [readingBlogId, setReadingBlogId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [selectedReligiousCategory, setSelectedReligiousCategory] = useState("all");

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 300);
		return () => window.clearTimeout(timer);
	}, [searchQuery]);

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
		setSelectedReligiousCategory("all");
		setCurrentPage(1);
	};

	useEffect(() => {
		const fetchBlogs = async () => {
			try {
				setLoading(true);
				setError(null);
				const params = new URLSearchParams({
					page: String(currentPage),
					limit: String(CARDS_PER_PAGE),
					status: "Active",
				});
				if (selectedReligiousCategory !== "all") {
					params.set("religiousCategory", selectedReligiousCategory);
				}
				if (debouncedSearchQuery) {
					params.set("search", debouncedSearchQuery);
				}
				const response = await fetch(`/api/blogs?${params.toString()}`);
				if (!response.ok) {
					throw new Error("Failed to fetch blogs");
				}
				const data = await response.json();
				const content = data.content || [];
				const activeBlogs: Blog[] = content.map((b: Blog) => ({
					id: b.id,
					title: b.title,
					content: b.content,
					coverImage: b.coverImage,
					bannerImage: b.bannerImage,
					status: b.status,
					createdAt: b.createdAt,
					updatedAt: b.updatedAt,
				}));
				setBlogs(activeBlogs);
				setTotalCount(data.total ?? activeBlogs.length);
				setTotalPages(data.pagination?.totalPages ?? 1);
			} catch (err) {
				console.error("Error fetching blogs:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load blogs"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchBlogs();
	}, [currentPage, selectedReligiousCategory, debouncedSearchQuery]);

	useEffect(() => {
		if (currentPage > 1) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentPage]);

	return (
		<div className="min-h-screen bg-white">
			<Header />

			<PageBanner
				pageSlug="blogs"
				title="Blogs"
				description="Read articles and insights on spirituality and devotion"
				alt="Blogs Banner"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up"
			/>

			{/* Blogs Cards Section */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					<SimpleSearchFilterBar
						page="blogs"
						searchQuery={searchQuery}
						onSearchChange={handleSearchChange}
						searchPlaceholder="Search blogs by title"
						religiousValue={selectedReligiousCategory}
						onReligiousChange={handleReligiousCategoryChange}
						onClear={clearFilters}
						resultText={`${totalCount} blog${totalCount !== 1 ? "s" : ""} found`}
					/>
					{loading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-muted-foreground">Loading blogs...</p>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-500">{error}</p>
						</div>
					) : blogs.length > 0 ? (
						<>
							<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
								{blogs.map((blog) => (
									<ProfileCard
										key={blog.id}
										variant="blog"
										name={blog.title}
										description={extractPlainTextFromBlockNote(
											blog.content,
											120
										)}
										image={blog.coverImage}
										isVerified={blog.status === "Active"}
										isBooking={readingBlogId === blog.id}
										onBook={() => {
											setReadingBlogId(blog.id);
											router.push(`/blogs/${blog.id}`);
										}}
										enableAnimations={true}
									/>
								))}
							</div>
							<CardsPagination
								currentPage={currentPage}
								totalPages={totalPages}
								totalCount={totalCount}
								onPageChange={setCurrentPage}
							/>
						</>
					) : (
						<div className="text-center py-16 text-gray-500">
							<p className="text-xl">
								No blogs available at the moment.
							</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
