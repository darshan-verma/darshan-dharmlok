"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ProfileCard } from "@/components/ui/profile-card";

interface PoojaService {
	id: string;
	categoryId: string;
	categoryName: string;
	price: number;
	details: string;
	status?: string;
	imageUrl?: string;
}

interface PoojaServicesViewerProps {
	userId: string;
}

export default function PoojaServicesViewer({
	userId,
}: PoojaServicesViewerProps) {
	const [services, setServices] = useState<PoojaService[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPoojaServices = async () => {
			try {
				setLoading(true);
				setError(null);

				const offeringsResponse = await fetch(
					`/api/service-offerings?providerId=${userId}&targetType=PoojaCategory`
				);
				if (!offeringsResponse.ok) {
					throw new Error("Failed to fetch service offerings");
				}
				const offeringsData = await offeringsResponse.json();
				const offerings = offeringsData.offerings || [];

				const categoriesResponse = await fetch(
					"/api/pooja-categories?page=1&limit=1000"
				);
				if (!categoriesResponse.ok) {
					throw new Error("Failed to fetch pooja categories");
				}
				const categoriesData = await categoriesResponse.json();
				const categories = categoriesData.categories || [];

				const mappedServices: PoojaService[] = offerings
					.filter((o: { status?: string }) => o.status === "Active")
					.map((o: { id: string; targetId: string; price?: number; details?: string; status?: string }) => {
						const category = categories.find(
							(c: { id: string; name?: string; images?: string[] }) => c.id === o.targetId
						);
						const images = category?.images && category.images.length > 0 ? category.images : [];
						return {
							id: o.id,
							categoryId: o.targetId,
							categoryName: category?.name || o.targetId,
							price: o.price ?? 0,
							details: o.details ?? "",
							status: o.status ?? "Active",
							imageUrl: images[0],
						};
					});

				setServices(mappedServices);
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
	}, [userId]);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
				<p className="text-muted-foreground">Loading pooja services...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-red-500">{error}</p>
			</div>
		);
	}

	if (services.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">
					No pooja services available at the moment.
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
			{services.map((service) => (
				<ProfileCard
					key={service.id}
					variant="pooja-service"
					name={service.categoryName}
					description={service.details || "Traditional pooja service performed with devotion."}
					price={service.price}
					image={service.imageUrl}
					isVerified={service.status === "Active"}
					onBook={() => {
						// TODO: navigate to booking flow or open modal
					}}
					enableAnimations={true}
				/>
			))}
		</div>
	);
}
