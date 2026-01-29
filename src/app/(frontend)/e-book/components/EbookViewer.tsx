"use client";

import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export interface EbookItem {
	id: string;
	title: string;
	description?: string;
	bookFile?: string;
	bookCover?: string;
	status?: string;
}

interface EbookViewerProps {
	item: EbookItem | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const hasPdf = (item: EbookItem | null) => !!item?.bookFile?.trim();

export function EbookViewer({
	item,
	open,
	onOpenChange,
}: EbookViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// Open fullscreen when viewer opens
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

	if (!open || !item) return null;

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 z-[100] flex flex-col bg-background"
		>
			<header className="flex items-center justify-between gap-4 shrink-0 px-4 py-3 border-b bg-background">
				<h2 className="text-xl font-serif font-semibold truncate pr-2">
					{item.title}
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

			<div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
				{!hasPdf(item) ? (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						No PDF available for this book.
					</div>
				) : (
					<div className="flex-1 min-h-0 rounded-lg border bg-muted/30 overflow-hidden">
						<iframe
							title={`PDF: ${item.title}`}
							src={item.bookFile!}
							className="w-full h-full min-h-[300px] rounded-lg"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
