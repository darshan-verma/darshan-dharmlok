"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, SunMoon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	dateInputToIsoDatetime,
	getTodayYyyyMmDd,
} from "@/lib/datetime-local";
import type {
	ProkeralaAdvancedDailyPredictionResponse,
	ProkeralaPanchangResponse,
} from "@/types/prokerala";

type SummaryState = {
	daily: string;
	panchang: string;
} | null;

function truncate(text: string, max = 140): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max).trim()}…`;
}

export function HoroscopeNavTooltip() {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [summary, setSummary] = useState<SummaryState>(null);

	const today = useMemo(() => getTodayYyyyMmDd(), []);
	const janFirst = useMemo(
		() => `${new Date().getFullYear()}-01-01`,
		[],
	);
	const datetime = useMemo(() => dateInputToIsoDatetime(today), [today]);
	const panchangDatetime = useMemo(
		() => dateInputToIsoDatetime(janFirst),
		[janFirst],
	);

	const dailyHref = useMemo(() => {
		const params = new URLSearchParams({
			autofill: "1",
			sign: "aries",
			type: "general",
		});
		return `/horoscope/daily-horoscope?${params.toString()}`;
	}, []);

	const panchangHref = useMemo(() => {
		const params = new URLSearchParams({
			autofill: "1",
			ayanamsa: "1",
			date: janFirst,
			location: "New Delhi",
			language: "en",
			resultType: "basic",
		});
		return `/horoscope/panchang?${params.toString()}`;
	}, [janFirst]);

	const fetchSummary = async () => {
		if (loading || summary) return;
		setLoading(true);
		setError(null);

		try {
			const dailyUrl = `/api/prokerala/horoscope/daily/advanced?${new URLSearchParams(
				{
					datetime,
					sign: "aries",
					type: "general",
				},
			).toString()}`;

			const geocodeRes = await fetch(
				`/api/geocode?q=${encodeURIComponent("New Delhi")}`,
			);
			const geocodeJson = (await geocodeRes.json()) as {
				lat?: number;
				lng?: number;
				error?: string;
			};
			if (!geocodeRes.ok || geocodeJson.lat == null || geocodeJson.lng == null) {
				throw new Error(geocodeJson.error ?? "Unable to resolve location.");
			}

			const panchangUrl = `/api/prokerala/panchang?${new URLSearchParams({
				ayanamsa: "1",
				coordinates: `${geocodeJson.lat},${geocodeJson.lng}`,
				datetime: panchangDatetime,
				la: "en",
			}).toString()}`;

			const [dailyRes, panchangRes] = await Promise.all([
				fetch(dailyUrl),
				fetch(panchangUrl),
			]);

			const dailyJson =
				(await dailyRes.json()) as ProkeralaAdvancedDailyPredictionResponse;
			const panchangJson = (await panchangRes.json()) as ProkeralaPanchangResponse;

			if (!dailyRes.ok || !panchangRes.ok) {
				throw new Error("Could not fetch horoscope preview.");
			}

			const dailyPrediction =
				dailyJson.data?.daily_predictions?.[0]?.predictions?.[0]?.prediction ??
				"No summary available.";

			const panchangData = panchangJson.data;
			const tithi = panchangData?.tithi?.[0]?.name ?? "N/A";
			const nakshatra = panchangData?.nakshatra?.[0]?.name ?? "N/A";
			const vaara = panchangData?.vaara ?? "N/A";
			const sunrise = panchangData?.sunrise ?? "N/A";
			const sunset = panchangData?.sunset ?? "N/A";
			const panchangSummary = `Vaara: ${vaara}, Tithi: ${tithi}, Nakshatra: ${nakshatra}, Sunrise: ${sunrise}, Sunset: ${sunset}`;

			setSummary({
				daily: truncate(dailyPrediction),
				panchang: truncate(panchangSummary),
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Unable to load preview.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Tooltip
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (open) {
					void fetchSummary();
				}
			}}
		>
			<TooltipTrigger asChild>
				<button
					className="p-2 hover:bg-gray-100 rounded-full transition-colors"
					aria-label="Horoscope quick preview"
					onMouseEnter={() => {
						void fetchSummary();
					}}
				>
					<SunMoon className="w-5 h-5 text-gray-700" />
				</button>
			</TooltipTrigger>
			<TooltipContent
				sideOffset={8}
				className="w-[360px] rounded-xl border border-orange-200 bg-white p-4 text-gray-900 shadow-xl"
			>
				<div className="space-y-3 text-sm">
					<div className="flex items-center gap-2 text-orange-600">
						<Sparkles className="h-4 w-4" />
						<span className="font-semibold">Horoscope Snapshot</span>
					</div>

					{loading ? (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Loading latest preview...
						</div>
					) : error ? (
						<p className="text-red-600">{error}</p>
					) : summary ? (
						<>
							<div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
								<p className="font-medium text-gray-800">Daily Horoscope</p>
								<p className="mt-1 text-gray-700">{summary.daily}</p>
								<Link
									href={dailyHref}
									className="mt-2 inline-block text-xs font-semibold text-orange-600 hover:text-orange-700"
								>
									See more
								</Link>
							</div>

							<div className="rounded-lg border border-orange-100 bg-orange-50/40 p-3">
								<p className="font-medium text-gray-800">Today Panchang</p>
								<p className="mt-1 text-gray-700">{summary.panchang}</p>
								<Link
									href={panchangHref}
									className="mt-2 inline-block text-xs font-semibold text-orange-600 hover:text-orange-700"
								>
									See more
								</Link>
							</div>
						</>
					) : (
						<p className="text-muted-foreground">
							Hover to load a quick horoscope summary.
						</p>
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	);
}
