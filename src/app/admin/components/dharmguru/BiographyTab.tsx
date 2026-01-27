"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import BlockNoteEditor, {
	type BlockNoteEditorHandle,
} from "@/components/richtext/BlockNoteEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Dharmguru } from "./types";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect, useRef } from "react";

interface BiographyTabProps {
	editedDharmguru: Partial<Dharmguru> | null;
	isEditing: boolean;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	safeBlockNoteHtml: (jsonString?: string) => string;
	onSave?: (content?: string) => void;
	isSaving?: boolean;
}

export default function BiographyTab({
	editedDharmguru,
	isEditing,
	handleBlockNoteChange,
	onSave,
	isSaving,
}: BiographyTabProps) {
	const editor = useCreateBlockNote();
	const blockNoteRef = useRef<BlockNoteEditorHandle | null>(null);

	useEffect(() => {
		if (!isEditing && editor && editedDharmguru?.bio) {
			try {
				const content = JSON.parse(editedDharmguru.bio);

				editor.replaceBlocks(editor.topLevelBlocks, content);
			} catch (e) {
				console.error("Failed to parse and update BlockNote content", e);
			}
		}
	}, [editedDharmguru?.bio, isEditing, editor]);

	const handleSaveClick = () => {
		if (!onSave) return;
		blockNoteRef.current?.flush();
		const content =
			blockNoteRef.current?.getContent() ?? editedDharmguru?.bio ?? "";
		onSave(content);
	};

	return (
		<Card>
			<CardContent className="p-4">
				{isEditing ? (
					<BlockNoteEditor
						ref={blockNoteRef}
						initialContent={editedDharmguru?.bio || ""}
						onChange={(val: string) => handleBlockNoteChange("bio", val)}
						editable={isEditing}
					/>
				) : (
					<>
						{editedDharmguru?.bio ? (
							<BlockNoteView
								editor={editor}
								editable={false}
								theme="light" // or use `resolvedTheme` if you want to support dark mode
								className="p-3"
							/>
						) : (
							<p className="text-muted-foreground italic p-3">
								No biography has been added yet.
							</p>
						)}
					</>
				)}
			</CardContent>
			{isEditing && onSave && (
				<CardFooter>
					<Button onClick={handleSaveClick} disabled={isSaving}>
						{isSaving ? (
							<>
								<Save className="h-4 w-4 mr-2 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-2" />
								Save Biography
							</>
						)}
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
