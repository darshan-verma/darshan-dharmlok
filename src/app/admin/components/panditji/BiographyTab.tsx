"use client";
import { Card, CardContent } from "@/components/ui/card";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Panditji } from "./types";

interface BiographyTabProps {
	editedPanditji: Partial<Panditji> | null;
	isEditing: boolean;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	safeBlockNoteHtml: (jsonString?: string) => string;
}

export default function BiographyTab({
	editedPanditji,
	isEditing,
	handleBlockNoteChange,
	safeBlockNoteHtml,
}: BiographyTabProps) {
	return (
		<Card>
			<CardContent className="p-4">
				{isEditing ? (
					<BlockNoteEditor
						initialContent={editedPanditji?.bio || ""}
						onChange={(val: string) => handleBlockNoteChange("bio", val)}
						editable={isEditing}
					/>
				) : (
					<>
						{editedPanditji?.bio && safeBlockNoteHtml(editedPanditji?.bio) ? (
							<div
								className="prose prose-sm max-w-none text-foreground"
								dangerouslySetInnerHTML={{
									__html: safeBlockNoteHtml(editedPanditji?.bio),
								}}
							/>
						) : (
							<p className="text-muted-foreground italic">
								No biography has been added yet.
							</p>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
