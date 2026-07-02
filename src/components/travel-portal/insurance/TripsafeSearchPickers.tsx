"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useAirportSearch } from "@/hooks/useAirportSearch";
import type { AirportSearchResult } from "@/lib/reference-data-client";

type CountryOption = { code: string; name: string };

let countriesPromise: Promise<CountryOption[]> | null = null;

/** Load the ISO alpha-2 country list once and reuse it across pickers. */
function loadCountries(): Promise<CountryOption[]> {
	if (!countriesPromise) {
		countriesPromise = fetch("/api/countries")
			.then((r) => (r.ok ? (r.json() as Promise<CountryOption[]>) : []))
			.catch(() => []);
	}
	return countriesPromise;
}

/**
 * Searchable country picker that stores the ISO alpha-2 code (e.g. `IN`)
 * while showing the readable name — TripJack `rt: "COUNTRY"` requires the code.
 */
export function CountryCombobox({
	value,
	onChange,
}: {
	value: string;
	onChange: (code: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [countries, setCountries] = useState<CountryOption[]>([]);

	useEffect(() => {
		let active = true;
		loadCountries().then((list) => {
			if (active) setCountries(list);
		});
		return () => {
			active = false;
		};
	}, []);

	const selected = useMemo(
		() => countries.find((c) => c.code === value.toUpperCase()),
		[countries, value],
	);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return countries.slice(0, 60);
		return countries
			.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					c.code.toLowerCase().includes(q),
			)
			.slice(0, 60);
	}, [countries, query]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="w-44 h-9 rounded-md border border-input bg-transparent px-3 text-sm flex items-center justify-between gap-2"
				>
					<span className={selected ? "" : "text-muted-foreground"}>
						{selected
							? `${selected.name} (${selected.code})`
							: value
								? value.toUpperCase()
								: "Select country"}
					</span>
					<ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-0" align="start">
				<div className="p-2 border-b">
					<div className="relative">
						<Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							autoFocus
							type="text"
							placeholder="Search country or ISO code…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="w-full pl-8 pr-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
						/>
					</div>
				</div>
				<div className="max-h-60 overflow-y-auto">
					{filtered.length === 0 ? (
						<div className="px-3 py-6 text-center text-sm text-gray-500">
							No countries found
						</div>
					) : (
						filtered.map((c) => (
							<button
								key={c.code}
								type="button"
								onClick={() => {
									onChange(c.code);
									setOpen(false);
									setQuery("");
								}}
								className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between gap-2"
							>
								<span>
									{c.name}{" "}
									<span className="text-gray-400">({c.code})</span>
								</span>
								{c.code === value.toUpperCase() && (
									<Check className="w-4 h-4 text-orange-600" />
								)}
							</button>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}

/**
 * Airport picker backed by `/api/airports`; stores a valid IATA code so the
 * embedded flight search never receives an unmapped/free-text value.
 */
export function AirportCombobox({
	value,
	onChange,
	placeholder = "City or airport",
}: {
	value: string;
	onChange: (code: string) => void;
	placeholder?: string;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [label, setLabel] = useState("");
	const { results, loading } = useAirportSearch(query, open);
	const lastCode = useRef("");

	useEffect(() => {
		const code = value.trim().toUpperCase();
		if (!code || code === lastCode.current) return;
		lastCode.current = code;
		let active = true;
		fetch(`/api/airports?q=${encodeURIComponent(code)}`)
			.then((r) => (r.ok ? (r.json() as Promise<AirportSearchResult[]>) : []))
			.then((list) => {
				const hit = list.find((a) => a.code === code);
				if (active) setLabel(hit ? `${hit.city} (${hit.code})` : code);
			})
			.catch(() => {
				if (active) setLabel(code);
			});
		return () => {
			active = false;
		};
	}, [value]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm flex items-center justify-between gap-2"
				>
					<span className={value ? "" : "text-muted-foreground"}>
						{value ? label || value.toUpperCase() : placeholder}
					</span>
					<ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-72 p-0" align="start">
				<div className="p-2 border-b">
					<div className="relative">
						<Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							autoFocus
							type="text"
							placeholder="Search city or airport…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="w-full pl-8 pr-8 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
						/>
						{loading && (
							<Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
						)}
					</div>
				</div>
				<div className="max-h-60 overflow-y-auto">
					{query.trim().length < 2 ? (
						<div className="px-3 py-6 text-center text-sm text-gray-500">
							Type at least 2 characters
						</div>
					) : results.length === 0 && !loading ? (
						<div className="px-3 py-6 text-center text-sm text-gray-500">
							No airports found
						</div>
					) : (
						results.map((a) => (
							<button
								key={a.code}
								type="button"
								onClick={() => {
									onChange(a.code);
									setLabel(`${a.city} (${a.code})`);
									lastCode.current = a.code;
									setOpen(false);
									setQuery("");
								}}
								className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between gap-2"
							>
								<span>
									<span className="font-medium">
										{a.city} ({a.code})
									</span>
									<span className="block text-xs text-gray-500">
										{a.name}
									</span>
								</span>
								{a.code === value.toUpperCase() && (
									<Check className="w-4 h-4 text-orange-600 shrink-0" />
								)}
							</button>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
