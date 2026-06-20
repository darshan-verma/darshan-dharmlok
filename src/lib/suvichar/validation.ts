import { getIstDateString } from "@/lib/suvichar/dates";
import { getContrastRatio, meetsWcagAaContrast } from "@/lib/suvichar/contrast";
import { extractMultilinePlainText } from "@/lib/suvichar/text-extraction";
import type { SuvicharFrameDto } from "@/lib/suvichar/types";
import type { TextStyleOverrides } from "@/lib/suvichar/textStyle";

export const CANVAS_SIZE = 1080;
export const MIN_SAFE_AREA = 100;
export const MIN_FONT_SIZE = 12;
export const MAX_FONT_SIZE = 180;
export const MIN_CONTRAST_RATIO = 4.5;
export const MAX_PLAIN_TEXT_LENGTH = 600;
export const MAX_PADDING = 100;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

export interface SafeAreaInput {
	safeAreaX?: number;
	safeAreaY?: number;
	safeAreaWidth: number;
	safeAreaHeight: number;
}

export type FrameValidationInput = Pick<
	SuvicharFrameDto,
	| "safeAreaX"
	| "safeAreaY"
	| "safeAreaWidth"
	| "safeAreaHeight"
	| "defaultTextColor"
	| "defaultFontSize"
	| "width"
	| "height"
>;

export function validateSuvicharFrame(frame: FrameValidationInput): ValidationResult {
	const errors: string[] = [];

	const canvasWidth = frame.width ?? CANVAS_SIZE;
	const canvasHeight = frame.height ?? CANVAS_SIZE;

	if (frame.safeAreaX < 0) {
		errors.push("safeAreaX must be >= 0");
	}
	if (frame.safeAreaY < 0) {
		errors.push("safeAreaY must be >= 0");
	}
	if (frame.safeAreaX + frame.safeAreaWidth > canvasWidth) {
		errors.push(
			`Frame safe area exceeds canvas: safeAreaX(${frame.safeAreaX}) + safeAreaWidth(${frame.safeAreaWidth}) > ${canvasWidth}`,
		);
	}
	if (frame.safeAreaY + frame.safeAreaHeight > canvasHeight) {
		errors.push(
			`Frame safe area exceeds canvas: safeAreaY(${frame.safeAreaY}) + safeAreaHeight(${frame.safeAreaHeight}) > ${canvasHeight}`,
		);
	}
	if (frame.safeAreaWidth < MIN_SAFE_AREA) {
		errors.push(`safeAreaWidth must be >= ${MIN_SAFE_AREA}px`);
	}
	if (frame.safeAreaHeight < MIN_SAFE_AREA) {
		errors.push(`safeAreaHeight must be >= ${MIN_SAFE_AREA}px`);
	}

	const fontSize = frame.defaultFontSize;
	if (fontSize < MIN_FONT_SIZE || fontSize > MAX_FONT_SIZE) {
		errors.push(`defaultFontSize must be between ${MIN_FONT_SIZE}px and ${MAX_FONT_SIZE}px`);
	}

	if (
		frame.defaultTextColor &&
		!meetsWcagAaContrast(frame.defaultTextColor, "#FFFFFF", MIN_CONTRAST_RATIO)
	) {
		errors.push(
			`Text color (${frame.defaultTextColor}) fails WCAG contrast on white background. Use a darker shade.`,
		);
	}

	return { valid: errors.length === 0, errors };
}

export function validateSuvicharText(text: {
	plainText?: string;
	blocknoteJson?: string;
}): ValidationResult {
	const errors: string[] = [];

	if (!text.plainText?.trim()) {
		errors.push("Text cannot be empty");
	}

	if (text.blocknoteJson != null) {
		try {
			JSON.parse(text.blocknoteJson);
		} catch {
			errors.push("BlockNote JSON is invalid");
		}
	}

	const plain = text.plainText?.trim() ?? "";
	if (plain.length > MAX_PLAIN_TEXT_LENGTH) {
		errors.push(
			`Quote exceeds ${MAX_PLAIN_TEXT_LENGTH} characters. Shorten the text before saving.`,
		);
	}

	return { valid: errors.length === 0, errors };
}

