"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, BookOpen } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import {
	BalVidhyaViewer,
	type BalVidhyaItem,
} from "./components/BalVidhyaViewer";

export default function BalVidhyaPage() {
	const [items, setItems] = useState<BalVidhyaItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [viewerItem, setViewerItem] = useState<BalVidhyaItem | null>(null);
	const [viewerOpen, setViewerOpen] = useState(false);

	useEffect(() => {
		const fetchBalVidhya = async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await fetch("/api/balvidhya?limit=100");
				if (!res.ok) throw new Error("Failed to fetch Bal Vidhya content");
				const data = await res.json();
				const content: BalVidhyaItem[] = data?.content ?? [];
				const active = content.filter(
					(item) => (item as { status?: string }).status === "Active"
				);
				setItems(active);
			} catch (err) {
				console.error("Error fetching Bal Vidhya:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load Bal Vidhya content"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchBalVidhya();
	}, []);

	const openViewer = (item: BalVidhyaItem) => {
		setViewerItem(item);
		setViewerOpen(true);
	};

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Banner */}
			<section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
				<div className="absolute inset-0">
					<Image
						src="/services/bal-vidhya.jpg"
						alt="Bal Vidhya Banner"
						fill
						className="object-cover"
						priority
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							target.src = "/landing-page/amritsar-6185143.jpg";
						}}
					/>
					<div className="absolute inset-0 bg-black/40" />
				</div>

				<div className="relative z-10 h-full flex items-center justify-center">
					<div className="container mx-auto px-4 text-center">
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up">
							Bal Vidhya
						</h1>
						<p
							className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light"
							style={{ fontFamily: "var(--font-jost), sans-serif" }}
						>
							Educational content, books and videos for children
						</p>
					</div>
				</div>
			</section>

			{/* Content cards */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
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
										onBook={() => openViewer(item)}
										enableAnimations
										className="w-full max-w-[380px] h-[28rem] min-h-[28rem]"
									/>
								</div>
							))}
						</div>
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
