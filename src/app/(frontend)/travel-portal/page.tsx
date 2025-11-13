"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DestinationCard from "../components/travel-portal/DestinationCard";
import {
	ArrowRight,
	MapPin,
	Shield,
	Users,
	Star,
	Quote,
	Building2,
	Route,
	Home,
	Castle,
} from "lucide-react";

interface Destination {
	id: string;
	name: string;
	description: string;
	image: string;
	location: string;
	category: string;
	price: number;
}

const categories = [
	{
		name: "Temples",
		icon: Building2,
		description: "Sacred Hindu temples",
		count: 25,
		color: "from-orange-400/60 to-red-400/60",
	},
	{
		name: "Pilgrimage",
		icon: Route,
		description: "Spiritual journeys",
		count: 18,
		color: "from-blue-400/60 to-indigo-400/60",
	},
	{
		name: "Ashrams",
		icon: Home,
		description: "Peace & meditation",
		count: 12,
		color: "from-green-400/60 to-teal-400/60",
	},
	{
		name: "Heritage",
		icon: Castle,
		description: "Cultural sites",
		count: 15,
		color: "from-purple-400/60 to-pink-400/60",
	},
];

const features = [
	{
		icon: Shield,
		title: "Safe & Secure",
		description: "Verified accommodations and trusted guides",
	},
	{
		icon: Users,
		title: "Group Discounts",
		description: "Special rates for group bookings",
	},
	{
		icon: MapPin,
		title: "100+ Destinations",
		description: "Curated spiritual locations across India",
	},
	{
		icon: Star,
		title: "Expert Guidance",
		description: "Knowledgeable local guides",
	},
];

const testimonials = [
	{
		name: "Rajesh Kumar",
		location: "Delhi",
		text: "An absolutely divine experience! The journey to Varanasi was well-organized and spiritually enriching.",
		rating: 5,
	},
	{
		name: "Priya Sharma",
		location: "Mumbai",
		text: "The best spiritual travel service I've used. Everything was perfect from booking to the actual trip.",
		rating: 5,
	},
	{
		name: "Arun Patel",
		location: "Ahmedabad",
		text: "Highly recommend for anyone seeking a meaningful pilgrimage. The guides were extremely knowledgeable.",
		rating: 5,
	},
];

