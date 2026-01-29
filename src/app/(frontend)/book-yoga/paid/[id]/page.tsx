"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
	IndianRupee,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Clock,
	Calendar,
	ChevronLeft,
	ChevronRight,
	X,
	Maximize2,
	Play,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface PaidYogaSession {
	id: string;
	trainerId: string;
	trainerName: string;
	name: string;
	date: string;
	serviceType: string;
	description: string;
	status: string;
	bannerImage?: string;
	coverImage?: string;
	images: string[];
	videos: string[];
	price?: number;
	duration?: number;
	capacity?: number;
}

interface Trainer {
	id: string;
	name: string;
	profileImageUrl?: string;
	bannerImageUrl?: string;
	phone?: string;
	email?: string;
	addresses?: Array<{
		id?: string;
		type?: string;
		label?: string;
		line1?: string;
		line2?: string;
		city?: string;
		state?: string;
		country?: string;
		pincode?: string;
	}>;
}

export default function PaidYogaDetailsPage() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	const [session, setSession] = useState<PaidYogaSession | null>(null);
	const [trainer, setTrainer] = useState<Trainer | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [contactOpen, setContactOpen] = useState(false);
	const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		if (!id) return;

		const fetchSession = async () => {
			try {
				setLoading(true);
				setError(null);

				// Fetch session details
				const sessionResponse = await fetch(`/api/yoga-sessions/${id}`);
				if (!sessionResponse.ok) {
					throw new Error("Failed to fetch yoga session details");
				}
				const sessionData = await sessionResponse.json();

				setSession({
					id: sessionData.id,
					trainerId: sessionData.trainerId,
					trainerName: sessionData.trainerName,
					name: sessionData.name,
					date: sessionData.date,
					serviceType: sessionData.serviceType,
					description: sessionData.description,
					status: sessionData.status,
					bannerImage: sessionData.bannerImage,
					coverImage: sessionData.coverImage,
					images: sessionData.images || [],
					videos: sessionData.videos || [],
					price: sessionData.price,
					duration: sessionData.duration,
					capacity: sessionData.capacity,
				});

				// Fetch trainer details
				if (sessionData.trainerId) {
					try {
						const trainerResponse = await fetch(
							`/api/users/${sessionData.trainerId}`
						);
						if (trainerResponse.ok) {
							const trainerData = await trainerResponse.json();
							setTrainer({
								id: trainerData.id,
								name: trainerData.name || sessionData.trainerName,
								profileImageUrl: trainerData.profileImageUrl,
								bannerImageUrl: trainerData.bannerImageUrl,
								phone: trainerData.phone,
								email: trainerData.email,
								addresses: trainerData.addresses || [],
							});
						}
					} catch (err) {
						console.error("Error fetching trainer:", err);
						// Continue without trainer details
					}
				}
			} catch (err) {
				console.error("Error fetching yoga session:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to load yoga session details"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchSession();
	}, [id]);

	// Combine images and videos into a single media array (before conditional returns)
	const allMedia = session
		? [
				...(session.images || []).map((img) => ({ type: "image" as const, url: img })),
				...(session.videos || []).map((video) => ({ type: "video" as const, url: video })),
		  ]
		: [];

	// Handle keyboard navigation (must be before conditional returns)
	useEffect(() => {
		if (!isFullscreen || allMedia.length === 0) return;

		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") {
				setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1));
			} else if (e.key === "ArrowRight") {
				setCurrentMediaIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0));
			} else if (e.key === "Escape") {
				setIsFullscreen(false);
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [isFullscreen, allMedia.length]);

	if (loading) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
					<p className="text-lg text-muted-foreground">
						Loading yoga session details...
					</p>
				</div>
				<Footer />
			</div>
		);
	}

	if (error || !session) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<p className="text-lg text-red-500">
						{error || "Yoga session not found"}
					</p>
				</div>
				<Footer />
			</div>
		);
	}

	const bannerImage =
		session.bannerImage ||
		trainer?.bannerImageUrl ||
		(session.images && session.images.length > 0 ? session.images[0] : undefined) ||
		"/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";

	const trainerAvatarName = (trainer?.name || session.trainerName)
		.split(" ")
		.map((n) => n[0])
		.join("");

	// Format date
	let sessionDate = "TBD";
	if (session.date) {
		try {
			const dateObj = new Date(session.date);
			if (!isNaN(dateObj.getTime())) {
				sessionDate = dateObj.toLocaleDateString("en-IN", {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				});
			}
		} catch (e) {
			console.error("Error parsing date:", e);
		}
	}

	// Format duration
	const durationText = session.duration
		? `${session.duration} minutes`
		: "Duration TBD";

	const handlePreviousMedia = () => {
		setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : allMedia.length - 1));
	};

	const handleNextMedia = () => {
		setCurrentMediaIndex((prev) => (prev < allMedia.length - 1 ? prev + 1 : 0));
	};

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Trainer Banner Section */}
			<section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
				<div className="absolute inset-0">
					<Image
						src={bannerImage}
						alt={`${session.trainerName}'s banner`}
						fill
						className="object-cover"
						priority
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							target.src = "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
						}}
					/>
					<div className="absolute inset-0 bg-black/30" />
				</div>
			</section>

			{/* Profile Section */}
			<section className="relative -mt-20 md:-mt-24 mb-8">
				<div className="container mx-auto px-4 max-w-7xl">
					{/* Trainer Profile Image */}
					<div className="flex justify-center mb-4">
						<Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-2xl">
							{trainer?.profileImageUrl ? (
								<AvatarImage
									src={trainer.profileImageUrl}
									alt={trainer.name || session.trainerName}
								/>
							) : null}
							<AvatarFallback className="bg-gradient-to-br from-orange-400 to-yellow-500 text-white text-3xl md:text-4xl font-bold">
								{trainerAvatarName}
							</AvatarFallback>
						</Avatar>
					</div>

					{/* Trainer Name and Service Type */}
					<div className="text-center mb-8">
						<h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2">
							{trainer?.name || session.trainerName}
						</h1>
						{session.serviceType && (
							<p className="text-lg text-gray-600 mb-1">
								{session.serviceType} Yoga
							</p>
						)}
						<h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-800 mt-4">
							{session.name}
						</h2>
					</div>

					{/* Price, Timing, and Date Info */}
					<div className="max-w-4xl mx-auto mb-8">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f5f5f0] rounded-2xl p-6">
							{session.price && (
								<div className="flex items-center gap-3">
									<div className="p-3 bg-orange-100 rounded-lg">
										<IndianRupee className="h-6 w-6 text-orange-600" />
									</div>
									<div>
										<p className="text-xs text-gray-500">Price</p>
										<p className="text-xl font-bold text-gray-900">
											₹{session.price.toLocaleString("en-IN")}
										</p>
									</div>
								</div>
							)}
							<div className="flex items-center gap-3">
								<div className="p-3 bg-blue-100 rounded-lg">
									<Clock className="h-6 w-6 text-blue-600" />
								</div>
								<div>
									<p className="text-xs text-gray-500">Duration</p>
									<p className="text-xl font-bold text-gray-900">
										{durationText}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="p-3 bg-green-100 rounded-lg">
									<Calendar className="h-6 w-6 text-green-600" />
								</div>
								<div>
									<p className="text-xs text-gray-500">Date</p>
									<p className="text-xl font-bold text-gray-900">
										{sessionDate}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Description */}
					<div className="max-w-4xl mx-auto mb-8">
						<div className="prose prose-lg max-w-none bg-white rounded-2xl p-6 shadow-sm">
							<h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
								About This Session
							</h3>
							<div
								className="text-gray-700 leading-relaxed whitespace-pre-wrap"
								dangerouslySetInnerHTML={{
									__html: session.description.replace(/\n/g, "<br />"),
								}}
							/>
						</div>
					</div>

					{/* Media Gallery - Images and Videos Combined */}
					{allMedia.length > 0 && (
						<div className="max-w-7xl mx-auto mb-8">
							<h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-6 text-center">
								Media Gallery
							</h3>
							
							{/* Main Media Display */}
							<div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl mb-6 group">
								{allMedia[currentMediaIndex]?.type === "image" ? (
									<Image
										src={allMedia[currentMediaIndex].url}
										alt={`Media ${currentMediaIndex + 1}`}
										fill
										className="object-contain cursor-pointer"
										onClick={() => setIsFullscreen(true)}
									/>
								) : (
									<video
										src={allMedia[currentMediaIndex].url}
										controls
										className="w-full h-full object-contain"
									/>
								)}

								{/* Navigation Arrows */}
								{allMedia.length > 1 && (
									<>
										<button
											onClick={handlePreviousMedia}
											className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
											aria-label="Previous media"
										>
											<ChevronLeft className="h-6 w-6" />
										</button>
										<button
											onClick={handleNextMedia}
											className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
											aria-label="Next media"
										>
											<ChevronRight className="h-6 w-6" />
										</button>
									</>
								)}

								{/* Fullscreen Button */}
								{allMedia[currentMediaIndex]?.type === "image" && (
									<button
										onClick={() => setIsFullscreen(true)}
										className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
										aria-label="Fullscreen"
									>
										<Maximize2 className="h-5 w-5" />
									</button>
								)}

								{/* Media Counter */}
								{allMedia.length > 1 && (
									<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
										{currentMediaIndex + 1} / {allMedia.length}
									</div>
								)}

								{/* Dots Indicator */}
								{allMedia.length > 1 && (
									<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 mt-12">
										{allMedia.map((_, index) => (
											<button
												key={index}
												onClick={() => setCurrentMediaIndex(index)}
												className={`h-2 rounded-full transition-all duration-300 ${
													index === currentMediaIndex
														? "w-8 bg-white"
														: "w-2 bg-white/50 hover:bg-white/75"
												}`}
												aria-label={`Go to media ${index + 1}`}
											/>
										))}
									</div>
								)}
							</div>

							{/* Thumbnail Grid */}
							{allMedia.length > 1 && (
								<div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
									{allMedia.map((media, index) => (
										<button
											key={index}
											onClick={() => {
												setCurrentMediaIndex(index);
												if (media.type === "image") {
													setIsFullscreen(true);
												}
											}}
											className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all duration-200 ${
												index === currentMediaIndex
													? "border-orange-500 ring-2 ring-orange-200 scale-105"
													: "border-transparent hover:border-orange-300"
											}`}
										>
											{media.type === "image" ? (
												<Image
													src={media.url}
													alt={`Thumbnail ${index + 1}`}
													fill
													className="object-cover"
												/>
											) : (
												<div className="w-full h-full bg-gray-800 flex items-center justify-center">
													<Play className="h-6 w-6 text-white" />
												</div>
											)}
										</button>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</section>

			{/* Bottom Navbar for Pricing and Actions */}
			{session.price && (
				<div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4">
					<div className="w-full max-w-2xl bg-white border border-gray-200 shadow-xl rounded-3xl">
						<div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-6">
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2">
									<IndianRupee className="h-6 w-6 text-orange-600" />
									<p className="text-2xl md:text-3xl font-bold text-gray-900">
										{session.price.toLocaleString("en-IN")}
									</p>
								</div>
							</div>
							<div className="flex gap-3 w-full md:w-auto">
								<Button
									className="flex-1 md:flex-none"
									onClick={() => {
										setContactOpen(true);
									}}
								>
									Book Now
								</Button>
								<Button
									variant="outline"
									className="flex-1 md:flex-none"
									onClick={() => setContactOpen(true)}
								>
									Contact Trainer
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Contact Dialog */}
			<Dialog open={contactOpen} onOpenChange={setContactOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Contact Information</DialogTitle>
						<DialogDescription>
							Get in touch with {trainer?.name || session.trainerName}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 mt-4">
						{trainer?.phone && (
							<div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Phone className="w-5 h-5 text-blue-600" />
								</div>
								<div className="flex-1">
									<p className="text-xs text-gray-500">Phone</p>
									<a
										href={`tel:${trainer.phone}`}
										className="text-sm font-medium text-gray-900 hover:text-blue-600"
									>
										{trainer.phone}
									</a>
								</div>
							</div>
						)}
						{trainer?.email && (
							<div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
								<div className="p-2 bg-blue-100 rounded-lg">
									<Mail className="w-5 h-5 text-blue-600" />
								</div>
								<div className="flex-1">
									<p className="text-xs text-gray-500">Email</p>
									<a
										href={`mailto:${trainer.email}`}
										className="text-sm font-medium text-blue-600 hover:underline"
									>
										{trainer.email}
									</a>
								</div>
							</div>
						)}
						{trainer?.addresses && trainer.addresses.length > 0 && (
							<div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
								<div className="p-2 bg-blue-100 rounded-lg">
									<MapPin className="w-5 h-5 text-blue-600" />
								</div>
								<div className="flex-1">
									<p className="text-xs text-gray-500 mb-1">Address</p>
									{trainer.addresses.map((addr, idx) => (
										<p
											key={addr.id ?? idx}
											className="text-sm font-medium text-gray-900"
										>
											{[
												addr.line1,
												addr.line2,
												addr.city,
												addr.state,
												addr.country,
												addr.pincode,
											]
												.filter(Boolean)
												.join(", ")}
										</p>
									))}
								</div>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Fullscreen Media Modal */}
			{isFullscreen && allMedia.length > 0 && allMedia[currentMediaIndex]?.type === "image" && (
				<div
					className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
					onClick={() => setIsFullscreen(false)}
				>
					<button
						onClick={() => setIsFullscreen(false)}
						className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2"
						aria-label="Close fullscreen"
					>
						<X className="h-6 w-6" />
					</button>

					{allMedia.length > 1 && (
						<>
							<button
								onClick={(e) => {
									e.stopPropagation();
									handlePreviousMedia();
								}}
								className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-4 z-10"
								aria-label="Previous media"
							>
								<ChevronLeft className="h-8 w-8" />
							</button>
							<button
								onClick={(e) => {
									e.stopPropagation();
									handleNextMedia();
								}}
								className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-4 z-10"
								aria-label="Next media"
							>
								<ChevronRight className="h-8 w-8" />
							</button>
						</>
					)}

					<div
						className="relative w-full h-full max-w-7xl max-h-[90vh]"
						onClick={(e) => e.stopPropagation()}
					>
						<Image
							src={allMedia[currentMediaIndex].url}
							alt={`Fullscreen media ${currentMediaIndex + 1}`}
							fill
							className="object-contain"
							sizes="100vw"
						/>
					</div>

					{/* Media Counter in Fullscreen */}
					{allMedia.length > 1 && (
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-full text-lg">
							{currentMediaIndex + 1} / {allMedia.length}
						</div>
					)}
				</div>
			)}

			{/* Add padding bottom when navbar is visible */}
			{session.price && <div className="h-24" />}

			<Footer />
		</div>
	);
}
