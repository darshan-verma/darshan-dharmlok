export type RichContent = { text: string; html: string | null };

function sanitizeHtml(html: string): string {
	return html
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
		.replace(/\son\w+="[^"]*"/gi, "")
		.replace(/\son\w+='[^']*'/gi, "")
		.replace(/\s(href|src)=["']javascript:[^"']*["']/gi, ' $1="#"');
}

/** Strip tags / entities and return visible text only. */
export function stripHtmlToText(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\u00a0/g, " ")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function extractTextFromNode(node: unknown): string[] {
	if (!node || typeof node !== "object") return [];
	const obj = node as { text?: unknown; content?: unknown; children?: unknown };
	const out: string[] = [];

	if (typeof obj.text === "string" && obj.text.trim()) {
		out.push(obj.text.trim());
	}

	if (Array.isArray(obj.content)) {
		for (const child of obj.content) {
			out.push(...extractTextFromNode(child));
		}
	}

	if (Array.isArray(obj.children)) {
		for (const child of obj.children) {
			out.push(...extractTextFromNode(child));
		}
	}

	return out;
}

/**
 * Parse BlockNote JSON, HTML, or plain text into displayable rich content.
 * Empty / whitespace-only / empty-tag HTML returns empty content.
 */
export function parseRichContent(content?: string | null): RichContent {
	if (!content) return { text: "", html: null };

	const trimmed = content.trim();
	if (!trimmed || trimmed === "[]" || trimmed === "null") {
		return { text: "", html: null };
	}

	try {
		const parsed = JSON.parse(trimmed) as unknown;
		const blocks = Array.isArray(parsed) ? parsed : [parsed];

		const chunks: string[] = [];
		for (const block of blocks) {
			const blockTexts = extractTextFromNode(block);
			if (blockTexts.length) {
				chunks.push(blockTexts.join(" ").replace(/\s+/g, " ").trim());
			}
		}

		const text = chunks.join("\n\n").trim();
		return { text, html: null };
	} catch {
		const looksLikeHtml = /<\s*\/?\s*[a-z][^>]*>/i.test(trimmed);
		if (looksLikeHtml) {
			const sanitized = sanitizeHtml(trimmed);
			const visible = stripHtmlToText(sanitized);
			if (!visible) return { text: "", html: null };
			return { text: visible, html: sanitized };
		}

		return { text: trimmed, html: null };
	}
}

/** True when there is meaningful text or HTML to render. */
export function hasRichContent(content: RichContent): boolean {
	if (content.text.trim()) return true;
	if (content.html && stripHtmlToText(content.html)) return true;
	return false;
}
