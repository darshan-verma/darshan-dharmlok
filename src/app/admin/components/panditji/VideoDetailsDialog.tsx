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
import { VideoObject } from "./types";

interface VideoDetailsDialogProps {
	video: VideoObject;
	onClose: () => void;
	onTitleChange: (video: VideoObject, title: string) => void;
	onDescriptionChange: (video: VideoObject, description: string) => void;
	onSourceChange: (video: VideoObject, source: string) => void;
	onRemove: (video: VideoObject) => void;
	isEditing: boolean;
}

export default function VideoDetailsDialog({
	video,
	onClose,
	onTitleChange,
	onDescriptionChange,
	onSourceChange,
	onRemove,
	isEditing,
}: VideoDetailsDialogProps) {
	return (
		<Dialog open={true} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Edit Video Details</DialogTitle>
					<DialogDescription>
						Update the title, description, and source for this video.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="relative w-full aspect-video">
						<video
							src={video.url}
							controls
							className="w-full h-full object-contain rounded-md"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="title" className="text-right">
							Title
						</Label>
						<Input
							id="title"
							value={video.title || ""}
							onChange={(e) => onTitleChange(video, e.target.value)}
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
							value={video.description || ""}
							onChange={(e) => onDescriptionChange(video, e.target.value)}
							className="col-span-3"
							disabled={!isEditing}
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="source" className="text-right">
							Source
						</Label>
						<Input
							id="source"
							value={video.source || ""}
							onChange={(e) => onSourceChange(video, e.target.value)}
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
								onRemove(video);
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
