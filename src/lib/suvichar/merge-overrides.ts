import type {
	FrameTextDefaults,
	SuvicharTextAlign,
	TextStyleOverrides,
} from "./textStyle";

const DEFAULT_TEXT_STYLE_OVERRIDES: TextStyleOverrides = {
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

function parseAlign(value: unknown, fallback: SuvicharTextAlign): SuvicharTextAlign {
	if (value === "left" || value === "center" || value === "right") return value;
	return fallback;
}

/** Merge frame defaults with schedule overrides; explicit override wins. */
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
