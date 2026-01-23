"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Kathavachak } from "./types";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { PartialBlock } from "@blocknote/core";
import { useMemo } from "react";

interface BiographyTabProps {
	editedKathavachak: Partial<Kathavachak> | null;
	isEditing: boolean;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	onSave?: () => void;
	isSaving?: boolean;
}

// Helper function to safely parse BlockNote content
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

// Viewer component that recreates when bio changes
function BioViewer({ bio, id: _id }: { bio: string; id?: string }) {
	const bioContent = useMemo(() => {
		return safeParseBlockNoteContent(bio);
	}, [bio]);

	const editor = useCreateBlockNote({
		initialContent: bioContent,
	});

	return (
		<BlockNoteView
			editor={editor}
			editable={false}
			theme="light"
			className="p-3"
		/>
	);
}

export default function BiographyTab({
	editedKathavachak,
	isEditing,
	handleBlockNoteChange,
	onSave,
	isSaving,
}: BiographyTabProps) {
	// Create a unique key that changes when bio changes to force component recreation
	const bioKey = useMemo(() => {
		const bioString = editedKathavachak?.bio || "";
		const bioHash = bioString.length > 0 ? `${bioString.length}-${bioString.substring(0, 10)}` : "empty";
		return `${editedKathavachak?.id || "unknown"}-${bioHash}`;
	}, [editedKathavachak?.id, editedKathavachak?.bio]);

	return (
		<Card>
			<CardContent className="p-4">
				{isEditing ? (
					<BlockNoteEditor
						key={`bio-editor-${bioKey}`}
						initialContent={editedKathavachak?.bio || ""}
						onChange={(val: string) => handleBlockNoteChange("bio", val)}
						editable={true}
					/>
				) : (
					<>
						{editedKathavachak?.bio ? (
							<div key={`bio-viewer-wrapper-${bioKey}`}>
								<BioViewer 
									key={`bio-viewer-${bioKey}`}
									bio={editedKathavachak.bio} 
									id={editedKathavachak.id}
								/>
							</div>
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
