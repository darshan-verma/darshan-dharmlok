"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

interface YogaImage {
	url: string;
	caption?: string;
	alt?: string;
	order: number;
}

interface FreeYoga {
	id: string;
	name: string;
	description: string;
	coverImage?: string;
	bannerImage?: string;
	images?: YogaImage[];
	videos?: string[];
	status?: string;
}

export default function FreeYogaDetailsPage() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	const [yoga, setYoga] = useState<FreeYoga | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);

	useEffect(() => {
		if (!id) return;

		const fetchYoga = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch(`/api/yoga/${id}`);
				if (!response.ok) {
					throw new Error("Failed to fetch yoga session details");
				}
				const data = await response.json();

				setYoga({
					id: data.id,
					name: data.name || "Yoga Session",
					description: data.description || "",
					coverImage: data.coverImage,
					bannerImage: data.bannerImage,
					images: data.images || [],
					videos: data.videos || [],
					status: data.status || "Active",
				});
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

		fetchYoga();
	}, [id]);

	// Handle keyboard navigation for fullscreen images
	useEffect(() => {
		if (!isFullscreen || !yoga?.images || yoga.images.length === 0) return;

		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") {
				setCurrentImageIndex((prev) =>
					prev > 0 ? prev - 1 : yoga.images!.length - 1
				);
			} else if (e.key === "ArrowRight") {
				setCurrentImageIndex((prev) =>
					prev < yoga.images!.length - 1 ? prev + 1 : 0
				);
			} else if (e.key === "Escape") {
				setIsFullscreen(false);
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [isFullscreen, yoga?.images]);

	const sortedImages = yoga?.images
		? [...yoga.images].sort((a, b) => (a.order || 0) - (b.order || 0))
		: [];

	const handlePreviousImage = () => {
		setCurrentImageIndex((prev) =>
			prev > 0 ? prev - 1 : sortedImages.length - 1
		);
	};

	const handleNextImage = () => {
		setCurrentImageIndex((prev) =>
			prev < sortedImages.length - 1 ? prev + 1 : 0
		);
	};

	const openFullscreen = (index: number) => {
		setCurrentImageIndex(index);
		setIsFullscreen(true);
	};

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

	if (error || !yoga) {
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
		yoga.bannerImage ||
		(yoga.images && yoga.images.length > 0 ? yoga.images[0].url : undefined) ||
		"/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Banner Section */}
			<section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
				<div className="absolute inset-0">
					<Image
						src={bannerImage}
						alt={yoga.name}
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
							{yoga.name}
						</h1>
					</div>
				</div>
			</section>

			{/* Description Section */}
			<section className="py-12 bg-white">
				<div className="container mx-auto px-4 max-w-4xl">
					<div className="prose prose-lg max-w-none">
						<h2 className="text-3xl font-serif font-bold text-gray-900 mb-6">
							About This Session
						</h2>
						<div
							className="text-gray-700 leading-relaxed whitespace-pre-wrap"
							dangerouslySetInnerHTML={{
								__html: yoga.description.replace(/\n/g, "<br />"),
							}}
						/>
					</div>
				</div>
			</section>

			{/* Images Gallery Section */}
			{yoga.images && yoga.images.length > 0 && (
				<section className="py-12 bg-[#f5f5f0]">
					<div className="container mx-auto px-4 max-w-7xl">
						<h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center">
							Yoga Images
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{sortedImages.map((img, index) => (
								<div
									key={index}
									className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
									onClick={() => openFullscreen(index)}
								>
									<Image
										src={img.url}
										alt={img.alt || img.caption || `Yoga image ${index + 1}`}
										fill
										className="object-cover transition-transform duration-300 group-hover:scale-110"
									/>
									{/* Step Number Badge - More Subtle */}
									{img.order !== undefined && (
										<div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-semibold border border-white/20">
											{img.order}
										</div>
									)}
									{img.caption && (
										<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
											<p className="text-white text-sm font-medium">
												{img.caption}
											</p>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Videos Section */}
			{yoga.videos && yoga.videos.length > 0 && (
				<section className={`py-12 ${yoga.images && yoga.images.length > 0 ? "bg-[#f5f5f0]" : "bg-white"}`}>
					<div className="container mx-auto px-4 max-w-7xl">
						<h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center">
							Yoga Steps Video
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{yoga.videos.map((videoUrl, index) => (
								<div
									key={index}
									className="relative aspect-video rounded-2xl overflow-hidden shadow-lg bg-gray-900 group"
								>
									{selectedVideo === videoUrl ? (
										<video
											controls
											autoPlay
											className="w-full h-full object-contain"
											src={videoUrl}
										/>
									) : (
										<>
											<div className="absolute inset-0 flex items-center justify-center">
												<button
													onClick={() => setSelectedVideo(videoUrl)}
													className="bg-white/90 hover:bg-white text-gray-900 rounded-full p-4 transition-all duration-200 shadow-lg hover:scale-110"
												>
													<Play className="h-12 w-12 fill-current" />
												</button>
											</div>
											{/* Thumbnail if available */}
											<div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-500 opacity-50" />
										</>
									)}
								</div>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Fullscreen Image Modal */}
			{isFullscreen && sortedImages.length > 0 && (
				<div
					className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
					onClick={() => setIsFullscreen(false)}
				>
					<button
						onClick={() => setIsFullscreen(false)}
						className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2 transition-all duration-200 hover:bg-black/70"
						aria-label="Close fullscreen"
					>
						<X className="h-6 w-6" />
					</button>

					{sortedImages.length > 1 && (
						<>
							<button
								onClick={(e) => {
									e.stopPropagation();
									handlePreviousImage();
								}}
								className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-4 z-10 transition-all duration-200"
								aria-label="Previous image"
							>
								<ChevronLeft className="h-8 w-8" />
							</button>
							<button
								onClick={(e) => {
									e.stopPropagation();
									handleNextImage();
								}}
								className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-4 z-10 transition-all duration-200"
								aria-label="Next image"
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
							src={sortedImages[currentImageIndex].url}
							alt={
								sortedImages[currentImageIndex].alt ||
								sortedImages[currentImageIndex].caption ||
								`Yoga step ${sortedImages[currentImageIndex].order || currentImageIndex + 1}`
							}
							fill
							className="object-contain"
							sizes="100vw"
						/>
					</div>

					{/* Image Counter and Step Number */}
					{sortedImages.length > 1 && (
						<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-full text-lg backdrop-blur-sm">
							{sortedImages[currentImageIndex].order !== undefined
								? `Step ${sortedImages[currentImageIndex].order}`
								: `${currentImageIndex + 1}`}{" "}
							/ {sortedImages.length}
						</div>
					)}
					{sortedImages.length === 1 &&
						sortedImages[currentImageIndex].order !== undefined && (
							<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-full text-lg backdrop-blur-sm">
								Step {sortedImages[currentImageIndex].order}
							</div>
						)}
				</div>
			)}

			<Footer />
		</div>
	);
}
