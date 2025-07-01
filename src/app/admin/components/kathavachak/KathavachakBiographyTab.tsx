"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Kathavachak } from "./types";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect } from "react";

interface BiographyTabProps {
	editedKathavachak: Partial<Kathavachak> | null;
	isEditing: boolean;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	onSave?: () => void; // <-- add this
	isSaving?: boolean; // <-- add this (optional, for loading state)
}

export default function BiographyTab({
	editedKathavachak,
	isEditing,
	handleBlockNoteChange,
	onSave,
	isSaving,
}: BiographyTabProps) {
	const editor = useCreateBlockNote();

	useEffect(() => {
		if (!isEditing && editor && editedKathavachak?.bio) {
			try {
				const content = JSON.parse(editedKathavachak.bio);
				editor.replaceBlocks(editor.topLevelBlocks, content);
			} catch (e) {
				console.error("Failed to parse and update BlockNote content", e);
			}
		}
	}, [editedKathavachak?.bio, isEditing, editor]);

	return (
		<Card>
			<CardContent className="p-4">
				{isEditing ? (
					<BlockNoteEditor
						initialContent={editedKathavachak?.bio || ""}
						onChange={(val: string) => handleBlockNoteChange("bio", val)}
						editable={isEditing}
					/>
				) : (
					<>
						{editedKathavachak?.bio ? (
							<BlockNoteView
								editor={editor}
								editable={false}
								theme="light"
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
					<Button onClick={onSave} disabled={isSaving}>
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
