import {
	extractPlainTextFromBlockNote,
	getBlockText,
	type BlockNoteBlock,
} from "@/lib/blog-content";

/** Preserve line breaks between BlockNote blocks for multiline card layout. */
export function extractMultilinePlainText(content: string): string {
	try {
		const blocks: BlockNoteBlock[] = JSON.parse(content);
		if (!Array.isArray(blocks)) return "";

		return blocks
			.map((block) => getBlockText(block))
			.filter((line) => line.trim())
			.join("\n")
			.trim();
	} catch {
		return content.trim();
	}
}

export interface ResolvePlainTextResult {
	text: string;
	usedFallback: boolean;
	parseError: boolean;
}

/** Resolve display text: prefer block structure (newlines), then stored plainText. */
export function resolveSuvicharPlainText(
	blocknoteJson: unknown,
	plainText?: string,
): string {
	return resolveSuvicharPlainTextDetailed(blocknoteJson, plainText).text;
}

export function resolveSuvicharPlainTextDetailed(
	blocknoteJson: unknown,
	plainText?: string,
): ResolvePlainTextResult {
	try {
		const json =
			typeof blocknoteJson === "string"
				? blocknoteJson
				: JSON.stringify(blocknoteJson ?? []);

		let parseError = false;
		let fromBlocks = "";

		try {
			fromBlocks = extractMultilinePlainText(json);
		} catch {
			parseError = true;
		}

		if (fromBlocks) {
			return { text: fromBlocks, usedFallback: false, parseError: false };
		}

		if (plainText?.trim()) {
			return {
				text: plainText.trim(),
				usedFallback: parseError,
				parseError,
			};
		}

		const fallback = extractPlainTextFromBlockNote(json, 0);
		return {
			text: fallback,
			usedFallback: true,
			parseError,
		};
	} catch {
		const fallback = plainText?.trim() ?? "";
		return { text: fallback, usedFallback: true, parseError: true };
	}
}
