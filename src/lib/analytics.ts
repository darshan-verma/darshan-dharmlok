/** Thin analytics wrapper — wire to GTM/GA4 when available. */
export function trackReligiousFilterApplied(
	page: string,
	tradition: string
): void {
	if (typeof window === "undefined") return;
	const payload = { page, tradition, event: "religious_filter_applied" };
	if (typeof window.gtag === "function") {
		window.gtag("event", "religious_filter_applied", {
			page_path: page,
			tradition,
		});
	}
	if (process.env.NODE_ENV === "development") {
		console.debug("[analytics]", payload);
	}
}

export function trackReligiousFilterCleared(page: string): void {
	if (typeof window === "undefined") return;
	const payload = { page, event: "religious_filter_cleared" };
	if (typeof window.gtag === "function") {
		window.gtag("event", "religious_filter_cleared", { page_path: page });
	}
	if (process.env.NODE_ENV === "development") {
		console.debug("[analytics]", payload);
	}
}

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}
