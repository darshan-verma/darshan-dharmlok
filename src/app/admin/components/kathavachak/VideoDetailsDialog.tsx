"use client";

import React, { useState, useRef } from "react";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

	const titleRef = useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		if (isOpen) {
			setTitle("");
			setDescription("");
			// Focus on title input after dialog opens
			setTimeout(() => {
				titleRef.current?.focus();
			}, 100);
		}
	}, [isOpen]);

	const handleConfirm = () => {
		onConfirm(title, description);
		setTitle("");
		setDescription("");
	};

	const handleCancel = () => {
		onClose();
		setTitle("");
		setDescription("");
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add Video Details</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Video preview with overlay to show it's a preview */}
					<div className="relative h-48 w-full overflow-hidden rounded-md bg-gray-50">
						<div className="absolute inset-0 flex items-center justify-center">
							<p className="text-xs text-gray-400">Preview</p>
						</div>
						<video
							src={videoUrl}
							controls
							className="object-contain z-10 w-full h-full"
						/>
					</div>

					{/* Title field */}
					<div>
						<label className="text-sm font-medium text-gray-700 mb-1 block">
							Title <span className="text-gray-400 text-xs">(optional)</span>
						</label>
						<input
							ref={titleRef}
							type="text"
							placeholder="Add a title..."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full text-sm p-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary"
						/>
					</div>

					{/* Description field */}
					<div>
						<label className="text-sm font-medium text-gray-700 mb-1 block">
							Description{" "}
							<span className="text-gray-400 text-xs">(optional)</span>
						</label>
						<textarea
							placeholder="Add a description..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full text-sm p-2 border rounded focus:ring-1 focus:ring-primary focus:border-primary resize-none"
							rows={3}
						/>
					</div>
				</div>

				<DialogFooter className="sm:justify-between">
					<Button type="button" variant="outline" onClick={handleCancel}>
						Skip
					</Button>
					<Button type="button" onClick={handleConfirm}>
						Save Details
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
