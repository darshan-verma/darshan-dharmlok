"use client";

import { useEffect, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { TripjackLocationDto, TripjackPlace } from "@/types/tripjack";

export interface CabSearchLocation extends TripjackLocationDto {
	placeId: string;
}

interface CabLocationInputProps {
	label: string;
	placeholder: string;
	value: CabSearchLocation | null;
	onChange: (value: CabSearchLocation | null) => void;
	disabled?: boolean;
}

interface PlacesApiResponse {
	success: boolean;
	data?: {
		places?: TripjackPlace[];
	};
	error?: string;
}

interface LatLongApiResponse {
	success: boolean;
	data?: {
		location?: {
			lat: number;
			lng: number;
		};
		address?: {
			city?: string;
			country?: string;
			postalCode?: string;
		};
	};
	error?: string;
}

export default function CabLocationInput({
	label,
	placeholder,
	value,
	onChange,
	disabled = false,
}: CabLocationInputProps) {
	const [query, setQuery] = useState(value?.displayAddress ?? "");
	const [results, setResults] = useState<TripjackPlace[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isResolving, setIsResolving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isFocused, setIsFocused] = useState(false);

	useEffect(() => {
		setQuery(value?.displayAddress ?? "");
	}, [value?.displayAddress]);

	useEffect(() => {
		const trimmedQuery = query.trim();

		if (trimmedQuery.length < 2 || disabled) {
			setResults([]);
			setIsSearching(false);
			return;
		}

		const controller = new AbortController();
		const timer = window.setTimeout(async () => {
			setIsSearching(true);
			setError(null);

			try {
				const response = await fetch("/api/travel/cabs/google-places", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ input: trimmedQuery }),
					signal: controller.signal,
				});

				const payload = (await response.json()) as PlacesApiResponse;

				if (!response.ok || !payload.success) {
					throw new Error(
						payload.error || "Unable to load location suggestions",
					);
				}

				setResults(payload.data?.places ?? []);
			} catch (searchError) {
				if (
					searchError instanceof DOMException &&
					searchError.name === "AbortError"
				) {
					return;
				}

				setResults([]);
				setError(
					searchError instanceof Error
						? searchError.message
						: "Unable to load location suggestions",
				);
			} finally {
				setIsSearching(false);
			}
		}, 250);

		return () => {
			controller.abort();
			window.clearTimeout(timer);
		};
	}, [disabled, query]);

	async function handleSelect(place: TripjackPlace) {
		setIsResolving(true);
		setError(null);

		try {
			const response = await fetch("/api/travel/cabs/get-lat-long", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ placeId: place.id }),
			});

			const payload = (await response.json()) as LatLongApiResponse;

			if (!response.ok || !payload.success || !payload.data?.location) {
				throw new Error(payload.error || "Unable to resolve location details");
			}

			const nextValue: CabSearchLocation = {
				placeId: place.id,
				type: "location",
				displayAddress: place.displayLabel,
				lat: String(payload.data.location.lat),
				long: String(payload.data.location.lng),
				address: {
					city: payload.data.address?.city,
					country: payload.data.address?.country,
					postalCode: payload.data.address?.postalCode,
				},
			};

			setQuery(place.displayLabel);
			setResults([]);
			onChange(nextValue);
		} catch (resolveError) {
			setError(
				resolveError instanceof Error
					? resolveError.message
					: "Unable to resolve location details",
			);
		} finally {
			setIsResolving(false);
		}
	}

	return (
		<div className="space-y-2">
			<label className="text-sm font-medium text-gray-700">{label}</label>
			<div className="relative">
				<div className="relative">
					<MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
					<Input
						value={query}
						disabled={disabled || isResolving}
						onFocus={() => setIsFocused(true)}
						onBlur={() => {
							window.setTimeout(() => setIsFocused(false), 150);
						}}
						onChange={(event) => {
							const nextQuery = event.target.value;
							setQuery(nextQuery);
							setError(null);

							if (!nextQuery.trim()) {
								onChange(null);
							}

							if (
								value &&
								nextQuery.trim() &&
								nextQuery !== value.displayAddress
							) {
								onChange(null);
							}
						}}
						placeholder={placeholder}
						className="h-12 rounded-xl border-gray-200 bg-white pl-10 pr-10"
					/>
					{(isSearching || isResolving) && (
						<Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
					)}
				</div>

				{isFocused && (results.length > 0 || isSearching || error) && (
					<div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
						{isSearching ? (
							<div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
								<Loader2 className="h-4 w-4 animate-spin" />
								Searching locations...
							</div>
						) : error ? (
							<div className="px-4 py-3 text-sm text-red-600">{error}</div>
						) : (
							<div className="max-h-64 overflow-y-auto py-2">
								{results.map((place) => (
									<button
										key={place.id}
										type="button"
										onMouseDown={(event) => {
											event.preventDefault();
											void handleSelect(place);
										}}
										className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-amber-50"
									>
										<MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
										<div>
											<div className="text-sm font-medium text-gray-900">
												{place.displayLabel}
											</div>
											<div className="text-xs text-gray-500">{place.name}</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				)}
			</div>

			{value?.address?.city && (
				<p className="text-xs text-gray-500">
					{value.address.city}
					{value.address.country ? `, ${value.address.country}` : ""}
				</p>
			)}
		</div>
	);
}
