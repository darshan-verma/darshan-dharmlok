/** Calendar date in Asia/Kolkata as YYYY-MM-DD */
export function getIstDateString(date: Date = new Date()): string {
	return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function parseBlocknoteJson(raw: string): unknown {
	try {
		return JSON.parse(raw) as unknown;
	} catch {
		return [];
	}
}

export function slugifyTitle(title: string): string {
	return title
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}
