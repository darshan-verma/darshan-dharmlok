"use client";

import { useMemo } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import cn from "classnames";

interface SuvicharBlockViewProps {
	content: unknown;
	className?: string;
	textColor?: string;
	fontSize?: number;
	textAlign?: string;
}

function toInitialContent(content: unknown): PartialBlock[] | undefined {
	if (Array.isArray(content) && content.length > 0) {
		return content as PartialBlock[];
	}
	return undefined;
}

export function SuvicharBlockView({
	content,
	className,
	textColor = "#1a1a1a",
	fontSize = 32,
	textAlign = "center",
}: SuvicharBlockViewProps) {
	const initialContent = useMemo(() => toInitialContent(content), [content]);
	const editor = useCreateBlockNote(
		initialContent ? { initialContent } : {},
	);

	return (
		<div
			className={cn("suvichar-blocknote font-devanagari", className)}
			style={{
				color: textColor,
				fontSize,
				textAlign: textAlign as React.CSSProperties["textAlign"],
			}}
		>
			<BlockNoteView editor={editor} editable={false} theme="light" />
		</div>
	);
}
