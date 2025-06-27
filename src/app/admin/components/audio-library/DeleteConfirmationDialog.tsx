import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Song } from "./types";

interface DeleteConfirmationDialogProps {
	isOpen: boolean;
	songToDelete: Song | null;
	onClose: () => void;
	onConfirm: () => void;
}

export function DeleteConfirmationDialog({
	isOpen,
	songToDelete,
	onClose,
	onConfirm,
}: DeleteConfirmationDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Confirm Deletion</DialogTitle>
				</DialogHeader>
				<div className="py-4">
					<p>
						Are you sure you want to delete {songToDelete?.name}? This action
						cannot be undone.
					</p>
				</div>
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						Delete
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
