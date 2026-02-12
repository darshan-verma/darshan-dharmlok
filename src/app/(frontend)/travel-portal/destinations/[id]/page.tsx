"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/landing/Footer";
import {
	MapPin,
	IndianRupee,
	Calendar,
	Users,
	ArrowLeft,
	CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import TransportationGuide from "../../components/TransportationGuide";

interface Destination {
	id: string;
	name: string;
	description: string;
	image: string;
	location: string;
	category: string;
	price: number;
	travelByAir?: string;
	travelByTrain?: string;
	travelByBus?: string;
	travelByRoad?: string;
	bookings?: Array<{
		id: string;
		date: string;
		status: string;
	}>;
}

export default function DestinationDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;
	const [destination, setDestination] = useState<Destination | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (id) {
			setLoading(true);
			fetch(`/api/travel/${id}`)
				.then((res) => {
					if (!res.ok) throw new Error("Failed to fetch destination");
					return res.json();
				})
				.then(setDestination)
				.catch((err) => {
					console.error(err);
					setError("Failed to load destination details");
				})
				.finally(() => setLoading(false));
		}
	}, [id]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<Skeleton className="h-8 w-32 mb-6" />
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2 space-y-6">
							<Skeleton className="h-96 w-full rounded-xl" />
							<Skeleton className="h-32 w-full" />
						</div>
						<div className="lg:col-span-1">
							<Skeleton className="h-96 w-full" />
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error || !destination) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<Card className="p-12 text-center">
						<div className="flex flex-col items-center justify-center">
							<div className="text-6xl mb-4 text-muted-foreground">404</div>
							<h3 className="text-xl font-semibold mb-2">
								Destination Not Found
							</h3>
							<p className="text-muted-foreground mb-4">
								{error || "The destination you're looking for doesn't exist"}
							</p>
							<Button
								onClick={() => router.push("/travel-portal/destinations")}
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Destinations
							</Button>
						</div>
					</Card>
				</div>
				<Footer />
			</div>
		);
	}

	const recentBookings = destination.bookings?.length || 0;

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Back Button */}
				<Button variant="ghost" className="mb-6" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Hero Image */}
						<Card className="overflow-hidden">
							<div className="relative h-96 w-full bg-muted">
								<Image
									src={destination.image}
									alt={destination.name}
									fill
									className="object-cover"
									priority
									sizes="(max-width: 1024px) 100vw, 66vw"
								/>
								<div className="absolute top-4 right-4 z-10">
									<Badge
										variant="secondary"
										className="bg-white/90 backdrop-blur-sm text-lg py-2 px-4"
									>
										{destination.category}
									</Badge>
								</div>
							</div>
						</Card>{" "}
						{/* Title and Location */}
						<div>
							<h1 className="text-4xl font-bold mb-3">{destination.name}</h1>
							<div className="flex items-center text-muted-foreground text-lg">
								<MapPin className="h-5 w-5 mr-2 text-red-500" />
								<span>{destination.location}</span>
							</div>
						</div>
						{/* Description */}
						<Card>
							<CardHeader>
								<CardTitle>About This Destination</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground leading-relaxed">
									{destination.description}
								</p>
							</CardContent>
						</Card>
						{/* Highlights */}
						<Card>
							<CardHeader>
								<CardTitle>What&apos;s Included</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="flex items-start gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
										<div>
											<p className="font-medium">Guided Tours</p>
											<p className="text-sm text-muted-foreground">
												Expert local guides
											</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
										<div>
											<p className="font-medium">Accommodation</p>
											<p className="text-sm text-muted-foreground">
												Comfortable stays
											</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
										<div>
											<p className="font-medium">Transportation</p>
											<p className="text-sm text-muted-foreground">
												All transfers included
											</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
										<div>
											<p className="font-medium">Meals</p>
											<p className="text-sm text-muted-foreground">
												Traditional cuisine
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
						{/* Transportation Guide */}
						<TransportationGuide
							data={{
								byAir: destination.travelByAir,
								byTrain: destination.travelByTrain,
								byBus: destination.travelByBus,
								byRoad: destination.travelByRoad,
							}}
							destinationName={destination.name}
						/>
					</div>

					{/* Booking Sidebar */}
					<div className="lg:col-span-1">
						<Card className="sticky top-6">
							<CardHeader>
								<CardTitle>Book Your Journey</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Price */}
								<div className="bg-primary/5 rounded-lg p-4">
									<p className="text-sm text-muted-foreground mb-1">
										Starting from
									</p>
									<div className="flex items-center text-3xl font-bold text-primary">
										<IndianRupee className="h-7 w-7" />
										<span>{destination.price.toLocaleString("en-IN")}</span>
									</div>
									<p className="text-sm text-muted-foreground mt-1">
										per person
									</p>
								</div>

								<Separator />

								{/* Quick Info */}
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<Calendar className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">Flexible Dates</p>
											<p className="text-xs text-muted-foreground">
												Choose your preferred dates
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Users className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">Group Discounts</p>
											<p className="text-xs text-muted-foreground">
												Available for 4+ travelers
											</p>
										</div>
									</div>
								</div>

								<Separator />

								{/* Recent Activity */}
								{recentBookings > 0 && (
									<div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
										<p className="text-sm">
											<span className="font-semibold">{recentBookings}</span>{" "}
											{recentBookings === 1 ? "person has" : "people have"}{" "}
											booked recently
										</p>
									</div>
								)}

								{/* CTA Button */}
								<Link href={`/travel-portal/booking/${id}`} className="block">
									<Button size="lg" className="w-full text-lg py-6">
										Book Now
									</Button>
								</Link>

								<p className="text-xs text-center text-muted-foreground">
									Free cancellation up to 24 hours before departure
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
}
