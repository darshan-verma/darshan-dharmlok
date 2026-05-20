"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Loader2, Search } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useAirportSearch } from "@/hooks/useAirportSearch";
import type { AirportSearchResult } from "@/lib/reference-data-client";

export interface City {
	city: string;
	airport: string;
	code: string;
}

interface FromToSelectorProps {
	from: City;
	to: City;
	onSwap: () => void;
	onFromChange?: (city: City) => void;
	onToChange?: (city: City) => void;
	compact?: boolean;
	dark?: boolean;
}

export function airportToCity(a: AirportSearchResult): City {
	return {
		city: a.city,
		airport: a.name,
		code: a.code,
	};
}

/** Resolve display fields for a stored IATA code via /api/airports (client-safe). */
export async function fetchCityFromCode(code: string): Promise<City> {
	const upper = code.trim().toUpperCase();
	if (!upper) {
		return { city: "", airport: "", code: "" };
	}
	try {
		const res = await fetch(
			`/api/airports?q=${encodeURIComponent(upper)}`,
		);
		if (res.ok) {
			const list = (await res.json()) as AirportSearchResult[];
			const hit = list.find((a) => a.code === upper);
			if (hit) return airportToCity(hit);
		}
	} catch {
		// fall through
	}
	return { city: upper, airport: `${upper} Airport`, code: upper };
}

function CitySelector({
	selectedCity,
	onSelect,
	label,
	compact = false,
	dark = false,
	side,
}: {
	selectedCity: City;
	onSelect: (city: City) => void;
	label: string;
	compact?: boolean;
	dark?: boolean;
	side?: "from" | "to";
}) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [highlightIndex, setHighlightIndex] = useState(0);
	const listRef = useRef<HTMLDivElement>(null);
	const { results, loading } = useAirportSearch(search, open);

	useEffect(() => {
		setHighlightIndex(0);
	}, [results, search]);

	const selectAt = useCallback(
		(index: number) => {
			const item = results[index];
			if (!item) return;
			onSelect(airportToCity(item));
			setOpen(false);
			setSearch("");
		},
		[results, onSelect],
	);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Escape") {
			setOpen(false);
			return;
		}
		if (results.length === 0) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			selectAt(highlightIndex);
		}
	};

	useEffect(() => {
		const el = listRef.current?.children[highlightIndex] as
			| HTMLElement
			| undefined;
		el?.scrollIntoView({ block: "nearest" });
	}, [highlightIndex]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={`w-full h-full ${compact ? "p-2" : "py-2 px-3"} ${
						side === "from" ? "pr-10" : ""
					} ${side === "to" ? "pl-10" : ""} ${
						dark
							? "bg-slate-800 text-white hover:bg-slate-700"
							: "hover:bg-gray-100"
					} cursor-pointer transition-colors text-left flex flex-col justify-center`}
				>
					<div
						className={`${
							dark ? "text-[10px] text-slate-300" : "text-[10px] text-gray-500"
						} mb-0.5 uppercase tracking-wide font-medium`}
					>
						{label}
					</div>
					{selectedCity.city ? (
						<div className="w-full">
							<div
								className={`${compact ? "text-base" : "text-lg"} font-bold ${
									dark ? "text-white" : "text-gray-900"
								} truncate leading-tight`}
								title={selectedCity.city}
							>
								{selectedCity.city}
							</div>
							<div
								className={`${compact ? "text-[10px]" : "text-[11px]"} ${
									dark ? "text-slate-300" : "text-gray-500"
								} truncate mt-0.5`}
							>
								{selectedCity.code}, {selectedCity.airport}
							</div>
						</div>
					) : (
						<div
							className={`${compact ? "text-sm" : "text-base"} ${
								dark ? "text-slate-400" : "text-gray-400"
							} font-medium`}
						>
							Select city
						</div>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent
				className={`${compact ? "w-64" : "w-80"} p-0`}
				align="start"
			>
				<div className="p-3 border-b">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							placeholder="Search cities..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={handleKeyDown}
							className="w-full pl-10 pr-9 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						{loading && (
							<Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
						)}
					</div>
				</div>
				<div ref={listRef} className="max-h-64 overflow-y-auto">
					{search.trim().length < 2 ? (
						<div className="px-4 py-6 text-center text-sm text-gray-500">
							Type at least 2 characters
						</div>
					) : loading && results.length === 0 ? (
						<div className="px-4 py-6 text-center text-sm text-gray-500">
							Searching…
						</div>
					) : results.length > 0 ? (
						results.map((airport, index) => (
							<button
								key={airport.code}
								type="button"
								onClick={() => selectAt(index)}
								onMouseEnter={() => setHighlightIndex(index)}
								className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 ${
									index === highlightIndex ? "bg-blue-50" : ""
								} ${airport.code === selectedCity.code ? "bg-blue-50/80" : ""}`}
							>
								<div className="font-semibold text-gray-900">
									{airport.city} ({airport.code})
								</div>
								<div className="text-xs text-gray-500">
									{airport.country}
								</div>
							</button>
						))
					) : (
						<div className="px-4 py-8 text-center text-sm text-gray-500">
							No airports found
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}

export default function FromToSelector({
	from,
	to,
	onSwap,
	onFromChange,
	onToChange,
	compact = false,
	dark = false,
}: FromToSelectorProps) {
	return (
		<div
			className={`relative flex items-center gap-0 rounded-lg overflow-hidden border h-full ${
				dark ? "bg-slate-900 border-slate-700" : "bg-gray-50 border-gray-200"
			}`}
		>
			<div className="flex-1 h-full min-w-0">
				<CitySelector
					selectedCity={from}
					onSelect={(city) => onFromChange?.(city)}
					label="From"
					compact={compact}
					dark={dark}
					side="from"
				/>
			</div>

			<button
				type="button"
				onClick={onSwap}
				aria-label="Swap cities"
				className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 focus:outline-none ${
					compact ? "p-1" : "p-2"
				} rounded-full`}
			>
				<div
					className={`${
						compact ? "w-8 h-8" : "w-10 h-10"
					} rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm hover:border-blue-600 hover:text-blue-600 transition-all`}
				>
					<ArrowLeftRight className={`${compact ? "h-3 w-3" : "h-4 w-4"}`} />
				</div>
			</button>

			<div
				className={`${
					dark ? "border-l border-slate-700" : "border-l border-gray-200"
				} flex-1 h-full min-w-0`}
			>
				<CitySelector
					selectedCity={to}
					onSelect={(city) => onToChange?.(city)}
					label="To"
					compact={compact}
					dark={dark}
					side="to"
				/>
			</div>
		</div>
	);
}
