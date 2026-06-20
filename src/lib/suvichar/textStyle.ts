import { mergeTextStyleOverrides } from "./merge-overrides";

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

function parsePartialTextStyleOverrides(
	raw: Record<string, unknown>,
	frame?: FrameTextDefaults,
): Partial<TextStyleOverrides> {
	const frameAlign = parseAlign(frame?.defaultTextAlign, "center");
	const partial: Partial<TextStyleOverrides> = {};

	if (oHas(raw, "fontScale")) {
		partial.fontScale = clamp(Number(raw.fontScale), 0.5, 1.5);
	}
	if (oHas(raw, "paddingTop")) {
		partial.paddingTop = clamp(Number(raw.paddingTop), 0, 100);
	}
	if (oHas(raw, "paddingRight")) {
		partial.paddingRight = clamp(Number(raw.paddingRight), 0, 100);
	}
	if (oHas(raw, "paddingBottom")) {
		partial.paddingBottom = clamp(Number(raw.paddingBottom), 0, 100);
	}
	if (oHas(raw, "paddingLeft")) {
		partial.paddingLeft = clamp(Number(raw.paddingLeft), 0, 100);
	}
	if (oHas(raw, "textAlign")) {
		partial.textAlign = parseAlign(raw.textAlign, frameAlign);
	}
	if (oHas(raw, "verticalAlign")) {
		partial.verticalAlign = parseVerticalAlign(raw.verticalAlign, "middle");
	}
	if (oHas(raw, "lineHeight")) {
		partial.lineHeight = clamp(Number(raw.lineHeight), 0.8, 2);
	}
	if (oHas(raw, "letterSpacing")) {
		partial.letterSpacing = clamp(Number(raw.letterSpacing), -2, 10);
	}
	if (oHas(raw, "fontWeight")) {
		partial.fontWeight = parseFontWeight(raw.fontWeight, "normal");
	}
	if (oHas(raw, "textColor")) {
		partial.textColor =
			typeof raw.textColor === "string" && raw.textColor.trim()
				? raw.textColor.trim()
				: null;
	}
	if (oHas(raw, "widthScale")) {
		partial.widthScale = clamp(Number(raw.widthScale), 0.6, 1);
	}
	if (oHas(raw, "heightScale")) {
		partial.heightScale = clamp(Number(raw.heightScale), 0.6, 1);
	}

	return partial;
}

function oHas(o: Record<string, unknown>, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(o, key);
}

export function parseTextStyleOverrides(
	raw: unknown,
	frame?: FrameTextDefaults,
): TextStyleOverrides | null {
	if (raw == null) return null;
	if (typeof raw !== "object") return null;

	const defaults = frame
		? getFrameDefaultTextStyle(frame)
		: { ...DEFAULT_TEXT_STYLE_OVERRIDES };

	const partial = parsePartialTextStyleOverrides(
		raw as Record<string, unknown>,
		frame,
	);

	return mergeTextStyleOverrides(frame ?? {
		defaultTextColor: defaults.textColor ?? "#1a1a1a",
		defaultTextAlign: defaults.textAlign,
	}, partial);
}

export { mergeTextStyleOverrides };

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

/** Stored in DB — only keys that differ from frame defaults (delta, not full object). */
export function serializeTextStyleForDb(
	resolvedStyle: TextStyleOverrides,
	frameDefaults: FrameTextDefaults,
): Record<string, unknown> | null {
	const stored: Record<string, unknown> = {};
	const defaults = getFrameDefaultTextStyle(frameDefaults);

	let hasOverrides = false;
	for (const [key, value] of Object.entries(resolvedStyle)) {
		const defaultValue = defaults[key as keyof TextStyleOverrides];
		if (JSON.stringify(value) !== JSON.stringify(defaultValue)) {
			stored[key] = value;
			hasOverrides = true;
		}
	}

	return hasOverrides ? stored : null;
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
