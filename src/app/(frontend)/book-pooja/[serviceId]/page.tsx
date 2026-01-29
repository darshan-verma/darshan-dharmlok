"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { KathavachakDharmguruCard } from "@/components/shared/kathavachak-dharmguru-card";
import { CardsPagination, CARDS_PER_PAGE } from "@/components/shared/CardsPagination";

interface PoojaService {
	id: string;
	name: string;
	description: string;
	price?: number;
	images?: string[];
	status?: string;
}

interface Panditji {
	id: string;
	name: string;
	profileImageUrl?: string;
	bannerImageUrl?: string;
	bio?: string;
	description?: string;
	category?: string;
	rank?: string;
	phone?: string;
	email?: string;
	addresses?: Array<{
		city?: string;
		state?: string;
		country?: string;
		type?: string;
	}>;
	serviceOffering?: {
		id: string;
		price: number;
		details?: string;
	};
}

interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalCount: number;
}

export default function BookPoojaServicePage() {
	const params = useParams();
	const router = useRouter();
	const serviceId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;

	const [service, setService] = useState<PoojaService | null>(null);
	const [panditjis, setPanditjis] = useState<Panditji[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingCardId, setLoadingCardId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);

	// Fetch service details
	useEffect(() => {
		if (!serviceId) return;

		const fetchService = async () => {
			try {
				const response = await fetch(`/api/pooja-categories/${serviceId}`);
				if (!response.ok) {
					throw new Error("Failed to fetch service details");
				}
				const data = await response.json();
				setService({
					id: data.id,
					name: data.name || "Pooja Service",
					// Some APIs may store text in `details`, so fallback for frontend display
					description: data.description || data.details || "",
					price: data.price,
					images: data.images || [],
					status: data.status || "Active",
				});
			} catch (err) {
				console.error("Error fetching service:", err);
			}
		};

		fetchService();
	}, [serviceId]);

	// Fetch panditjis offering this service
	useEffect(() => {
		if (!serviceId) return;

		const fetchPanditjis = async () => {
			setLoading(true);
			try {
				// First, get all service offerings for this pooja category
				const offeringsResponse = await fetch(
					`/api/service-offerings?targetType=PoojaCategory&targetId=${serviceId}`
				);
				if (!offeringsResponse.ok) {
					throw new Error("Failed to fetch service offerings");
				}
				const offeringsData = await offeringsResponse.json();
				// Filter only active offerings
				const offerings = (offeringsData.offerings || []).filter(
					(o: { status?: string }) => o.status === "Active"
				);

				// Get unique provider IDs
				const providerIds: string[] = Array.from(
					new Set(offerings.map((o: { providerId: string }) => o.providerId))
				);

				if (providerIds.length === 0) {
					setPanditjis([]);
					setPagination(null);
					setLoading(false);
					return;
				}

				// Fetch panditji details for each provider
				const panditjiPromises = providerIds.map(async (providerId: string) => {
					try {
						const panditjiResponse = await fetch(`/api/users/${providerId}`);
						if (!panditjiResponse.ok) return null;
						const panditjiData = await panditjiResponse.json();
						
						// Find the offering for this service
						const offering = offerings.find(
							(o: { providerId: string }) => o.providerId === providerId
						);

						return {
							...panditjiData,
							serviceOffering: offering
								? {
										id: offering.id,
										price: offering.price,
										details: offering.details,
								  }
								: undefined,
						};
					} catch (err) {
						console.error(`Error fetching panditji ${providerId}:`, err);
						return null;
					}
				});

				const panditjiResults = await Promise.all(panditjiPromises);
				const validPanditjis = panditjiResults.filter(
					(p): p is Panditji => p !== null && p.userType?.toLowerCase() === "panditji"
				);

				// Apply pagination
				const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
				const endIndex = startIndex + CARDS_PER_PAGE;
				const paginatedPanditjis = validPanditjis.slice(startIndex, endIndex);

				setPanditjis(paginatedPanditjis);
				setPagination({
					currentPage,
					totalPages: Math.ceil(validPanditjis.length / CARDS_PER_PAGE),
					totalCount: validPanditjis.length,
				});
			} catch (error) {
				console.error("Error fetching panditjis:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchPanditjis();
	}, [serviceId, currentPage]);

	useEffect(() => {
		if (currentPage > 1) {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}, [currentPage]);

	if (loading && !service) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
					<p className="text-lg text-muted-foreground">Loading service details...</p>
				</div>
				<Footer />
			</div>
		);
	}

	if (!service) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<p className="text-lg text-red-500">Service not found</p>
				</div>
				<Footer />
			</div>
		);
	}

	const bannerImage =
		service.images && service.images.length > 0
			? service.images[0]
			: "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Banner Section with Service Image */}
			<section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
				<div className="absolute inset-0">
					<Image
						src={bannerImage}
						alt={service.name}
						fill
						className="object-cover"
						priority
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							target.src = "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
						}}
					/>
					<div className="absolute inset-0 bg-black/40" />
				</div>

				{/* Text Overlay */}
				<div className="relative z-10 h-full flex items-center justify-center">
					<div className="container mx-auto px-4 text-center">
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4 drop-shadow-2xl">
							{service.name}
						</h1>
						{service.description && (
							<p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light" style={{ fontFamily: 'var(--font-jost), sans-serif' }}>
								{service.description}
							</p>
						)}
					</div>
				</div>
			</section>

			{/* Panditjis Section */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					<div className="mb-8">
						<h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
							Available Panditjis
						</h2>
						<p className="text-gray-600">
							Choose from our experienced panditjis offering this service
						</p>
					</div>

					{loading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{[...Array(CARDS_PER_PAGE)].map((_, index) => (
								<div
									key={index}
									className="bg-gray-300 rounded-2xl h-96 animate-pulse"
								/>
							))}
						</div>
					) : panditjis.length > 0 ? (
						<>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{panditjis.map((panditji) => (
									<div key={panditji.id} className="flex flex-col">
										<KathavachakDharmguruCard
											dharmguru={panditji}
											isLoading={loadingCardId === panditji.id}
											onGetInTouch={() => {
												setLoadingCardId(panditji.id);
												router.push(`/panditji/${panditji.id}?serviceId=${serviceId}`);
											}}
											onBookmark={() => console.log(`Bookmark ${panditji.name}`)}
										/>
									</div>
								))}
							</div>
							{pagination && pagination.totalPages > 1 && (
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
							<p className="text-xl">
								No panditjis available for this service at the moment.
							</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
