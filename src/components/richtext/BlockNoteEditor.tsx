"use client";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

interface BlockNoteEditorProps {
	onChange: (value: string) => void;
	initialContent?: string;
	editable?: boolean;
}

// Prevent hydration mismatch by only rendering BlockNoteView on client
const BlockNoteEditorComponent = ({
	onChange,
	initialContent,
	editable = true,
}: BlockNoteEditorProps) => {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// SSR-safe parse
	function safeParseBlockNoteContent(
		content?: string
	): PartialBlock[] | undefined {
		if (!content) return undefined;
		try {
			const parsed = JSON.parse(content);
			return Array.isArray(parsed) ? parsed : undefined;
		} catch {
			return undefined;
		}
	}

	const editor: BlockNoteEditor = useCreateBlockNote({
		initialContent: safeParseBlockNoteContent(initialContent),
		// No uploadFile handler
	});

	const uploadToDatabase = useCallback(() => {
		if (onChange) {
			setTimeout(() => {
				onChange(JSON.stringify(editor.document));
			}, 1000);
		}
	}, [editor, onChange]);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		// Avoid rendering anything until after hydration
		return null;
	}

	return (
		<BlockNoteView
			editor={editor}
			editable={editable}
			onChange={uploadToDatabase}
			theme={resolvedTheme === "dark" ? "dark" : "light"}
		/>
	);
};

export default BlockNoteEditorComponent;
