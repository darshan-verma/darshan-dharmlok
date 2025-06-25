"use client";

import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Card, CardContent } from "@/components/ui/card";

export default function UserBiographyTab({
	isEditing,
	editedUser,
	handleBlockNoteChange,
	safeBlockNoteHtml,
}: any) {
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
							{editedUser?.bio && safeBlockNoteHtml(editedUser?.bio) ? (
								<div
									className="prose prose-sm max-w-none text-foreground p-3"
									dangerouslySetInnerHTML={{
										__html: safeBlockNoteHtml(editedUser?.bio),
									}}
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
		</Card>
	);
}
