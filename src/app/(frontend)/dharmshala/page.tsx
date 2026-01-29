"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";

interface Dharamshala {
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

export default function DharmshalaPage() {
	const router = useRouter();
	const [items, setItems] = useState<Dharamshala[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [navigatingId, setNavigatingId] = useState<string | null>(null);

	useEffect(() => {
		const fetchDharamshalas = async () => {
			try {
				setLoading(true);
				setError(null);

				const res = await fetch("/api/dharamshala");
				if (!res.ok) throw new Error("Failed to fetch dharamshalas");
				const data = await res.json();
				const all: Dharamshala[] = Array.isArray(data) ? data : [];
				setItems(all.filter((d) => d.status === "Active"));
			} catch (err) {
				console.error("Error fetching dharamshalas:", err);
				setError(err instanceof Error ? err.message : "Failed to load dharamshalas");
			} finally {
				setLoading(false);
			}
		};

		fetchDharamshalas();
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<Header />

			<PageBanner
				pageSlug="dharmshala"
				title="Dharmshalas"
				description="Find comfortable dharamshala stays for your spiritual journey"
				alt="Dharmshala Banner"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl"
			/>

			{/* Cards */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					{loading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-muted-foreground">Loading dharamshalas...</p>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-500">{error}</p>
						</div>
					) : items.length > 0 ? (
						<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
							{items.map((d) => {
								const image =
									d.bannerImage ||
									d.coverImage ||
									(d.imageFile && d.imageFile.length > 0 ? d.imageFile[0] : undefined);
								const subtitle = d.address || [d.city, d.state].filter(Boolean).join(", ");
								return (
									<ProfileCard
										key={d.id}
										variant="dharamshala"
										name={d.name}
										description={subtitle || "Comfortable stay near spiritual destinations."}
										image={image}
										isVerified={d.status === "Active"}
										isBooking={navigatingId === d.id}
										onBook={() => {
											setNavigatingId(d.id);
											router.push(`/dharmshala/${d.id}`);
										}}
										enableAnimations
									/>
								);
							})}
						</div>
					) : (
						<div className="text-center py-16 text-gray-500">
							<MapPin className="w-10 h-10 mx-auto mb-3 text-gray-400" />
							<p className="text-xl">No dharamshalas available at the moment.</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}

