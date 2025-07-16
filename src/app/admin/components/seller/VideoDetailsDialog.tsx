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
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface VideoDetailsDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (title: string, description: string) => void;
	videoUrl: string;
}

export default function VideoDetailsDialog({
	isOpen,
	onClose,
	onConfirm,
	videoUrl,
}: VideoDetailsDialogProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	useEffect(() => {
		if (isOpen) {
			setTitle("");
			setDescription("");
		}
	}, [isOpen]);

	const handleConfirm = () => {
		onConfirm(title, description);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Video Details</DialogTitle>
					<DialogDescription>
						Add a title and description for your video.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					{videoUrl && (
						<div className="w-full rounded-md overflow-hidden">
							<video src={videoUrl} controls className="w-full" />
						</div>
					)}
					<div className="grid grid-cols-4 items-center gap-4">
						<label htmlFor="title" className="text-right">
							Title
						</label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="col-span-3"
							placeholder="e.g., 'My Awesome Video'"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<label htmlFor="description" className="text-right">
							Description
						</label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="col-span-3"
							placeholder="e.g., 'A short clip of something interesting.'"
						/>
					</div>
				</div>
				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="button" onClick={handleConfirm}>
						Confirm & Upload
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
