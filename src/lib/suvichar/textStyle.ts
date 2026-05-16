export type SuvicharTextAlign = "left" | "center" | "right";
export type SuvicharVerticalAlign = "top" | "middle" | "bottom";
export type SuvicharFontWeight =
	| "normal"
	| "medium"
	| "semibold"
	| "bold"
	| "extrabold";

export interface TextStyleOverrides {
	fontScale: number;
	paddingTop: number;
	paddingRight: number;
	paddingBottom: number;
	paddingLeft: number;
	textAlign: SuvicharTextAlign;
	verticalAlign: SuvicharVerticalAlign;
	lineHeight: number;
	letterSpacing: number;
	fontWeight: SuvicharFontWeight;
	textColor?: string | null;
	widthScale: number;
	heightScale: number;
}

export interface FrameTextDefaults {
	defaultTextColor: string;
	defaultTextAlign: string;
}

export const FONT_WEIGHT_CSS: Record<SuvicharFontWeight, number> = {
	normal: 400,
	medium: 500,
	semibold: 600,
	bold: 700,
	extrabold: 800,
};

export const DEFAULT_TEXT_STYLE_OVERRIDES: TextStyleOverrides = {
	fontScale: 1,
	paddingTop: 0,
	paddingRight: 0,
	paddingBottom: 0,
	paddingLeft: 0,
	textAlign: "center",
	verticalAlign: "middle",
	lineHeight: 1.2,
	letterSpacing: 0,
	fontWeight: "normal",
	textColor: null,
	widthScale: 1,
	heightScale: 1,
};

function clamp(n: number, min: number, max: number) {
	return Math.min(max, Math.max(min, n));
}

function parseAlign(value: unknown, fallback: SuvicharTextAlign): SuvicharTextAlign {
	if (value === "left" || value === "center" || value === "right") return value;
	return fallback;
}

function parseVerticalAlign(
	value: unknown,
	fallback: SuvicharVerticalAlign,
): SuvicharVerticalAlign {
	if (value === "top" || value === "middle" || value === "bottom") return value;
	return fallback;
}

function parseFontWeight(
	value: unknown,
	fallback: SuvicharFontWeight,
): SuvicharFontWeight {
	const allowed: SuvicharFontWeight[] = [
		"normal",
		"medium",
		"semibold",
		"bold",
		"extrabold",
	];
	if (typeof value === "string" && allowed.includes(value as SuvicharFontWeight)) {
		return value as SuvicharFontWeight;
	}
	return fallback;
}

export function parseTextStyleOverrides(
	raw: unknown,
	frame?: FrameTextDefaults,
): TextStyleOverrides | null {
	if (raw == null) return null;
	if (typeof raw !== "object") return null;

	const o = raw as Record<string, unknown>;
	const frameAlign = parseAlign(frame?.defaultTextAlign, "center");

	return {
		fontScale: clamp(Number(o.fontScale ?? 1), 0.5, 1.5),
		paddingTop: clamp(Number(o.paddingTop ?? 0), 0, 200),
		paddingRight: clamp(Number(o.paddingRight ?? 0), 0, 200),
		paddingBottom: clamp(Number(o.paddingBottom ?? 0), 0, 200),
		paddingLeft: clamp(Number(o.paddingLeft ?? 0), 0, 200),
		textAlign: parseAlign(o.textAlign, frameAlign),
		verticalAlign: parseVerticalAlign(o.verticalAlign, "middle"),
		lineHeight: clamp(Number(o.lineHeight ?? 1.2), 0.8, 2),
		letterSpacing: clamp(Number(o.letterSpacing ?? 0), -2, 10),
		fontWeight: parseFontWeight(o.fontWeight, "normal"),
		textColor:
			typeof o.textColor === "string" && o.textColor.trim()
				? o.textColor.trim()
				: null,
		widthScale: clamp(Number(o.widthScale ?? 1), 0.6, 1),
		heightScale: clamp(Number(o.heightScale ?? 1), 0.6, 1),
	};
}

export function mergeTextStyleOverrides(
	frame: FrameTextDefaults,
	overrides?: Partial<TextStyleOverrides> | TextStyleOverrides | null,
): TextStyleOverrides {
	const frameAlign = parseAlign(frame.defaultTextAlign, "center");
	const base: TextStyleOverrides = {
		...DEFAULT_TEXT_STYLE_OVERRIDES,
		textAlign: frameAlign,
		textColor: frame.defaultTextColor,
	};

	if (!overrides) return base;

	return {
		...base,
		...overrides,
		textColor:
			overrides.textColor != null && overrides.textColor !== ""
				? overrides.textColor
				: frame.defaultTextColor,
		textAlign: overrides.textAlign ?? frameAlign,
	};
}

export function getFrameDefaultTextStyle(
	frame: FrameTextDefaults,
): TextStyleOverrides {
	return mergeTextStyleOverrides(frame, null);
}

export function isDefaultTextStyle(
	resolved: TextStyleOverrides,
	frame: FrameTextDefaults,
): boolean {
	const defaults = getFrameDefaultTextStyle(frame);
	return JSON.stringify(resolved) === JSON.stringify(defaults);
}

/** Stored in DB — omit frame-default color when unchanged */
export function serializeTextStyleForDb(
	overrides: TextStyleOverrides,
	frame: FrameTextDefaults,
): TextStyleOverrides | null {
	if (isDefaultTextStyle(overrides, frame)) return null;
	return overrides;
}

export function computeTextBoxLayout(
	safeWidth: number,
	safeHeight: number,
	style: TextStyleOverrides,
) {
	const boxWidth = Math.max(1, Math.floor(safeWidth * style.widthScale));
	const boxHeight = Math.max(1, Math.floor(safeHeight * style.heightScale));
	const contentWidth = Math.max(
		1,
		boxWidth - style.paddingLeft - style.paddingRight,
	);
	const contentHeight = Math.max(
		1,
		boxHeight - style.paddingTop - style.paddingBottom,
	);

	return { boxWidth, boxHeight, contentWidth, contentHeight };
}

export const verticalAlignToFlex = {
	top: "flex-start",
	middle: "center",
	bottom: "flex-end",
} as const;
