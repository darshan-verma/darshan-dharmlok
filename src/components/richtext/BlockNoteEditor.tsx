"use client";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";

interface BlockNoteEditorProps {
	onChange: (value: string) => void;
	initialContent?: string;
	editable?: boolean;
}

export interface BlockNoteEditorHandle {
	getContent: () => string;
	flush: () => void;
}

const DEBOUNCE_MS = 150;

// Prevent hydration mismatch by only rendering BlockNoteView on client
const BlockNoteEditorComponent = forwardRef<
	BlockNoteEditorHandle,
	BlockNoteEditorProps
>(function BlockNoteEditorComponent(
	{ onChange, initialContent, editable = true },
	ref
) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// SSR-safe parse
	function safeParseBlockNoteContent(
		content?: string
	): PartialBlock[] | undefined {
		if (!content) return undefined;
		try {
			const parsed = JSON.parse(content);
			if (!Array.isArray(parsed) || parsed.length === 0) {
				return undefined;
			}
			return parsed;
		} catch {
			return undefined;
		}
	}

	const editor: BlockNoteEditor = useCreateBlockNote({
		initialContent: safeParseBlockNoteContent(initialContent),
		// No uploadFile handler
	});

	const flushToParent = useCallback(() => {
		if (onChange && editor.document) {
			onChange(JSON.stringify(editor.document));
		}
	}, [editor, onChange]);

	const uploadToDatabase = useCallback(() => {
		if (!onChange) return;
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			debounceRef.current = null;
			flushToParent();
		}, DEBOUNCE_MS);
	}, [onChange, flushToParent]);

	useImperativeHandle(
		ref,
		() => ({
			getContent: () =>
				editor?.document ? JSON.stringify(editor.document) : "",
			flush: () => {
				if (debounceRef.current) {
					clearTimeout(debounceRef.current);
					debounceRef.current = null;
				}
				flushToParent();
			},
		}),
		[editor, flushToParent]
	);

	useEffect(
		() => () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		},
		[]
	);

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
});

export default BlockNoteEditorComponent;
