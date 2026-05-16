import { extractMultilinePlainText } from "@/lib/suvichar/plainText";

const MAX_PLAIN_TEXT_LENGTH = 600;

export interface SafeAreaInput {
	safeAreaWidth: number;
	safeAreaHeight: number;
}

export function validatePlainTextLength(
	plainText: string,
	maxLength = MAX_PLAIN_TEXT_LENGTH,
): { ok: boolean; message?: string } {
	const trimmed = plainText.trim();
	if (!trimmed) {
		return { ok: false, message: "Quote text cannot be empty." };
	}
	if (trimmed.length > maxLength) {
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
	const plainText = extractMultilinePlainText(blocknoteJson);
	const check = validatePlainTextLength(plainText);
	if (!check.ok) {
		return { ok: false, plainText, message: check.message };
	}
	return { ok: true, plainText };
}

export function validateSafeArea(
	frame: SafeAreaInput,
): { ok: boolean; message?: string } {
	if (frame.safeAreaWidth <= 0 || frame.safeAreaHeight <= 0) {
		return {
			ok: false,
			message: "Frame safe area width and height must be greater than zero.",
		};
	}
	return { ok: true };
}

export function estimateTextOverflowWarning(
	plainText: string,
	fontSize: number,
	safeArea: SafeAreaInput,
): string | null {
	const charsPerLine = Math.max(8, Math.floor(safeArea.safeAreaWidth / (fontSize * 0.55)));
	const maxLines = Math.max(1, Math.floor(safeArea.safeAreaHeight / (fontSize * 1.35)));
	const maxChars = charsPerLine * maxLines;
	if (plainText.length > maxChars) {
		return "Quote may exceed the frame safe area. Preview before scheduling.";
	}
	return null;
}