export function validateTextStyleOverrides(
	overrides: Partial<TextStyleOverrides> | null | undefined,
): ValidationResult {
	const errors: string[] = [];
	if (overrides == null) {
		return { valid: true, errors };
	}

	if (overrides.fontScale != null && (overrides.fontScale < 0.5 || overrides.fontScale > 1.5)) {
		errors.push("fontScale must be ±50% (0.5–1.5)");
	}

	const paddingKeys = [
		"paddingTop",
		"paddingRight",
		"paddingBottom",
		"paddingLeft",
	] as const;

	for (const key of paddingKeys) {
		const value = overrides[key];
		if (value != null && (value < 0 || value > MAX_PADDING)) {
			errors.push(`${key} must be between 0 and ${MAX_PADDING}px`);
		}
	}

	if (overrides.lineHeight != null && (overrides.lineHeight < 0.8 || overrides.lineHeight > 2)) {
		errors.push("lineHeight must be between 0.8 and 2");
	}

	if (
		overrides.letterSpacing != null &&
		(overrides.letterSpacing < -2 || overrides.letterSpacing > 10)
	) {
		errors.push("letterSpacing must be between -2 and 10");
	}

	if (
		overrides.widthScale != null &&
		(overrides.widthScale < 0.6 || overrides.widthScale > 1)
	) {
		errors.push("widthScale must be between 0.6 and 1");
	}

	if (
		overrides.heightScale != null &&
		(overrides.heightScale < 0.6 || overrides.heightScale > 1)
	) {
		errors.push("heightScale must be between 0.6 and 1");
	}

	if (
		overrides.textColor &&
		!meetsWcagAaContrast(overrides.textColor, "#FFFFFF", MIN_CONTRAST_RATIO)
	) {
		errors.push(
			`Text color (${overrides.textColor}) fails WCAG contrast on white background. Use a darker shade.`,
		);
	}

	return { valid: errors.length === 0, errors };
}

export function validateScheduledDate(scheduledDate: string): ValidationResult {
	const errors: string[] = [];

	if (!DATE_PATTERN.test(scheduledDate)) {
		errors.push(`Invalid schedule date format: ${scheduledDate}`);
		return { valid: false, errors };
	}

	const today = getIstDateString();
	if (scheduledDate < today) {
		errors.push(`Schedule date must be today or in future, got: ${scheduledDate}`);
	}

	return { valid: errors.length === 0, errors };
}

/** @deprecated Use validateSuvicharFrame */
export function validateSafeArea(
	frame: SafeAreaInput,
): { ok: boolean; message?: string } {
	const result = validateSuvicharFrame({
		safeAreaX: frame.safeAreaX ?? 0,
		safeAreaY: frame.safeAreaY ?? 0,
		safeAreaWidth: frame.safeAreaWidth,
		safeAreaHeight: frame.safeAreaHeight,
		defaultTextColor: "#1a1a1a",
		defaultFontSize: 32,
		width: CANVAS_SIZE,
		height: CANVAS_SIZE,
	});
	return {
		ok: result.valid,
		message: result.errors[0],
	};
}

export function validatePlainTextLength(
	plainText: string,
	maxLength = MAX_PLAIN_TEXT_LENGTH,
): { ok: boolean; message?: string } {
	const result = validateSuvicharText({ plainText });
	if (!result.valid) {
		return { ok: false, message: result.errors[0] };
	}
	if (plainText.trim().length > maxLength) {
		return {
			ok: false,
			message: `Quote exceeds ${maxLength} characters. Shorten the text before saving.`,
		};
	}
	return { ok: true };
}

export function validateBlocknoteContent(
	blocknoteJson: string,
): { ok: boolean; plainText: string; message?: string } {
	let plainText = "";
	try {
		plainText = extractMultilinePlainText(blocknoteJson);
	} catch {
		return {
			ok: false,
			plainText: "",
			message: "BlockNote JSON parse failed.",
		};
	}

	const validation = validateSuvicharText({ plainText, blocknoteJson });
	if (!validation.valid) {
		return { ok: false, plainText, message: validation.errors[0] };
	}

	return { ok: true, plainText };
}

export function estimateTextOverflowWarning(
	plainText: string,
	fontSize: number,
	safeArea: SafeAreaInput,
): string | null {
	const charsPerLine = Math.max(
		8,
		Math.floor(safeArea.safeAreaWidth / (fontSize * 0.55)),
	);
	const maxLines = Math.max(
		1,
		Math.floor(safeArea.safeAreaHeight / (fontSize * 1.35)),
	);
	const maxChars = charsPerLine * maxLines;
	if (plainText.length > maxChars) {
		return "Quote may exceed the frame safe area. Preview before scheduling.";
	}
	return null;
}

export { getContrastRatio, meetsWcagAaContrast };
