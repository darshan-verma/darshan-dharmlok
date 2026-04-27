"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { PageBanner } from "@/components/shared/PageBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";
import Image from "next/image";

type FrontendLiveDarshan = {
	id: string;
	title: string;
	description: string;
	youtubeUrl: string;
	thumbnailUrl?: string | null;
	status: string;
	date: string;
};

function getYouTubeVideoId(url: string): string | null {
	try {
		const normalizedUrl = url.trim();
		if (!normalizedUrl) return null;
		const parsedUrl = new URL(normalizedUrl);

		if (parsedUrl.hostname.includes("youtu.be")) {
			return parsedUrl.pathname.slice(1);
		}

		if (parsedUrl.hostname.includes("youtube.com")) {
			if (parsedUrl.pathname.startsWith("/watch")) {
				return parsedUrl.searchParams.get("v");
			}
			const parts = parsedUrl.pathname.split("/").filter(Boolean);
			const embedIndex = parts.indexOf("embed");
			if (embedIndex !== -1 && parts[embedIndex + 1]) {
				return parts[embedIndex + 1];
			}
			if (parts.length > 0) {
				return parts[parts.length - 1];
			}
		}

		return null;
	} catch {
		return null;
	}
}

function getEmbedUrl(videoId: string) {
	return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1`;
}

function getYouTubeThumbnailUrl(videoId: string) {
	return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export default function LiveDarshanPage() {
	const [streams, setStreams] = useState<FrontendLiveDarshan[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeStreamId, setActiveStreamId] = useState<string | null>(null);

	const activeStream = useMemo(
		() => streams.find((stream) => stream.id === activeStreamId) ?? null,
		[activeStreamId, streams],
	);

	const loadStreams = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/live-darshan", { cache: "no-store" });
			if (!response.ok) throw new Error("Unable to load live darshan streams.");
			const data = await response.json();
			const items = Array.isArray(data.content) ? data.content : [];
			setStreams(
				items.filter(
					(stream: FrontendLiveDarshan) => stream.status === "Active",
				),
			);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load streams.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadStreams();
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<Header />
			<PageBanner
				pageSlug="live-darshan"
				title="Live Darshan"
				description="Watch live YouTube darshan sessions directly on the site."
				alt="Live Darshan"
				className="h-[320px] md:h-[420px]"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-4 drop-shadow-2xl"
				descriptionClassName="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-light"
			/>

			<section className="py-12 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl space-y-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
								Live Darshan Streams
							</h2>
							<p className="text-sm text-muted-foreground mt-1 max-w-2xl">
								Tap a card to start playback in place, or open the live stream
								in YouTube.
							</p>
						</div>
						<Button onClick={loadStreams} disabled={loading}>
							{loading ? "Refreshing..." : "Refresh"}
						</Button>
					</div>

					{error ? (
						<Card>
							<CardContent className="py-10 text-center text-red-600">
								{error}
							</CardContent>
						</Card>
					) : streams.length === 0 ? (
						<Card>
							<CardContent className="py-10 text-center text-muted-foreground">
								No live darshan streams are active right now.
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-6 md:grid-cols-2">
							{streams.map((stream) => {
								const isActive = stream.id === activeStreamId;
								const streamId = getYouTubeVideoId(stream.youtubeUrl);
								const embedUrl = streamId ? getEmbedUrl(streamId) : null;
								const thumbnailUrl =
									stream.thumbnailUrl ||
									(streamId ? getYouTubeThumbnailUrl(streamId) : null);

								return (
									<Card key={stream.id} className="overflow-hidden">
										<CardHeader className="p-0">
											<div
												className="relative cursor-pointer overflow-hidden bg-slate-950"
												onClick={() => setActiveStreamId(stream.id)}
											>
												{isActive && embedUrl ? (
													<div className="aspect-video w-full bg-black">
														<iframe
															title={stream.title}
															className="h-full w-full"
															src={embedUrl}
															allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
															allowFullScreen
														/>
													</div>
												) : (
													<div className="relative aspect-video w-full">
														{thumbnailUrl ? (
															<Image
																src={thumbnailUrl}
																alt={stream.title}
																width={640}
																height={360}
																className="h-full w-full object-cover"
															/>
														) : (
															<div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
																<span className="text-sm text-slate-300">
																	Live darshan preview
																</span>
															</div>
														)}
														<div className="absolute inset-0 bg-black/30" />
														<div className="absolute inset-0 flex items-center justify-center">
															<div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg">
																<Play className="h-6 w-6" />
															</div>
														</div>
													</div>
												)}
											</div>
										</CardHeader>
										<CardContent className="space-y-3 px-4 py-4">
											<CardTitle className="text-lg font-semibold">
												{stream.title}
											</CardTitle>
											<p className="text-sm text-muted-foreground line-clamp-3">
												{stream.description}
											</p>
											<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
												<span className="text-xs uppercase tracking-wide text-slate-500">
													Status: {stream.status}
												</span>
												<Button variant="outline" size="sm" asChild>
													<a
														href={stream.youtubeUrl}
														target="_blank"
														rel="noreferrer"
													>
														Open on YouTube
													</a>
												</Button>
											</div>
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}

					{activeStream && (
						<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<h3 className="text-lg font-semibold">Now Playing</h3>
									<p className="text-sm text-muted-foreground">
										{activeStream.title}
									</p>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setActiveStreamId(null)}
								>
									Close Player
								</Button>
							</div>
						</div>
					)}
				</div>
			</section>
			<Footer />
		</div>
	);
}
