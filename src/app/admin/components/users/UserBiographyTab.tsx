"use client";

import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { User } from "@/types/user";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react"; 


interface BiographyTabProps {
	editedUser: Partial<User> | null;
	isEditing: boolean;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	onSave?: () => void; 
	isSaving?: boolean; 
}

export default function UserBiographyTab({
	isEditing,
	editedUser,
	handleBlockNoteChange,
	onSave,
	isSaving,

}: BiographyTabProps) {
	return (
		<Card>
			<CardContent className="px-1">
				<div className="space-y-1 ">
					{isEditing ? (
						<div className="">
							<BlockNoteEditor
								initialContent={editedUser?.bio || ""}
								onChange={(val: string) => handleBlockNoteChange("bio", val)}
								editable={isEditing}
							/>
						</div>
					) : (
						<div>
							{editedUser?.bio ? (
								<BlockNoteView
									editor={useCreateBlockNote({
										initialContent: JSON.parse(editedUser.bio),
									})}
									editable={false}
									theme="light" 
									className="p-3"
								/>
							) : (
								<p className="text-muted-foreground italic p-3">
									No biography has been added yet.
								</p>
							)}
						</div>
					)}
				</div>
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
