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

/** Resolve display text: prefer block structure (newlines), then stored plainText. */
export function resolveSuvicharPlainText(
	blocknoteJson: unknown,
	plainText?: string,
): string {
	const json =
		typeof blocknoteJson === "string"
			? blocknoteJson
			: JSON.stringify(blocknoteJson ?? []);

	const fromBlocks = extractMultilinePlainText(json);
	if (fromBlocks) return fromBlocks;

	if (plainText?.trim()) return plainText.trim();

	return extractPlainTextFromBlockNote(json, 0);
}
