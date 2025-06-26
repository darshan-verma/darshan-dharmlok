"use client";

import { Card, CardContent } from "@/components/ui/card";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Kathavachak } from "./types";

interface BiographyTabProps {
	editedKathavachak: Partial<Kathavachak> | null;
	isEditing: boolean;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	safeBlockNoteHtml: (jsonString?: string) => string;
}

export default function BiographyTab({
	editedKathavachak,
	isEditing,
	handleBlockNoteChange,
	safeBlockNoteHtml,
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
						{editedKathavachak?.bio &&
						safeBlockNoteHtml(editedKathavachak?.bio) ? (
							<div
								className="prose prose-sm max-w-none text-foreground"
								dangerouslySetInnerHTML={{
									__html: safeBlockNoteHtml(editedKathavachak?.bio),
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
