"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";

interface PoojaService {
	id: string;
	name: string;
	description: string;
	price?: number;
	images?: string[];
	status?: string;
}

export default function BookPoojaPage() {
	const router = useRouter();
	const [services, setServices] = useState<PoojaService[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [bookingServiceId, setBookingServiceId] = useState<string | null>(null);

	useEffect(() => {
		const fetchPoojaServices = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch("/api/pooja-categories?page=1&limit=1000");
				if (!response.ok) {
					throw new Error("Failed to fetch pooja services");
				}
				const data = await response.json();
				const categories = data.categories || [];

				// Filter only active services
				const activeServices: PoojaService[] = categories
					.filter((cat: { status?: string }) => cat.status === "Active")
					.map((cat: { id: string; name?: string; description?: string; price?: number; images?: string[]; status?: string }) => ({
						id: cat.id,
						name: cat.name || "Pooja Service",
						description: cat.description || "Traditional pooja service performed with devotion.",
						price: cat.price,
						images: cat.images && cat.images.length > 0 ? cat.images : [],
						status: cat.status || "Active",
					}));

				setServices(activeServices);
			} catch (err) {
				console.error("Error fetching pooja services:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to load pooja services"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchPoojaServices();
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Banner Section with Text Overlay */}
			<section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
				{/* Banner Image */}
				<div className="absolute inset-0">
					<Image
						src="/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg"
						alt="Book Pooja Banner"
						fill
						className="object-cover"
						priority
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							target.src = "/landing-page/amritsar-6185143.jpg";
						}}
					/>
					{/* Dark overlay for better text readability */}
					<div className="absolute inset-0 bg-black/40" />
				</div>

				{/* Text Overlay */}
				<div className="relative z-10 h-full flex items-center justify-center">
					<div className="container mx-auto px-4 text-center">
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up">
							Book Pooja
						</h1>
						<p className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
							Discover and book traditional pooja services from experienced panditjis
						</p>
					</div>
				</div>
			</section>

			{/* Pooja Services Cards Section */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
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
						<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
							{services.map((service) => (
								<ProfileCard
									key={service.id}
									variant="pooja-service"
									name={service.name}
									description={service.description}
									price={service.price}
									image={service.images && service.images.length > 0 ? service.images[0] : undefined}
									isVerified={service.status === "Active"}
									isBooking={bookingServiceId === service.id}
									onBook={() => {
										setBookingServiceId(service.id);
										router.push(`/book-pooja/${service.id}`);
									}}
									enableAnimations={true}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-16 text-gray-500">
							<p className="text-xl">No pooja services available at the moment.</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
