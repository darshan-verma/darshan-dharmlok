"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, X } from "lucide-react";

export interface BalVidhyaItem {
	id: string;
	name: string;
	description?: string;
	type: string;
	category?: string;
	thumbnailUrl?: string;
	videoUrl?: string;
	videoFile?: string;
	bookFile?: string;
	url?: string;
	status?: string;
	impressions?: number;
}

interface BalVidhyaViewerProps {
	item: BalVidhyaItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const normalizeType = (item: BalVidhyaItem | null) =>
	item?.type?.toLowerCase().trim() || "";

const bookSrc = (item: BalVidhyaItem | null) =>
	item?.bookFile?.trim() ||
	(normalizeType(item) === "book" ? item?.url?.trim() || "" : "");

const directVideoSrc = (item: BalVidhyaItem | null) =>
	item?.videoFile?.trim() ||
	item?.videoUrl?.trim() ||
	(normalizeType(item) === "video" ? item?.url?.trim() || "" : "");

const hasBook = (item: BalVidhyaItem | null) => !!bookSrc(item);
const hasVideo = (item: BalVidhyaItem | null) => !!directVideoSrc(item);

const getYoutubeEmbedUrl = (src: string) => {
	try {
		const parsed = new URL(src);
		const host = parsed.hostname.toLowerCase();
		if (host.includes("youtu.be")) {
			const videoId = parsed.pathname.replace("/", "");
			return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
		}
		if (host.includes("youtube.com")) {
			const videoId = parsed.searchParams.get("v");
			if (videoId) return `https://www.youtube.com/embed/${videoId}`;
			if (parsed.pathname.startsWith("/embed/")) {
				return `https://www.youtube.com${parsed.pathname}`;
			}
		}
		return "";
	} catch {
		return "";
	}
};

const getVimeoEmbedUrl = (src: string) => {
	try {
		const parsed = new URL(src);
		const host = parsed.hostname.toLowerCase();
		if (!host.includes("vimeo.com")) return "";
		const segments = parsed.pathname.split("/").filter(Boolean);
		const videoId = segments[segments.length - 1];
		return videoId && /^\d+$/.test(videoId)
			? `https://player.vimeo.com/video/${videoId}`
			: "";
	} catch {
		return "";
	}
};

const embeddedVideoSrc = (item: BalVidhyaItem | null) => {
	const src = directVideoSrc(item);
	if (!src) return "";
	return getYoutubeEmbedUrl(src) || getVimeoEmbedUrl(src) || "";
};

export function BalVidhyaViewer({
	item,
	open,
	onOpenChange,
}: BalVidhyaViewerProps) {
	const [activeTab, setActiveTab] = useState<"book" | "video">("book");
	const containerRef = useRef<HTMLDivElement>(null);

	const showTabs = item && hasBook(item) && hasVideo(item);
	const defaultTab = hasBook(item) ? "book" : "video";

	// Reset tab when item changes
	useEffect(() => {
		if (item) setActiveTab(hasBook(item) ? "book" : "video");
	}, [item]);

	// Open directly in fullscreen when View Details is clicked (no modal)
	useEffect(() => {
		if (!open || !item) return;
		const el = containerRef.current;
		if (!el) return;
		const t = setTimeout(() => {
			try {
				el.requestFullscreen?.();
			} catch {
				// ignore
			}
		}, 100);
		return () => clearTimeout(t);
	}, [open, item]);

	// When user exits fullscreen (e.g. ESC), close the viewer
	useEffect(() => {
		const handler = () => {
			if (!document.fullscreenElement) {
				onOpenChange(false);
			}
		};
		document.addEventListener("fullscreenchange", handler);
		return () => document.removeEventListener("fullscreenchange", handler);
	}, [onOpenChange]);

	const handleClose = useCallback(() => {
		if (document.fullscreenElement) {
			document.exitFullscreen?.();
		}
		onOpenChange(false);
	}, [onOpenChange]);

	const effectiveTab = showTabs ? activeTab : defaultTab;

	// No modal: only render when open — fullscreen view with single close button
	if (!open || !item) return null;

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 z-[100] flex flex-col bg-background"
		>
			{/* Single header with title + one close (X) button */}
			<header className="flex items-center justify-between gap-4 shrink-0 px-4 py-3 border-b bg-background">
				<h2 className="text-xl font-serif font-semibold truncate pr-2">
					{item.name}
				</h2>
				<Button
					variant="outline"
					size="icon"
					onClick={handleClose}
					className="shrink-0 rounded-full h-10 w-10 border-2"
					aria-label="Close fullscreen"
				>
					<X className="h-5 w-5" />
				</Button>
			</header>

			{/* Content */}
			<div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
				{!hasBook(item) && !hasVideo(item) ? (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						No PDF or video available for this item.
					</div>
				) : showTabs ? (
					<Tabs
						value={effectiveTab}
						onValueChange={(v) => setActiveTab(v as "book" | "video")}
						className="flex-1 flex flex-col min-h-0"
					>
						<TabsList className="w-full justify-start gap-1 shrink-0 mb-3">
							<TabsTrigger value="book" className="gap-2">
								<BookOpen className="h-4 w-4" />
								Book (PDF)
							</TabsTrigger>
							<TabsTrigger value="video" className="gap-2">
								<Video className="h-4 w-4" />
								Video
							</TabsTrigger>
						</TabsList>
						<TabsContent
							value="book"
							className="flex-1 min-h-0 mt-0 rounded-lg border bg-muted/30 overflow-hidden"
						>
							<iframe
								title={`PDF: ${item.name}`}
								src={bookSrc(item)}
								className="w-full h-full min-h-[300px] rounded-lg"
							/>
						</TabsContent>
						<TabsContent
							value="video"
							className="flex-1 min-h-0 mt-0 rounded-lg border bg-black overflow-hidden"
						>
							{embeddedVideoSrc(item) ? (
								<iframe
									title={`Video: ${item.name}`}
									src={embeddedVideoSrc(item)}
									className="w-full h-full min-h-[300px]"
									allow="autoplay; encrypted-media; picture-in-picture"
									allowFullScreen
								/>
							) : (
								<video
									key={directVideoSrc(item)}
									controls
									className="w-full h-full min-h-[300px] object-contain"
									src={directVideoSrc(item)}
								>
									Your browser does not support the video tag.
								</video>
							)}
						</TabsContent>
					</Tabs>
				) : hasBook(item) ? (
					<div className="flex-1 min-h-0 rounded-lg border bg-muted/30 overflow-hidden">
						<iframe
							title={`PDF: ${item.name}`}
							src={bookSrc(item)}
							className="w-full h-full min-h-[300px] rounded-lg"
						/>
					</div>
				) : (
					<div className="flex-1 min-h-0 rounded-lg border bg-black overflow-hidden">
						{embeddedVideoSrc(item) ? (
							<iframe
								title={`Video: ${item.name}`}
								src={embeddedVideoSrc(item)}
								className="w-full h-full min-h-[300px]"
								allow="autoplay; encrypted-media; picture-in-picture"
								allowFullScreen
							/>
						) : (
							<video
								key={directVideoSrc(item)}
								controls
								className="w-full h-full min-h-[300px] object-contain"
								src={directVideoSrc(item)}
							>
								Your browser does not support the video tag.
							</video>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
