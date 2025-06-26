"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Seller } from "./types";

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
	safeBlockNoteHtml,
	onSave,
	isSaving,
}: BiographyTabProps) {
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
						{editedSeller?.bio && safeBlockNoteHtml(editedSeller?.bio) ? (
							<div
								className="prose prose-sm max-w-none text-foreground"
								dangerouslySetInnerHTML={{
									__html: safeBlockNoteHtml(editedSeller?.bio),
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
