/** WCAG 2.x relative luminance for sRGB hex colors (#RGB or #RRGGBB). */
function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
	const normalized = hex.trim();
	const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(normalized);
	if (!match) return null;

	let value = match[1];
	if (value.length === 3) {
		value = value
			.split("")
			.map((c) => c + c)
			.join("");
	}

	const r = parseInt(value.slice(0, 2), 16);
	const g = parseInt(value.slice(2, 4), 16);
	const b = parseInt(value.slice(4, 6), 16);
	return { r, g, b };
}

function channelToLinear(channel: number): number {
	const s = channel / 255;
	return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number | null {
	const rgb = parseHexColor(hex);
	if (!rgb) return null;

	const r = channelToLinear(rgb.r);
	const g = channelToLinear(rgb.g);
	const b = channelToLinear(rgb.b);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colors (1:1 to 21:1). */
export function getContrastRatio(colorA: string, colorB: string): number {
	const lumA = relativeLuminance(colorA);
	const lumB = relativeLuminance(colorB);
	if (lumA == null || lumB == null) return 1;

	const lighter = Math.max(lumA, lumB);
	const darker = Math.min(lumA, lumB);
	return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWcagAaContrast(
	foreground: string,
	background: string,
	minRatio = 4.5,
): boolean {
	return getContrastRatio(foreground, background) >= minRatio;
}
