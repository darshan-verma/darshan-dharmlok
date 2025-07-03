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
		<div className="flex justify-center w-full min-h-[calc(100vh-120px)] bg-muted/30 py-8">
			<Card className="w-full max-w-2xl shadow-lg border-0 bg-white dark:bg-zinc-900 relative flex flex-col">
				{editable && !isEditing && (
					<Button
						size="sm"
						variant="outline"
						className="absolute top-5 right-5 px-4 py-1 rounded-full border-primary/40 hover:border-primary z-10"
						onClick={handleEdit}
					>
						<Pencil className="h-4 w-4 mr-1" /> Edit Bio
					</Button>
				)}
				<CardHeader className="flex flex-row items-center gap-6 pb-0 pt-6 px-6">
					<div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30 shadow-md bg-white dark:bg-zinc-800 flex items-center justify-center">
						<Image
							src={user.profileImageUrl || "/placeholder-avatar.png"}
							alt={user.name}
							width={96}
							height={96}
							className="object-cover w-full h-full"
						/>
					</div>
					<div className="flex flex-col justify-center flex-1 gap-1">
						<CardTitle className="text-2xl font-bold text-left">
							{user.name}
						</CardTitle>
						{user.category && (
							<CardDescription className="text-base text-muted-foreground text-left">
								{user.category}
							</CardDescription>
						)}
					</div>
				</CardHeader>
				<CardContent className="pt-2 pb-6 px-6">
					{isEditing ? (
						<BlockNoteEditor
							initialContent={user?.bio || ""}
							onChange={(val: string) => setBioValue(val)}
							editable={isEditing}
						/>
					) : (
						<div className="prose prose-lg max-w-none min-h-[60px] text-zinc-800 dark:text-zinc-100">
							{user.bio ? (
								<BlockNoteView
									editor={editor}
									editable={false}
									className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm w-full"
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
					<CardFooter className="flex justify-end gap-3 px-6 pb-6">
						<Button
							variant="outline"
							onClick={() => setIsEditing(false)}
							disabled={isSaving}
							className="rounded-full px-6"
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							disabled={isSaving}
							className="rounded-full px-6"
						>
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
		</div>
	);
}
