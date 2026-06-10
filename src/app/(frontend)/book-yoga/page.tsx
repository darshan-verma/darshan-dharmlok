"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { PageBanner } from "@/components/shared/PageBanner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SimpleSearchFilterBar } from "@/components/shared/SimpleSearchFilterBar";

interface FreeYoga {
	id: string;
	name: string;
	description: string;
	coverImage?: string;
	images?: Array<{ url: string; caption?: string; alt?: string; order: number }>;
	status?: string;
}

interface PaidYogaSession {
	id: string;
	name: string;
	description: string;
	price?: number;
	coverImage?: string;
	bannerImage?: string;
	images?: string[];
	status?: string;
	trainerName?: string;
	serviceType?: string;
}

type FreeYogaApiItem = FreeYoga & { bannerImage?: string };

export default function BookYogaPage() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"free" | "paid">("free");
	const [freeSessions, setFreeSessions] = useState<FreeYoga[]>([]);
	const [paidSessions, setPaidSessions] = useState<PaidYogaSession[]>([]);
	const [loadingFree, setLoadingFree] = useState(true);
	const [loadingPaid, setLoadingPaid] = useState(true);
	const [errorFree, setErrorFree] = useState<string | null>(null);
	const [errorPaid, setErrorPaid] = useState<string | null>(null);
	const [bookingId, setBookingId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [selectedReligiousCategory, setSelectedReligiousCategory] = useState("all");

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setDebouncedSearchQuery(searchQuery.trim());
		}, 300);
		return () => window.clearTimeout(timer);
	}, [searchQuery]);

	const clearFilters = () => {
		setSearchQuery("");
		setSelectedReligiousCategory("all");
	};

	// Fetch free yoga sessions
	useEffect(() => {
		const fetchFreeSessions = async () => {
			try {
				setLoadingFree(true);
				setErrorFree(null);

				let allSessions: FreeYogaApiItem[] = [];
				let page = 1;
				let hasMore = true;

				while (hasMore) {
					const params = new URLSearchParams({
						page: String(page),
						limit: "100",
						status: "Active",
					});
					if (selectedReligiousCategory !== "all") {
						params.set("religiousCategory", selectedReligiousCategory);
					}
					if (debouncedSearchQuery) {
						params.set("search", debouncedSearchQuery);
					}
					const response = await fetch(`/api/yoga?${params.toString()}`);
					if (!response.ok) {
						throw new Error("Failed to fetch free yoga sessions");
					}
					const data = await response.json();
					const sessions = data.data || [];
					allSessions = [...allSessions, ...sessions];
					
					// Check if there are more pages
					hasMore = data.pagination && page < data.pagination.totalPages;
					page++;
				}

				// Filter active sessions
				const activeSessions = allSessions.filter(
					(s: FreeYogaApiItem) => s.status === "Active"
				);

				const mappedSessions: FreeYoga[] = activeSessions.map((s: FreeYogaApiItem) => ({
					id: s.id,
					name: s.name || "Yoga Session",
					description: s.description || "Learn yoga for free",
					coverImage: s.coverImage || s.bannerImage,
					images: s.images || [],
					status: s.status || "Active",
				}));

				setFreeSessions(mappedSessions);
			} catch (err) {
				console.error("Error fetching free yoga sessions:", err);
				setErrorFree(
					err instanceof Error
						? err.message
						: "Failed to load free yoga sessions"
				);
			} finally {
				setLoadingFree(false);
			}
		};

		fetchFreeSessions();
	}, [selectedReligiousCategory, debouncedSearchQuery]);

	// Fetch paid yoga sessions
	useEffect(() => {
		const fetchPaidSessions = async () => {
			try {
				setLoadingPaid(true);
				setErrorPaid(null);

				const params = new URLSearchParams({
					page: "1",
					limit: "1000",
					status: "Active",
				});
				if (selectedReligiousCategory !== "all") {
					params.set("religiousCategory", selectedReligiousCategory);
				}
				if (debouncedSearchQuery) {
					params.set("search", debouncedSearchQuery);
				}
				const response = await fetch(`/api/yoga-sessions?${params.toString()}`);
				if (!response.ok) {
					throw new Error("Failed to fetch paid yoga sessions");
				}
				const data = await response.json();
				const sessions = (data.data || []).filter(
					(s: PaidYogaSession) => s.status === "Active"
				);

				const mappedSessions: PaidYogaSession[] = sessions.map((s: PaidYogaSession) => ({
					id: s.id,
					name: s.name || "Yoga Session",
					description: s.description || "Book a yoga session with our expert trainer",
					price: s.price,
					coverImage: s.coverImage || s.bannerImage,
					bannerImage: s.bannerImage,
					images: s.images || [],
					status: s.status || "Active",
					trainerName: s.trainerName,
					serviceType: s.serviceType,
				}));

				setPaidSessions(mappedSessions);
			} catch (err) {
				console.error("Error fetching paid yoga sessions:", err);
				setErrorPaid(
					err instanceof Error
						? err.message
						: "Failed to load paid yoga sessions"
				);
			} finally {
				setLoadingPaid(false);
			}
		};

		fetchPaidSessions();
	}, [selectedReligiousCategory, debouncedSearchQuery]);

	return (
		<div className="min-h-screen bg-white">
			<Header />

			<PageBanner
				pageSlug="book-yoga"
				title="Book Yoga"
				description="Discover free yoga sessions or book paid sessions with expert trainers"
				alt="Book Yoga Banner"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up"
			/>

			{/* Yoga Sessions Cards Section with Tabs */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					<SimpleSearchFilterBar
						page="book-yoga"
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						searchPlaceholder="Search yoga sessions by name"
						religiousValue={selectedReligiousCategory}
						onReligiousChange={setSelectedReligiousCategory}
						onClear={clearFilters}
					/>
					<Tabs
						value={activeTab}
						onValueChange={(value) => setActiveTab(value as "free" | "paid")}
						className="w-full"
					>
						<TabsList className="grid w-full max-w-md mx-auto mb-8 grid-cols-2">
							<TabsTrigger value="free">Free Sessions</TabsTrigger>
							<TabsTrigger value="paid">Paid Sessions</TabsTrigger>
						</TabsList>

						{/* Free Sessions Tab */}
						<TabsContent value="free" className="mt-6">
							{loadingFree ? (
								<div className="flex flex-col items-center justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
									<p className="text-muted-foreground">
										Loading free yoga sessions...
									</p>
								</div>
							) : errorFree ? (
								<div className="text-center py-12">
									<p className="text-red-500">{errorFree}</p>
								</div>
							) : freeSessions.length > 0 ? (
								<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
									{freeSessions.map((session) => {
										const imageUrl =
											session.coverImage ||
											(session.images && session.images.length > 0
												? session.images[0].url
												: undefined);
										return (
											<ProfileCard
												key={session.id}
												variant="pooja-service"
												name={session.name}
												description={session.description}
												image={imageUrl}
												isVerified={session.status === "Active"}
												isBooking={bookingId === session.id}
												onBook={() => {
													setBookingId(session.id);
													router.push(`/book-yoga/free/${session.id}`);
												}}
												enableAnimations={true}
											/>
										);
									})}
								</div>
							) : (
								<div className="text-center py-16 text-gray-500">
									<p className="text-xl">
										No free yoga sessions available at the moment.
									</p>
								</div>
							)}
						</TabsContent>

						{/* Paid Sessions Tab */}
						<TabsContent value="paid" className="mt-6">
							{loadingPaid ? (
								<div className="flex flex-col items-center justify-center py-12">
									<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
									<p className="text-muted-foreground">
										Loading paid yoga sessions...
									</p>
								</div>
							) : errorPaid ? (
								<div className="text-center py-12">
									<p className="text-red-500">{errorPaid}</p>
								</div>
							) : paidSessions.length > 0 ? (
								<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
									{paidSessions.map((session) => {
										const imageUrl =
											session.coverImage ||
											session.bannerImage ||
											(session.images && session.images.length > 0
												? session.images[0]
												: undefined);
										return (
											<ProfileCard
												key={session.id}
												variant="pooja-service"
												name={session.name}
												description={session.description}
												price={session.price}
												image={imageUrl}
												isVerified={session.status === "Active"}
												isBooking={bookingId === session.id}
												onBook={() => {
													setBookingId(session.id);
													router.push(`/book-yoga/paid/${session.id}`);
												}}
												enableAnimations={true}
											/>
										);
									})}
								</div>
							) : (
								<div className="text-center py-16 text-gray-500">
									<p className="text-xl">
										No paid yoga sessions available at the moment.
									</p>
								</div>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</section>

			<Footer />
		</div>
	);
}
