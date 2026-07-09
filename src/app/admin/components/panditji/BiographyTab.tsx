"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Panditji } from "./types";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useEffect } from "react";
import LocaleTabs from "@/components/admin/LocaleTabs";
import type { ContentLang } from "@/lib/content-lang";
import { switchContentLocale } from "@/lib/admin-locale-sync";

interface BiographyTabProps {
	editedPanditji: Partial<Panditji> | null;
	isEditing: boolean;
	handleBlockNoteChange: (field: "bio", val: string) => void;
	safeBlockNoteHtml: (jsonString?: string) => string;
	onSave?: () => void;
	isSaving?: boolean;
	editedPanditjiRecord: Partial<Panditji> | null;
	setEditedPanditji: React.Dispatch<
		React.SetStateAction<Partial<Panditji> | null>
	>;
	contentLocale: ContentLang;
	onContentLocaleChange: (locale: ContentLang) => void;
}

export default function BiographyTab({
	editedPanditji,
	isEditing,
	handleBlockNoteChange,
	onSave,
	isSaving,
	editedPanditjiRecord,
	setEditedPanditji,
	contentLocale,
	onContentLocaleChange,
}: BiographyTabProps) {
	const editor = useCreateBlockNote();

	const handleLocaleChange = (locale: ContentLang) => {
		setEditedPanditji((prev) =>
			prev
				? (switchContentLocale(
						prev as unknown as Record<string, unknown>,
						"panditji",
						contentLocale,
						locale,
						["bio"]
					) as unknown as Partial<Panditji>)
				: prev
		);
		onContentLocaleChange(locale);
	};

	useEffect(() => {
		if (!isEditing && editor && editedPanditji?.bio) {
			try {
				const content = JSON.parse(editedPanditji.bio);
				editor.replaceBlocks(editor.topLevelBlocks, content);
			} catch (e) {
				console.error("Failed to parse and update BlockNote content", e);
			}
		}
	}, [editedPanditji?.bio, isEditing, editor]);

	return (
		<Card>
			{isEditing && (
				<div className="px-4 pt-4">
					<LocaleTabs
						activeLocale={contentLocale}
						onLocaleChange={handleLocaleChange}
					/>
				</div>
			)}
			<CardContent className="p-4">
				{isEditing ? (
					<BlockNoteEditor
						key={`bio-${contentLocale}-${editedPanditjiRecord?.id ?? "new"}`}
						initialContent={editedPanditji?.bio || ""}
						onChange={(val: string) => handleBlockNoteChange("bio", val)}
						editable={isEditing}
					/>
				) : (
					<>
						{editedPanditji?.bio ? (
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