export default function TravelHomePage() {
	const [featuredDestinations, setFeaturedDestinations] = useState<
		Destination[]
	>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		fetch("/api/travel")
			.then((res) => res.json())
			.then((data) => {
				// Show first 6 as featured
				setFeaturedDestinations(data.slice(0, 6));
			})
			.catch((error) => {
				console.error("Error fetching destinations:", error);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="relative text-white py-32 overflow-hidden min-h-[85vh] flex items-center">
				{/* Background Image with Overlay */}
				<div className="absolute inset-0">
					<Image
						src="/travel-destinations/travel-portal-banner.jpg"
						alt="Ganga Aarti"
						fill
						className="object-cover"
					/>
					{/* Gradient Overlays for better text readability */}
					<div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/60"></div>
					<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40"></div>
				</div>

				{/* Decorative Light Effects */}
				<div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
				<div
					className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"
					style={{ animationDelay: "1s" }}
				></div>

				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
					<div className="inline-block mb-6 px-5 py-2.5 bg-orange-500/30 backdrop-blur-md rounded-full text-sm font-medium border border-orange-300/30 shadow-lg">
						✨ Experience Divine Rituals & Sacred Journeys
					</div>
					<h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight drop-shadow-2xl">
						Embark on Sacred Journeys
						<br />
						<span className="text-yellow-400 drop-shadow-lg">
							Across Bharat
						</span>
					</h1>
					<p className="text-xl sm:text-2xl mb-10 max-w-3xl mx-auto text-white drop-shadow-lg">
						Discover ancient temples, witness divine rituals, and embark on
						transformative pilgrimages to India&apos;s holiest destinations
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link href="/travel-portal/destinations">
							<Button
								size="lg"
								className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 text-lg px-8 py-6 shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
							>
								Explore Destinations
								<ArrowRight className="ml-2 h-5 w-5" />
							</Button>
						</Link>
						<Link href="/travel-portal/my-trips">
							<Button
								size="lg"
								variant="outline"
								className="border-2 border-white/80 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 text-lg px-8 py-6 shadow-xl"
							>
								View My Trips
							</Button>
						</Link>
					</div>

					{/* Stats */}
					<div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
						<div className="backdrop-blur-sm bg-white/10 rounded-lg p-4 border border-white/20">
							<div className="text-4xl font-bold drop-shadow-lg">100+</div>
							<div className="text-white/90 mt-1 text-sm">Destinations</div>
						</div>
						<div className="backdrop-blur-sm bg-white/10 rounded-lg p-4 border border-white/20">
							<div className="text-4xl font-bold drop-shadow-lg">5000+</div>
							<div className="text-white/90 mt-1 text-sm">Happy Travelers</div>
						</div>
						<div className="backdrop-blur-sm bg-white/10 rounded-lg p-4 border border-white/20">
							<div className="text-4xl font-bold drop-shadow-lg">4.9★</div>
							<div className="text-white/90 mt-1 text-sm">Average Rating</div>
						</div>
					</div>
				</div>
			</section>

			{/* Categories Section */}
			<section className="py-16 bg-gradient-to-b from-background to-secondary/10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl sm:text-4xl font-bold mb-3">
							Browse by Category
						</h2>
						<p className="text-muted-foreground text-lg">
							Find the perfect spiritual journey for you
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
						{categories.map((category) => (
							<Link
								key={category.name}
								href={`/travel-portal/destinations?category=${category.name}`}
								className="group"
							>
								<div className="relative h-full">
									{/* Subtle Background Effect */}
									<div
										className={`absolute inset-0 bg-gradient-to-br ${category.color} rounded-2xl opacity-0 group-hover:opacity-3 transition-all duration-500`}
									></div>

									{/* Main Card */}
									<div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-1 border border-gray-100 overflow-hidden h-full">
										{/* Card Content */}
										<div className="p-8 text-center h-full flex flex-col">
											{/* Icon Container */}
											<div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
												<category.icon className="h-8 w-8" />
											</div>

											{/* Title */}
											<h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors duration-300">
												{category.name}
											</h3>

											{/* Description */}
											<p className="text-gray-600 mb-6 leading-relaxed flex-grow">
												{category.description}
											</p>

											{/* Count and Arrow */}
											<div className="flex items-center justify-between pt-4 border-t border-gray-100">
												<div className="flex items-center text-sm font-semibold text-primary">
													<span className="bg-primary/10 px-3 py-1 rounded-full">
														{category.count} destinations
													</span>
												</div>
												<div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-300">
													<ArrowRight className="h-5 w-5" />
												</div>
											</div>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>
			</section>

			{/* Featured Destinations */}
			<section className="py-16 bg-background">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl sm:text-4xl font-bold mb-3">
							Featured Destinations
						</h2>
						<p className="text-muted-foreground text-lg">
							Handpicked sacred places for your spiritual journey
						</p>
					</div>

					{loading ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{[...Array(6)].map((_, index) => (
								<Card key={index} className="overflow-hidden">
									<Skeleton className="h-48 w-full" />
									<div className="p-4 space-y-3">
										<Skeleton className="h-6 w-3/4" />
										<Skeleton className="h-4 w-1/2" />
										<Skeleton className="h-4 w-full" />
										<Skeleton className="h-4 w-full" />
									</div>
								</Card>
							))}
						</div>
					) : (
						<>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
								{featuredDestinations.map((dest) => (
									<DestinationCard key={dest.id} destination={dest} />
								))}
							</div>
							<div className="text-center mt-10">
								<Link href="/travel-portal/destinations">
									<Button size="lg" variant="outline">
										View All Destinations
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
							</div>
						</>
					)}
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 bg-gradient-to-b from-secondary/10 to-background">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl sm:text-4xl font-bold mb-3">
							Why Choose Dharmlok?
						</h2>
						<p className="text-muted-foreground text-lg">
							Your trusted partner for spiritual journeys
						</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
						{features.map((feature) => (
							<Card key={feature.title} className="text-center">
								<CardContent className="pt-6">
									<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
										<feature.icon className="h-8 w-8" />
									</div>
									<h3 className="text-lg font-semibold mb-2">
										{feature.title}
									</h3>
									<p className="text-sm text-muted-foreground">
										{feature.description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Testimonials Section */}
			<section className="py-16 bg-background">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center mb-12">
						<h2 className="text-3xl sm:text-4xl font-bold mb-3">
							What Our Travelers Say
						</h2>
						<p className="text-muted-foreground text-lg">
							Real experiences from real people
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{testimonials.map((testimonial, index) => (
							<Card key={index}>
								<CardContent className="pt-6">
									<Quote className="h-8 w-8 text-primary mb-4" />
									<p className="text-muted-foreground mb-4 leading-relaxed">
										&ldquo;{testimonial.text}&rdquo;
									</p>
									<div className="flex items-center mb-2">
										{[...Array(testimonial.rating)].map((_, i) => (
											<Star
												key={i}
												className="h-4 w-4 fill-yellow-400 text-yellow-400"
											/>
										))}
									</div>
									<div>
										<p className="font-semibold">{testimonial.name}</p>
										<p className="text-sm text-muted-foreground">
											{testimonial.location}
										</p>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 bg-gradient-to-r from-orange-500 via-purple-600 to-blue-600 text-white">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl sm:text-4xl font-bold mb-4">
						Ready to Begin Your Spiritual Journey?
					</h2>
					<p className="text-xl mb-8 text-white/90">
						Join thousands of travelers who have discovered peace and
						enlightenment
					</p>
					<Link href="/travel-portal/destinations">
						<Button
							size="lg"
							className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
						>
							Start Exploring Now
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</Link>
				</div>
			</section>
		</div>
	);
}
