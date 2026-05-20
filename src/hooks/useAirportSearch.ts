"use client";

import { useEffect, useRef, useState } from "react";
import type { AirportSearchResult } from "@/lib/reference-data-client";

export function useAirportSearch(query: string, enabled: boolean) {
	const [results, setResults] = useState<AirportSearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);

		if (!enabled || query.trim().length < 2) {
			setResults([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		debounceRef.current = setTimeout(async () => {
			try {
				const res = await fetch(
					`/api/airports?q=${encodeURIComponent(query.trim())}`,
				);
				if (res.ok) {
					setResults((await res.json()) as AirportSearchResult[]);
				} else {
					setResults([]);
				}
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 200);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, enabled]);

	return { results, loading };
}
