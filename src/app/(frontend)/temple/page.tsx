"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";

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

export default function TemplePage() {
	const router = useRouter();
	const [items, setItems] = useState<Temple[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [navigatingId, setNavigatingId] = useState<string | null>(null);

	useEffect(() => {
		const fetchTemples = async () => {
			try {
				setLoading(true);
				setError(null);

				const res = await fetch("/api/temple");
				if (!res.ok) throw new Error("Failed to fetch temples");
				const data = await res.json();
				const all: Temple[] = Array.isArray(data) ? data : [];
				setItems(all.filter((t) => t.status === "Active"));
			} catch (err) {
				console.error("Error fetching temples:", err);
				setError(err instanceof Error ? err.message : "Failed to load temples");
			} finally {
				setLoading(false);
			}
		};

		fetchTemples();
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Banner */}
			<section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
				<div className="absolute inset-0">
					<Image
						src="/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg"
						alt="Temples Banner"
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
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl">
							Temples
						</h1>
						<p
							className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light"
							style={{ fontFamily: "var(--font-jost), sans-serif" }}
						>
							Discover sacred temples and plan your visit
						</p>
					</div>
				</div>
			</section>

			{/* Cards */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
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
					) : (
						<div className="text-center py-16 text-gray-500">
							<MapPin className="w-10 h-10 mx-auto mb-3 text-gray-400" />
							<p className="text-xl">No temples available at the moment.</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}

