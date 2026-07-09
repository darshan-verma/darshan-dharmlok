"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
	Loader2,
	MapPin,
	Clock,
	Plane,
	Train,
	Bus,
	Car,
	CheckCircle,
	ArrowLeft,
	Image as ImageIcon,
	Video as VideoIcon,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
	hasRichContent,
	parseRichContent,
	type RichContent,
} from "@/lib/rich-content";

type Faq = { id: string; question: string; answer: string };

interface Dharamshala {
	id: string;
	name: string;
	date?: string;
	state?: string;
	city?: string;
	status: string;
	bannerImage?: string;
	coverImage?: string;
	address?: string;
	location?: string; // iframe html or src
	description?: string; // BlockNote JSON string
	additionalInfo?: string; // BlockNote JSON string
	imageFile?: string[];
	videoFile?: string[];
	timings?: string;
	travelByAir?: string[];
	travelByTrain?: string[];
	travelByBus?: string[];
	travelByRoad?: string[];
	amenities?: string[];
	dharamshalaFaqs?: Faq[];
}

function extractGoogleMapsSrc(input?: string): string {
	if (!input) return "";
	const match = input.match(/src=["']([^"']+)["']/);
	if (match && match[1]) return match[1];
	return input.trim();
}

function RichSection({
	title,
	content,
}: {
	title: string;
	content: RichContent;
}) {
	if (!hasRichContent(content)) return null;
	return (
		<div className="bg-white rounded-2xl p-6 shadow-sm">
			<h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">{title}</h2>
			{content.html ? (
				<div
					className="text-gray-700 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0"
					dangerouslySetInnerHTML={{ __html: content.html }}
				/>
			) : (
				<p className="text-gray-700 leading-relaxed whitespace-pre-line">{content.text}</p>
			)}
		</div>
	);
}

function normalizeStringArray(value: unknown): string[] {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return [];
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				return parsed.filter(
					(v): v is string => typeof v === "string" && v.trim().length > 0
				);
			}
			return [trimmed];
		} catch {
			return [trimmed];
		}
	}
	return [];
}

