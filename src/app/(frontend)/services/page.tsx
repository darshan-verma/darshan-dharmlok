"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const SERVICES = [
	{
		name: "Audio Library",
		category: "Content",
		description:
			"Access a vast collection of spiritual chants, mantras, and devotional music.",
		image: "/services/audio-library.jpg",
		href: "/audio-library",
	},
	{
		name: "Balvidhya",
		category: "Learning",
		description: "Educational programs and spiritual learning for children.",
		image: "/services/bal-vidhya.jpg",
		href: "/bal-vidhya",
	},
	{
		name: "Blogs",
		category: "Content",
		description:
			"Read articles, guides, and insights on spirituality and tradition.",
		image: "/services/blogs.jpg",
		href: "/blogs",
	},
	{
		name: "Book Pooja",
		category: "Bookings",
		description:
			"Discover and book traditional pooja services from experienced panditjis.",
		image: "/services/book-pooja.jpg",
		href: "/book-pooja",
	},
	{
		name: "Dharmshala",
		category: "Travel",
		description:
			"Find comfortable accommodations near temples for your pilgrimage.",
		image: "/services/dharmshala.jpg",
		href: "/dharmshala",
	},
	{
		name: "E-Books",
		category: "Content",
		description: "Explore spiritual e-books and digital reading resources.",
		image: "/services/e-book.webp",
		href: "/e-book",
	},
	{
		name: "E shop",
		category: "Marketplace",
		description:
			"Discover authentic spiritual products, pooja items, and sacred artifacts.",
		image: "/services/e-shop.jpg",
		href: "/e-shop",
	},
	{
		name: "Events",
		category: "Community",
		description:
			"Stay updated with upcoming religious festivals, ceremonies, and spiritual gatherings.",
		image: "/services/events.jpg",
		href: "/events",
	},
	{
		name: "Live Darshan",
		category: "Worship",
		description:
			"Watch live temple darshan streams and stay connected with daily worship.",
		image: "/services/live-darshan.jpg",
		href: "/live-darshan",
	},
	{
		name: "Motivational Speaker",
		category: "Guidance",
		description:
			"Connect with inspiring spiritual leaders and motivational speakers for guidance.",
		image: "/services/motivational-speaker.jpg",
		href: "/motivational-speaker",
	},
	{
		name: "Temple",
		category: "Travel",
		description:
			"Discover sacred temples and plan your spiritual journey to holy places.",
		image: "/services/temple.jpg",
		href: "/temple",
	},
	{
		name: "Yoga",
		category: "Wellness",
		description: "Book free and paid yoga sessions with certified instructors.",
		image: "/services/yoga.jpg",
		href: "/book-yoga",
	},
] as const;

export default function ServicesPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");

	const categoryOptions = useMemo(
		() =>
			Array.from(
				new Set(SERVICES.map((service) => service.category))
			).sort((a, b) => a.localeCompare(b)),
		[]
	);

	const filteredServices = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();

		return SERVICES.filter((service) => {
			const matchesCategory =
				selectedCategory === "all" || service.category === selectedCategory;
			const matchesQuery =
				normalizedQuery.length === 0 ||
				service.name.toLowerCase().includes(normalizedQuery) ||
				service.description.toLowerCase().includes(normalizedQuery);

			return matchesCategory && matchesQuery;
		});
	}, [searchQuery, selectedCategory]);

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedCategory("all");
	};

	return (
		<div className="min-h-screen bg-white">
			<Header />

			<PageBanner
				pageSlug="services"
				title="Our Services"
				description="Explore all that Dharmlok has to offer for your spiritual journey"
				alt="Our Services"
				className="h-[400px] md:h-[500px]"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 drop-shadow-2xl"
				descriptionClassName="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-light"
			/>

			{/* Service cards - pooja-style with increased size */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					<div className="mb-8 rounded-2xl border border-white/50 bg-white/35 p-3 md:p-4 backdrop-blur-xl shadow-[0_10px_28px_rgba(40,32,20,0.12)]">
						<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
							<div className="relative w-full lg:flex-1">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f8b9c]" />
								<Input
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search services by name or description"
									className="h-11 rounded-xl border-white/60 bg-white/55 pl-10 text-[#243142] placeholder:text-[#738295] focus-visible:border-white/80 focus-visible:ring-white/70"
									aria-label="Search services"
								/>
							</div>
							<Select value={selectedCategory} onValueChange={setSelectedCategory}>
								<SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/55 text-[#243142] data-[placeholder]:text-[#738295] sm:w-[220px]">
									<SelectValue placeholder="Filter by category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All categories</SelectItem>
									{categoryOptions.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								variant="outline"
								className="h-11 rounded-xl border-white/65 bg-white/60 text-[#2c3a4e] hover:bg-white/75 hover:text-[#1f2b3d] lg:ml-auto"
								onClick={clearFilters}
							>
								<X className="h-4 w-4" />
								Clear filters
							</Button>
						</div>
						<p className="mt-3 text-sm text-[#65778f]">
							Showing {filteredServices.length} of {SERVICES.length} services
						</p>
					</div>

					{filteredServices.length > 0 ? (
						<div className="grid gap-8 justify-items-center grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
							{filteredServices.map((service) => (
								<Link
									key={service.name}
									href={service.href}
									className="block w-full max-w-[380px] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4 rounded-3xl"
								>
									<ProfileCard
										variant="dharamshala"
										name={service.name}
										description={service.description}
										image={service.image}
										hideStats={true}
										onBook={() => {}}
										className="w-full max-w-[380px] h-[28rem] min-h-[28rem]"
										enableAnimations={true}
									/>
								</Link>
							))}
						</div>
					) : (
						<div className="text-center py-16 text-gray-500">
							<p className="text-xl">No services match your search or filters.</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
