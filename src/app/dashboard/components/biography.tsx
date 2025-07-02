"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
	CardDescription,
} from "@/components/ui/card";
import { Save, Pencil } from "lucide-react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import BlockNoteEditor from "@/components/richtext/BlockNoteEditor";
import { useTheme } from "next-themes";

interface BiographyProps {
	userId: string;
	userType: string;
	editable?: boolean;
}

interface UserData {
	id: string;
	name: string;
	category?: string;
	profileImageUrl?: string;
	bio?: string;
}

export default function Biography({ userId, editable = true }: BiographyProps) {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [bioValue, setBioValue] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const editor = useCreateBlockNote();
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		setLoading(true);
		setError(null);
		fetch(`/api/users/${userId}`)
			.then(async (res) => {
				if (!res.ok) throw new Error("Failed to fetch user data");
				return res.json();
			})
			.then((data: UserData) => {
				setUser(data);
				setBioValue(data.bio || "");
			})
			.catch((e: Error) => setError(e.message))
			.finally(() => setLoading(false));
	}, [userId]);

	useEffect(() => {
		if (!isEditing && editor && user?.bio) {
			try {
				const content =
					typeof user.bio === "string" ? JSON.parse(user.bio) : user.bio;
				editor.replaceBlocks(editor.topLevelBlocks, content);
			} catch (e) {
				console.error("Failed to parse and update BlockNote content", e);
			}
		}
	}, [user?.bio, isEditing, editor]);

	const handleEdit = () => setIsEditing(true);

	const handleSave = async () => {
		setIsSaving(true);
		setError(null);
		try {
			const res = await fetch(`/api/users/${userId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bio: bioValue }),
			});
			if (!res.ok) throw new Error("Failed to update bio");
			const updated: UserData = await res.json();
			setUser((prev) => (prev ? { ...prev, bio: updated.bio } : prev));
			setIsEditing(false);
		} catch (e: any) {
			setError(e.message);
		} finally {
			setIsSaving(false);
		}
	};

	if (loading)
		return (
			<div className="flex justify-center items-center h-40">Loading...</div>
		);
	if (error)
		return <div className="text-red-500 text-center mt-8">{error}</div>;
	if (!user) return null;

	return (
		<Card className="max-w-2xl mx-auto mt-8">
			<CardHeader className="flex flex-col items-center gap-2">
				<div className="flex flex-col items-center gap-2">
					<Image
						src={user.profileImageUrl || "/placeholder-avatar.png"}
						alt={user.name}
						width={80}
						height={80}
						className="rounded-full border object-cover"
					/>
					<CardTitle className="text-xl mt-2">{user.name}</CardTitle>
					{user.category && (
						<CardDescription className="text-sm text-muted-foreground">
							{user.category}
						</CardDescription>
					)}
				</div>
				{editable && !isEditing && (
					<Button
						size="sm"
						variant="outline"
						className="mt-2"
						onClick={handleEdit}
					>
						<Pencil className="h-4 w-4 mr-1" /> Edit Bio
					</Button>
				)}
			</CardHeader>
			<CardContent>
				{isEditing ? (
					<BlockNoteEditor
						initialContent={user?.bio || ""}
						onChange={(val: string) => setBioValue(val)}
						editable={isEditing}
					/>
				) : (
					<div className="prose max-w-none mt-2 min-h-[80px]">
						{user.bio ? (
							<BlockNoteView
								editor={editor}
								editable={false}
								className="p-3"
								theme={resolvedTheme === "dark" ? "dark" : "light"}
							/>
						) : (
							<span className="text-muted-foreground italic">
								No biography has been added yet.
							</span>
						)}
					</div>
				)}
			</CardContent>
			{isEditing && (
				<CardFooter className="flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => setIsEditing(false)}
						disabled={isSaving}
					>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={isSaving}>
						{isSaving ? (
							<>
								<Save className="h-4 w-4 mr-2 animate-spin" /> Saving...
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-2" /> Save Bio
							</>
						)}
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
