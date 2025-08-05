"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageObject } from "./types";
import Image from "next/image";

interface ImageDetailsDialogProps {
	image: ImageObject;
	onClose: () => void;
	onTitleChange: (image: ImageObject, title: string) => void;
	onDescriptionChange: (image: ImageObject, description: string) => void;
	onRemove: (image: ImageObject) => void;
	isEditing: boolean;
}

export default function ImageDetailsDialog({
	image,
	onClose,
	onTitleChange,
	onDescriptionChange,
	onRemove,
	isEditing,
}: ImageDetailsDialogProps) {
	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Edit Image Details</DialogTitle>
					<DialogDescription>
						Update the title and description for this image.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="relative w-full aspect-video">
						<Image
							src={image.url}
							alt={image.title || "Image"}
							className="w-full h-full object-contain rounded-md"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="title" className="text-right">
							Title
						</Label>
						<Input
							id="title"
							value={image.title || ""}
							onChange={(e) => onTitleChange(image, e.target.value)}
							className="col-span-3"
							disabled={!isEditing}
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="description" className="text-right">
							Description
						</Label>
						<Textarea
							id="description"
							value={image.description || ""}
							onChange={(e) => onDescriptionChange(image, e.target.value)}
							className="col-span-3"
							disabled={!isEditing}
						/>
					</div>
				</div>
				<DialogFooter>
					{isEditing && (
						<Button
							variant="destructive"
							onClick={() => {
								onRemove(image);
								onClose();
							}}
						>
							Remove
						</Button>
					)}
					<Button onClick={onClose}>Done</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
