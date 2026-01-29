"use client";

import { useEffect, useState } from "react";
import { Loader2, BookOpen } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";
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

export default function EBookPage() {
	const [books, setBooks] = useState<EbookItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [viewerItem, setViewerItem] = useState<EbookItem | null>(null);
	const [viewerOpen, setViewerOpen] = useState(false);

	useEffect(() => {
		const fetchEbooks = async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await fetch("/api/ebook?page=1&limit=100");
				if (!res.ok) throw new Error("Failed to fetch e-books");
				const data = await res.json();
				const content: EbookApiItem[] = data?.content ?? [];
				const active = content.filter(
					(item) => item.status === "Active"
				);
				setBooks(
					active.map((e) => ({
						id: e.id,
						title: e.title,
						description: e.description,
						bookCover: e.bookCover,
						bookFile: e.bookFile,
						status: e.status,
					}))
				);
			} catch (err) {
				console.error("Error fetching e-books:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load e-books"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchEbooks();
	}, []);

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

			{/* Book cards */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
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
					) : (
						<div className="text-center py-16 text-gray-500">
							<BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-400" />
							<p className="text-xl">No e-books available at the moment.</p>
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
