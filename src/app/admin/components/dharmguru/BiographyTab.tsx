"use client";

import { Card, CardContent } from "@/components/ui/card";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Dharmguru } from "./types";
interface BiographyTabProps {
	editedDharmguru: Partial<Dharmguru> | null;
	isEditing: boolean;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	safeBlockNoteHtml: (jsonString?: string) => string;
}

export default function BiographyTab({
	editedDharmguru,
	isEditing,
	handleBlockNoteChange,
	safeBlockNoteHtml,
}: BiographyTabProps) {
	return (
		<Card>
			<CardContent className="p-4">
				{isEditing ? (
					<BlockNoteEditor
						initialContent={editedDharmguru?.bio || ""}
						onChange={(val: string) => handleBlockNoteChange("bio", val)}
						editable={isEditing}
					/>
				) : (
					<>
						{editedDharmguru?.bio && safeBlockNoteHtml(editedDharmguru?.bio) ? (
							<div
								className="prose prose-sm max-w-none text-foreground"
								dangerouslySetInnerHTML={{
									__html: safeBlockNoteHtml(editedDharmguru?.bio),
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
