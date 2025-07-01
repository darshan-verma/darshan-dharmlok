"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Seller } from "./types";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect } from "react";

interface BiographyTabProps {
	editedSeller: Partial<Seller> | null;
	isEditing: boolean;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	safeBlockNoteHtml: (jsonString?: string) => string;
	onSave?: () => void;
	isSaving?: boolean;
}

export default function BiographyTab({
	editedSeller,
	isEditing,
	handleBlockNoteChange,
	onSave,
	isSaving,
}: BiographyTabProps) {
	const editor = useCreateBlockNote();

	useEffect(() => {
		if (!isEditing && editor && editedSeller?.bio) {
			try {
				const content = JSON.parse(editedSeller.bio);
				editor.replaceBlocks(editor.topLevelBlocks, content);
			} catch (e) {
				console.error("Failed to parse and update BlockNote content", e);
			}
		}
	}, [editedSeller?.bio, isEditing, editor]);

	return (
		<Card>
			<CardContent className="p-4">
				{isEditing ? (
					<BlockNoteEditor
						initialContent={editedSeller?.bio || ""}
						onChange={(val: string) => handleBlockNoteChange("bio", val)}
						editable={isEditing}
					/>
				) : (
					<>
						{editedSeller?.bio ? (
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
