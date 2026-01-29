/**
 * Utilities for blog content stored as BlockNote/TipTap-style JSON.
 * Content is an array of blocks: { type, content: [{ type: "text", text, styles }], props?, ... }
 */

export interface BlockNoteTextItem {
	text: string;
	styles?: Record<string, unknown>;
	[key: string]: unknown;
}

export interface BlockNoteBlock {
	type: string;
	content?: BlockNoteTextItem[];
	props?: { level?: number; textAlignment?: string; [key: string]: unknown };
	[key: string]: unknown;
}

/**
 * Extract plain text from BlockNote JSON for preview/listing.
 * @param content - JSON string of blocks
 * @param maxLength - max characters (default 150); no ellipsis if 0 or undefined and full text is returned
 */
export function extractPlainTextFromBlockNote(
	content: string,
	maxLength: number = 150
): string {
	try {
		const blocks: BlockNoteBlock[] = JSON.parse(content);
		if (!Array.isArray(blocks)) return "";

		const text = blocks
			.map((block: BlockNoteBlock) => {
				if (!block.content || !Array.isArray(block.content)) return "";
				return block.content
					.map((item: BlockNoteTextItem) => item.text || "")
					.join("");
			})
			.filter((t: string) => t.trim())
			.join(" ")
			.trim();

		if (maxLength <= 0) return text;
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength).trim() + "...";
	} catch {
		if (maxLength <= 0) return content;
		return content.substring(0, maxLength).trim() + "...";
	}
}

/**
 * Get text from a single block's content array.
 */
export function getBlockText(block: BlockNoteBlock): string {
	if (!block.content || !Array.isArray(block.content)) return "";
	return block.content
		.map((item: BlockNoteTextItem) => item.text || "")
		.join("");
}

/**
 * Parse blog content JSON into blocks for rendering.
 */
export function parseBlogContent(content: string): BlockNoteBlock[] {
	try {
		const blocks: BlockNoteBlock[] = JSON.parse(content);
		return Array.isArray(blocks) ? blocks : [];
	} catch {
		return [];
	}
}
