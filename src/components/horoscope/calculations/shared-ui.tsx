"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { HoroscopeApiResultDisplay } from "@/components/horoscope/calculations/HoroscopeApiResultDisplay";
import { cn } from "@/lib/utils";

const svgResultClassName =
	"overflow-auto rounded-lg border border-orange-200/80 bg-white p-4 shadow-sm dark:border-orange-900/50 dark:bg-card [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full [&_svg]:overflow-visible";
const HOROSCOPE_CLIENT_CACHE_PREFIX = "horoscope-client-cache:v1";
const HOROSCOPE_CLIENT_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

type CachedValueEnvelope<T> = {
	expiresAt: number;
	value: T;
};

function readCachedValue<T>(cacheKey: string): T | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(
			`${HOROSCOPE_CLIENT_CACHE_PREFIX}:${cacheKey}`,
		);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CachedValueEnvelope<T>;
		if (!parsed || typeof parsed.expiresAt !== "number") return null;
		if (Date.now() >= parsed.expiresAt) {
			window.localStorage.removeItem(
				`${HOROSCOPE_CLIENT_CACHE_PREFIX}:${cacheKey}`,
			);
			return null;
		}
		return parsed.value;
	} catch {
		return null;
	}
}

function writeCachedValue<T>(cacheKey: string, value: T): void {
	if (typeof window === "undefined") return;
	try {
		const payload: CachedValueEnvelope<T> = {
			expiresAt: Date.now() + HOROSCOPE_CLIENT_CACHE_TTL_MS,
			value,
		};
		window.localStorage.setItem(
			`${HOROSCOPE_CLIENT_CACHE_PREFIX}:${cacheKey}`,
			JSON.stringify(payload),
		);
	} catch {
		// Ignore storage write failures (private mode / quota).
	}
}

function clearCachedValue(cacheKey: string): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(
			`${HOROSCOPE_CLIENT_CACHE_PREFIX}:${cacheKey}`,
		);
	} catch {
		// Ignore storage remove failures.
	}
}

export function useHoroscopeCachedValue<T>(
	cacheKey: string,
): {
	value: T | null;
	setValue: (next: T | null) => void;
	clearValue: () => void;
} {
	const [value, setInternalValue] = useState<T | null>(null);

	useEffect(() => {
		setInternalValue(readCachedValue<T>(cacheKey));
	}, [cacheKey]);

	const setValue = (next: T | null) => {
		setInternalValue(next);
		// Keep last successful result in cache until explicitly cleared.
		if (next !== null) {
			writeCachedValue(cacheKey, next);
		}
	};

	const clearValue = () => {
		setInternalValue(null);
		clearCachedValue(cacheKey);
	};

	return { value, setValue, clearValue };
}

