"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Quote, Download } from "lucide-react";
import { useTranslation } from "@/components/providers/LanguageProvider";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SuvicharCard } from "./SuvicharCard";
import { exportElementToPng } from "@/lib/suvichar/export";
import type { TodaySuvicharResponse } from "@/lib/suvichar/types";
import { toast } from "@/lib/toast";

let cachedToday: TodaySuvicharResponse | null = null;
let cacheDate = "";

function getCacheKey() {
	return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function DailySuvicharIcon() {
	const { t } = useTranslation();
	const [isDesktopOpen, setIsDesktopOpen] = useState(false);
	const [isMobileOpen, setIsMobileOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<TodaySuvicharResponse | null>(null);
	const [downloading, setDownloading] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const exportRef = useRef<HTMLDivElement>(null);

	const fetchToday = useCallback(async () => {
		const key = getCacheKey();
		if (cachedToday && cacheDate === key) {
			setData(cachedToday);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/suvichar/today");
			if (!res.ok) {
				if (res.status === 404) {
					setError(t("suvichar.notAvailable"));
					setData(null);
					return;
				}
				throw new Error("Failed to load");
			}
			const json = (await res.json()) as TodaySuvicharResponse;
			cachedToday = json;
			cacheDate = key;
			setData(json);
		} catch {
			setError(t("suvichar.loadError"));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		if (isDesktopOpen || isMobileOpen) {
			void fetchToday();
		}
	}, [isDesktopOpen, isMobileOpen, fetchToday]);

	const handleDownload = async () => {
		const node = exportRef.current;
		if (!node || !data) return;
		setDownloading(true);
		try {
			await exportElementToPng(
				node,
				`dharmlok-suvichar-${data.scheduledDate}.png`,
				{ pixelRatio: 2 },
			);
			toast.success(t("suvichar.downloadSuccess"));
		} catch {
			toast.error(t("suvichar.downloadError"));
		} finally {
			setDownloading(false);
		}
	};

	const previewContent = (
		<div className="space-y-4">
			{loading ? (
				<div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
					<Loader2 className="h-5 w-5 animate-spin" />
					<span>{t("common.loading")}</span>
				</div>
			) : error ? (
				<p className="py-8 text-center text-sm text-red-600">{error}</p>
			) : data ? (
				<>
					<div className="flex justify-center">
						<SuvicharCard
							ref={cardRef}
							text={data.text}
							frame={data.frame}
							textStyleOverrides={data.textStyleOverrides}
							displaySize={isMobileOpen ? 300 : 280}
						/>
					</div>
					{/* Hidden full-size node for export */}
					<div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0">
						<SuvicharCard
							ref={exportRef}
							text={data.text}
							frame={data.frame}
							textStyleOverrides={data.textStyleOverrides}
							displaySize={1080}
						/>
					</div>
					<Button
						type="button"
						className="w-full bg-orange-500 hover:bg-orange-600"
						onClick={() => void handleDownload()}
						disabled={downloading}
					>
						{downloading ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Download className="mr-2 h-4 w-4" />
						)}
						{t("suvichar.downloadPng")}
					</Button>
				</>
			) : null}
		</div>
	);

	return (
		<>
			{/* Desktop: hover tooltip */}
			<div className="hidden lg:block">
				<Tooltip
					open={isDesktopOpen}
					onOpenChange={(open) => {
						setIsDesktopOpen(open);
					}}
				>
					<TooltipTrigger asChild>
						<button
							type="button"
							className="p-2 hover:bg-gray-100 rounded-full transition-colors"
							aria-label={t("suvichar.ariaLabel")}
							onMouseEnter={() => setIsDesktopOpen(true)}
						>
							<Quote className="w-5 h-5 text-gray-700" />
						</button>
					</TooltipTrigger>
					<TooltipContent
						sideOffset={8}
						className="w-[340px] rounded-xl border border-orange-200 bg-white p-4 text-gray-900 shadow-xl"
						onPointerDownOutside={() => setIsDesktopOpen(false)}
					>
						<p className="mb-3 text-center text-sm font-semibold text-orange-700">
							{t("suvichar.title")}
						</p>
						{previewContent}
					</TooltipContent>
				</Tooltip>
			</div>

			{/* Mobile: tap opens dialog */}
			<div className="lg:hidden">
				<button
					type="button"
					className="p-2 hover:bg-gray-100 rounded-full transition-colors"
					aria-label={t("suvichar.ariaLabel")}
					onClick={() => setIsMobileOpen(true)}
				>
					<Quote className="w-5 h-5 text-gray-700" />
				</button>
				<Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
					<DialogContent className="max-w-[360px] rounded-2xl">
						<DialogHeader>
							<DialogTitle className="text-center text-orange-700">
								{t("suvichar.title")}
							</DialogTitle>
						</DialogHeader>
						{previewContent}
					</DialogContent>
				</Dialog>
			</div>
		</>
	);
}
