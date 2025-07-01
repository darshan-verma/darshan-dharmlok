"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Kathavachak } from "./types";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";

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
								editor={useCreateBlockNote({
									initialContent: JSON.parse(editedKathavachak.bio),
								})}
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