function normalizeProkeralaSvg(svg: string): string {
	const svgTagMatch = svg.match(/<svg\b[^>]*>/i);
	if (!svgTagMatch) return svg;

	let normalized = svg;
	const svgTag = svgTagMatch[0];
	let nextTag = svgTag;

	if (!/preserveAspectRatio=/i.test(nextTag)) {
		nextTag = nextTag.replace(
			/^<svg\b/i,
			'<svg preserveAspectRatio="xMidYMid meet"',
		);
	}

	if (!/style=/i.test(nextTag)) {
		nextTag = nextTag.replace(/^<svg\b/i, '<svg style="overflow: visible;"');
	} else {
		nextTag = nextTag.replace(
			/style=(['"])(.*?)\1/i,
			(_match, quote, styleValue: string) => {
				const trimmedStyle = styleValue.trim();
				if (/overflow\s*:/i.test(trimmedStyle)) {
					return `style=${quote}${trimmedStyle}${quote}`;
				}
				const suffix =
					trimmedStyle.endsWith(";") || trimmedStyle.length === 0 ? "" : ";";
				return `style=${quote}${trimmedStyle}${suffix} overflow: visible;${quote}`;
			},
		);
	}

	const viewBoxMatch = nextTag.match(/viewBox=(['"])([^'"]+)\1/i);
	if (viewBoxMatch) {
		const values = viewBoxMatch[2]
			.trim()
			.split(/\s+/)
			.map((value) => Number(value));
		if (
			values.length === 4 &&
			values.every((value) => Number.isFinite(value))
		) {
			const [minX, minY, width, height] = values;
			const bottomPadding = Math.max(height * 0.12, 48);
			nextTag = nextTag.replace(
				/viewBox=(['"])[^'"]+\1/i,
				`viewBox="${minX} ${minY} ${width} ${height + bottomPadding}"`,
			);
		}
	}

	if (nextTag !== svgTag) {
		normalized = normalized.replace(svgTag, nextTag);
	}

	return normalized;
}

export async function geocodePlace(
	place: string,
): Promise<
	{ ok: true; lat: number; lng: number } | { ok: false; message: string }
> {
	const res = await fetch(`/api/geocode?q=${encodeURIComponent(place.trim())}`);
	const json = (await res.json()) as {
		error?: string;
		lat?: number;
		lng?: number;
	};
	if (!res.ok) {
		return {
			ok: false,
			message: json.error ?? `Could not find that place (${res.status})`,
		};
	}
	if (json.lat == null || json.lng == null) {
		return {
			ok: false,
			message: "Could not resolve coordinates for that location.",
		};
	}
	return { ok: true, lat: json.lat, lng: json.lng };
}

export async function fetchProkeralaJson(
	url: string,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
	const res = await fetch(url);
	const text = await res.text();
	let json: unknown;
	try {
		json = JSON.parse(text) as unknown;
	} catch {
		return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
	}
	if (!res.ok) {
		const err = json as { error?: string; details?: string };
		const msg =
			[err.error, err.details].filter(Boolean).join(": ") ||
			`HTTP ${res.status}`;
		return { ok: false, error: msg };
	}
	if (
		json &&
		typeof json === "object" &&
		(json as { ok?: boolean }).ok === false
	) {
		const err = json as { error?: string; details?: string };
		return {
			ok: false,
			error:
				[err.error, err.details].filter(Boolean).join(": ") || "Request failed",
		};
	}
	return { ok: true, data: json };
}

export async function fetchProkeralaSvg(
	url: string,
): Promise<{ ok: true; svg: string } | { ok: false; error: string }> {
	const res = await fetch(url);
	const text = await res.text();
	if (!res.ok) {
		try {
			const j = JSON.parse(text) as { error?: string; details?: string };
			return {
				ok: false,
				error:
					[j.error, j.details].filter(Boolean).join(": ") ||
					`HTTP ${res.status}`,
			};
		} catch {
			return { ok: false, error: text.slice(0, 300) || `HTTP ${res.status}` };
		}
	}
	if (!text.trim().startsWith("<")) {
		return { ok: false, error: "Expected SVG response" };
	}
	return { ok: true, svg: normalizeProkeralaSvg(text) };
}

/** Matches Daily Panchang submit: min width, orange-500, right-aligned row. */
export function HoroscopeSubmitButton({
	loading,
	onRefresh,
	refreshDisabled = false,
}: {
	loading: boolean;
	onRefresh?: () => void;
	refreshDisabled?: boolean;
}) {
	return (
		<div className="flex flex-wrap justify-end gap-3 pt-2">
			{onRefresh ? (
				<Button
					type="button"
					variant="outline"
					onClick={onRefresh}
					disabled={loading || refreshDisabled}
					className="min-w-[140px]"
				>
					Refresh form
				</Button>
			) : null}
			<Button
				type="submit"
				disabled={loading}
				className="min-w-[140px] bg-orange-500 font-semibold text-white shadow-sm hover:bg-orange-600"
			>
				{loading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Loading…
					</>
				) : (
					"Get result"
				)}
			</Button>
		</div>
	);
}

export function CalculationShell({
	title,
	children,
	className,
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("mx-auto w-full max-w-6xl", className)}>
			<div className="overflow-hidden rounded-xl border border-orange-200/90 bg-white shadow-md dark:border-orange-900/45 dark:bg-card">
				<div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-4 py-4 text-center">
					<h2 className="text-xl font-light tracking-wide text-white md:text-2xl">
						{title}
					</h2>
				</div>
				{children}
			</div>
		</div>
	);
}

export function HoroscopeJsonResult({
	data,
	error,
	loading,
}: {
	data: unknown;
	error: string | null;
	loading: boolean;
}) {
	if (loading) {
		return null;
	}
	if (error) {
		return (
			<div className="border-t border-destructive/20 bg-destructive/5 px-6 py-4 md:px-8">
				<p className="text-sm text-destructive">{error}</p>
			</div>
		);
	}
	if (data == null) {
		return null;
	}
	return (
		<div className="border-t border-orange-100 px-6 py-8 dark:border-orange-900/45 md:px-8">
			<h3 className="mb-4 font-medium text-foreground">Result</h3>
			<HoroscopeApiResultDisplay data={data} />
		</div>
	);
}

export function HoroscopeSvgResult({
	svg,
	error,
	loading,
	title = "Chart",
	className,
}: {
	svg: string | null;
	error: string | null;
	loading: boolean;
	/** Section heading below the border (matches Daily Panchang &quot;Result&quot;). */
	title?: string;
	className?: string;
}) {
	if (loading) {
		return null;
	}
	if (error) {
		return (
			<div className="border-t border-destructive/20 bg-destructive/5 px-6 py-4 md:px-8">
				<p className="text-sm text-destructive">{error}</p>
			</div>
		);
	}
	if (!svg) {
		return null;
	}
	return (
		<div className="border-t border-orange-100 px-6 py-8 dark:border-orange-900/45 md:px-8">
			<h3 className="mb-4 font-medium text-foreground">{title}</h3>
			<div
				className={cn(svgResultClassName, className)}
				dangerouslySetInnerHTML={{ __html: svg }}
			/>
		</div>
	);
}

/** Renders SVG from a URL (e.g. chart API) after fetch. */
export function HoroscopeSvgFromUrl({
	url,
	enabled,
}: {
	url: string | null;
	enabled: boolean;
}) {
	const [svg, setSvg] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!enabled || !url) {
			setSvg(null);
			setError(null);
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError(null);
		setSvg(null);
		fetchProkeralaSvg(url).then((r) => {
			if (cancelled) return;
			setLoading(false);
			if (r.ok) setSvg(r.svg);
			else setError(r.error);
		});
		return () => {
			cancelled = true;
		};
	}, [url, enabled]);

	return <HoroscopeSvgResult svg={svg} error={error} loading={loading} />;
}