export default function DharmshalaDetailsPage() {
	const params = useParams();
	const router = useRouter();
	const { locale } = useLanguage();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;

	const [data, setData] = useState<Dharamshala | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);

	useEffect(() => {
		if (!id) return;

		const fetchOne = async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await fetch(`/api/dharamshala/${id}?lang=${locale}`);
				if (!res.ok) {
					if (res.status === 404) throw new Error("Dharmshala not found");
					throw new Error("Failed to fetch dharmshala details");
				}
				const json = await res.json();
				setData(json);
			} catch (err) {
				console.error("Error fetching dharmshala:", err);
				setError(err instanceof Error ? err.message : "Failed to load dharmshala details");
			} finally {
				setLoading(false);
			}
		};

		fetchOne();
	}, [id, locale]);

	const mapSrc = useMemo(() => extractGoogleMapsSrc(data?.location), [data?.location]);
	const descriptionContent = useMemo(
		() => parseRichContent(data?.description),
		[data?.description]
	);
	const additionalInfoContent = useMemo(
		() => parseRichContent(data?.additionalInfo),
		[data?.additionalInfo]
	);
	const travelByAir = useMemo(() => normalizeStringArray(data?.travelByAir), [data?.travelByAir]);
	const travelByTrain = useMemo(
		() => normalizeStringArray(data?.travelByTrain),
		[data?.travelByTrain]
	);
	const travelByBus = useMemo(() => normalizeStringArray(data?.travelByBus), [data?.travelByBus]);
	const travelByRoad = useMemo(
		() => normalizeStringArray(data?.travelByRoad),
		[data?.travelByRoad]
	);
	const amenities = useMemo(() => normalizeStringArray(data?.amenities), [data?.amenities]);
	const videos = useMemo(() => normalizeStringArray(data?.videoFile), [data?.videoFile]);

	const allImages = useMemo(() => {
		const arr = [
			data?.bannerImage,
			data?.coverImage,
			...(data?.imageFile || []),
		].filter((x): x is string => Boolean(x));
		// de-dupe while preserving order
		return Array.from(new Set(arr));
	}, [data]);

	const bannerImage = data?.bannerImage || "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";

	if (loading) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
					<p className="text-lg text-muted-foreground">Loading dharmshala details...</p>
				</div>
				<Footer />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="min-h-screen bg-white">
				<Header />
				<div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
					<p className="text-lg text-red-500">{error || "Dharmshala not found"}</p>
					<button
						onClick={() => router.push("/dharmshala")}
						className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
					>
						Back to Dharmshalas
					</button>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Banner */}
			<section className="relative w-full h-[400px] md:h-[520px] overflow-hidden">
				<div className="absolute inset-0">
					<Image
						src={bannerImage}
						alt={data.name}
						fill
						className="object-cover"
						priority
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							target.src = "/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg";
						}}
					/>
					<div className="absolute inset-0 bg-black/45" />
				</div>

				<div className="relative z-10 h-full flex items-end">
					<div className="container mx-auto px-4 pb-8 max-w-7xl">
						<button
							onClick={() => router.back()}
							className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-5"
						>
							<ArrowLeft className="w-4 h-4" />
							Back
						</button>
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white drop-shadow-2xl">
							{data.name}
						</h1>
						<div className="mt-3 flex items-center gap-3 flex-wrap text-white/90">
							{(data.city || data.state) && (
								<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-sm">
									<MapPin className="w-4 h-4" />
									{[data.city, data.state].filter(Boolean).join(", ")}
								</span>
							)}
							{data.timings && (
								<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-sm">
									<Clock className="w-4 h-4" />
									{data.timings}
								</span>
							)}
						</div>
					</div>
				</div>
			</section>

			{/* Main */}
			<section className="py-12 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Left column */}
						<div className="lg:col-span-2 space-y-8">
							<RichSection title="Description" content={descriptionContent} />
							<RichSection title="Additional Info" content={additionalInfoContent} />

							{/* Media */}
							{(allImages.length > 0 || videos.length > 0) && (
								<div className="bg-white rounded-2xl p-6 shadow-sm">
									<h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
										Media
									</h2>

									{allImages.length > 0 && (
										<div className="mb-10">
											<div className="flex items-center justify-between mb-4">
												<div className="flex items-center gap-2">
													<ImageIcon className="w-5 h-5 text-primary" />
													<h3 className="text-lg font-semibold text-gray-900">Photos</h3>
												</div>
												<span className="text-sm text-gray-500">{allImages.length} photos</span>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="md:col-span-2">
													<Dialog>
														<DialogTrigger asChild>
															<div className="relative w-full h-96 bg-gray-200 rounded-xl overflow-hidden shadow-md cursor-pointer hover:opacity-95 transition-opacity">
																<Image
																	src={allImages[selectedImageIndex] || allImages[0]}
																	alt={`Dharmshala image ${selectedImageIndex + 1}`}
																	fill
																	className="object-cover"
																	priority={selectedImageIndex === 0}
																/>
															</div>
														</DialogTrigger>
														<DialogContent className="max-w-5xl">
															<DialogHeader>
																<DialogTitle>{data.name}</DialogTitle>
															</DialogHeader>
															<div className="relative w-full aspect-video mt-4">
																<Image
																	src={allImages[selectedImageIndex] || allImages[0]}
																	alt={`Dharmshala image ${selectedImageIndex + 1}`}
																	fill
																	className="object-contain"
																/>
															</div>
														</DialogContent>
													</Dialog>
												</div>

												{allImages.length > 1 && (
													<div className="md:col-span-2 grid grid-cols-4 gap-2">
														{allImages.slice(0, 8).map((img, idx) => (
															<button
																key={img}
																onClick={() => setSelectedImageIndex(idx)}
																className={`relative w-full h-24 bg-gray-200 rounded-lg overflow-hidden border-2 transition-all ${
																	selectedImageIndex === idx
																		? "border-primary ring-2 ring-primary/20"
																		: "border-transparent hover:border-primary/50"
																}`}
															>
																<Image
																	src={img}
																	alt={`Dharmshala thumbnail ${idx + 1}`}
																	fill
																	className="object-cover"
																	loading="lazy"
																/>
															</button>
														))}
													</div>
												)}
											</div>
										</div>
									)}

									{videos.length > 0 && (
										<div>
											<div className="flex items-center gap-2 mb-4">
												<VideoIcon className="w-5 h-5 text-primary" />
												<h3 className="text-lg font-semibold text-gray-900">Videos</h3>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{videos.map((v) => (
													<div key={v} className="bg-gray-50 rounded-xl p-3">
														<video
															src={v}
															controls
															className="w-full rounded-lg bg-black"
														/>
													</div>
												))}
											</div>
										</div>
									)}
								</div>
							)}

							{/* Timings */}
							{data.timings && (
								<div className="bg-white rounded-2xl p-6 shadow-sm">
									<h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
										Timings
									</h2>
									<div className="flex items-start gap-3">
										<Clock className="w-5 h-5 text-primary mt-1" />
										<p className="text-gray-700">{data.timings}</p>
									</div>
								</div>
							)}

							{/* Best way to travel */}
							{[
								travelByAir.length > 0,
								travelByTrain.length > 0,
								travelByBus.length > 0,
								travelByRoad.length > 0,
							].some(Boolean) && (
								<div className="bg-white rounded-2xl p-6 shadow-sm">
									<h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
										Best way to travel
									</h2>

									<div className="space-y-6">
										{travelByAir.length > 0 && (
											<div>
												<div className="flex items-center gap-2 mb-2">
													<Plane className="w-5 h-5 text-primary" />
													<h3 className="text-lg font-semibold text-gray-900">By Air</h3>
												</div>
												<ul className="list-disc pl-6 text-gray-700 space-y-1">
													{travelByAir.map((t, idx) => (
														<li key={idx}>{t}</li>
													))}
												</ul>
											</div>
										)}

										{travelByTrain.length > 0 && (
											<div>
												<div className="flex items-center gap-2 mb-2">
													<Train className="w-5 h-5 text-primary" />
													<h3 className="text-lg font-semibold text-gray-900">By Train</h3>
												</div>
												<ul className="list-disc pl-6 text-gray-700 space-y-1">
													{travelByTrain.map((t, idx) => (
														<li key={idx}>{t}</li>
													))}
												</ul>
											</div>
										)}

										{travelByBus.length > 0 && (
											<div>
												<div className="flex items-center gap-2 mb-2">
													<Bus className="w-5 h-5 text-primary" />
													<h3 className="text-lg font-semibold text-gray-900">By Bus</h3>
												</div>
												<ul className="list-disc pl-6 text-gray-700 space-y-1">
													{travelByBus.map((t, idx) => (
														<li key={idx}>{t}</li>
													))}
												</ul>
											</div>
										)}

										{travelByRoad.length > 0 && (
											<div>
												<div className="flex items-center gap-2 mb-2">
													<Car className="w-5 h-5 text-primary" />
													<h3 className="text-lg font-semibold text-gray-900">By Road</h3>
												</div>
												<ul className="list-disc pl-6 text-gray-700 space-y-1">
													{travelByRoad.map((t, idx) => (
														<li key={idx}>{t}</li>
													))}
												</ul>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Amenities */}
							{amenities.length > 0 && (
								<div className="bg-white rounded-2xl p-6 shadow-sm">
									<h2 className="text-2xl font-serif font-bold text-gray-900 mb-6">
										Amenities
									</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										{amenities.map((a, idx) => (
											<div
												key={`${a}-${idx}`}
												className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
											>
												<CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
												<span className="text-sm font-medium text-gray-700">{a}</span>
											</div>
										))}
									</div>
								</div>
							)}

							{/* FAQs */}
							{data.dharamshalaFaqs && data.dharamshalaFaqs.length > 0 && (
								<div className="bg-white rounded-2xl p-6 shadow-sm">
									<h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
										FAQs
									</h2>
									<Accordion type="single" collapsible className="w-full">
										{data.dharamshalaFaqs.map((faq, idx) => (
											<AccordionItem key={faq.id || String(idx)} value={`faq-${idx}`}>
												<AccordionTrigger>{faq.question}</AccordionTrigger>
												<AccordionContent>
													<p className="text-gray-700 whitespace-pre-line">{faq.answer}</p>
												</AccordionContent>
											</AccordionItem>
										))}
									</Accordion>
								</div>
							)}
						</div>

						{/* Right column */}
						<div className="lg:col-span-1 space-y-6">
							{/* Address */}
							{data.address && (
								<div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
									<h2 className="text-xl font-bold mb-4 text-gray-900">Address</h2>
									<div className="flex items-start gap-3">
										<MapPin className="w-5 h-5 text-primary mt-1" />
										<p className="text-gray-700">{data.address}</p>
									</div>

									{mapSrc && (
										<div className="mt-5">
											<h3 className="text-sm font-semibold text-gray-900 mb-2">Map</h3>
											<div className="w-full rounded-xl overflow-hidden bg-gray-100">
												<iframe
													src={mapSrc}
													width="100%"
													height="260"
													style={{ border: 0 }}
													allowFullScreen
													loading="lazy"
													referrerPolicy="no-referrer-when-downgrade"
												/>
											</div>
											<a
												href={mapSrc}
												target="_blank"
												rel="noopener noreferrer"
												className="text-xs text-blue-600 hover:underline mt-2 inline-block"
											>
												Open in Google Maps →
											</a>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			<Footer />
		</div>
	);
}

