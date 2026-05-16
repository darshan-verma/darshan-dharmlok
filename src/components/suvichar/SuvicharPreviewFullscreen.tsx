"use client";

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SuvicharCard } from "./SuvicharCard";
import type {
	TextStyleOverrides,
	TodaySuvicharFrame,
	TodaySuvicharText,
} from "@/lib/suvichar/types";

interface SuvicharPreviewFullscreenProps {
	text: TodaySuvicharText;
	frame: TodaySuvicharFrame;
	textStyleOverrides?: TextStyleOverrides | null;
	/** Inline preview size in the scheduler panel */
	inlineSize?: number;
}

function computeFullscreenSize(): number {
	if (typeof window === "undefined") return 480;
	const pad = 64;
	return Math.min(
		window.innerWidth - pad,
		window.innerHeight - pad,
		920,
	);
}

export function SuvicharPreviewFullscreen({
	text,
	frame,
	textStyleOverrides,
	inlineSize = 260,
}: SuvicharPreviewFullscreenProps) {
	const [open, setOpen] = useState(false);
	const [fullscreenSize, setFullscreenSize] = useState(480);

	useEffect(() => {
		if (!open) return;
		const update = () => setFullscreenSize(computeFullscreenSize());
		update();
		window.addEventListener("resize", update);
		return () => window.removeEventListener("resize", update);
	}, [open]);

	return (
		<>
			<div className="flex w-full flex-col items-center gap-3">
				<div className="flex w-full items-center justify-between gap-2">
					<h2 className="text-sm font-semibold">Live preview</h2>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="gap-1.5"
						onClick={() => setOpen(true)}
					>
						<Maximize2 className="h-3.5 w-3.5" />
						Fullscreen
					</Button>
				</div>
				<SuvicharCard
					text={text}
					frame={frame}
					textStyleOverrides={textStyleOverrides}
					displaySize={inlineSize}
				/>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="flex max-h-[96vh] w-[96vw] max-w-[96vw] flex-col items-center justify-center gap-4 border-0 bg-black/95 p-4 sm:max-w-[96vw] sm:p-8 [&>button.absolute]:hidden">
					<DialogTitle className="sr-only">Suvichar fullscreen preview</DialogTitle>
					<div className="flex w-full items-center justify-between text-white">
						<p className="text-sm font-medium text-orange-200">
							{text.title ?? "Preview"}
						</p>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="text-white hover:bg-white/10"
							onClick={() => setOpen(false)}
							aria-label="Close fullscreen preview"
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
					<div className="flex flex-1 items-center justify-center overflow-auto">
						<SuvicharCard
							text={text}
							frame={frame}
							textStyleOverrides={textStyleOverrides}
							displaySize={fullscreenSize}
							className="shadow-2xl"
						/>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
