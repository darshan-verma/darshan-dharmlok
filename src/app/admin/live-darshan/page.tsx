"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import LiveDarshanForm, {
	LiveDarshanFormData,
} from "@/app/admin/components/live-darshan/LiveDarshanForm";
import LiveDarshanTable, {
	LiveDarshanItem,
} from "@/app/admin/components/live-darshan/LiveDarshanTable";

export default function LiveDarshanAdminPage() {
	const { data: session } = useSession();
	const [streams, setStreams] = useState<LiveDarshanItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [currentStream, setCurrentStream] = useState<LiveDarshanItem | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [deleteStream, setDeleteStream] = useState<LiveDarshanItem | null>(
		null,
	);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const fetchStreams = async () => {
		setLoading(true);
		try {
			const response = await fetch("/api/live-darshan", { cache: "no-store" });
			if (!response.ok) throw new Error("Failed to load live darshan entries");
			const data = await response.json();
			setStreams(Array.isArray(data.content) ? data.content : []);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to fetch live darshan entries",
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStreams();
	}, []);

	const openForm = (stream?: LiveDarshanItem | null) => {
		setCurrentStream(stream ?? null);
		setIsFormOpen(true);
	};

	const handleFormSubmit = async (formData: LiveDarshanFormData) => {
		if (!session?.user?.id && !currentStream) {
			toast.error("You must be signed in to add a new live darshan entry.");
			return;
		}

		setIsSubmitting(true);
		try {
			const payload = {
				...formData,
				status: formData.status || "Active",
			} as Record<string, unknown>;

			if (!currentStream) {
				const userId = session?.user?.id;
				if (!userId) {
					throw new Error(
						"You must be signed in to add a new live darshan entry.",
					);
				}
				payload.userId = userId;
			}

			const response = await fetch(
				currentStream
					? `/api/live-darshan/${currentStream.id}`
					: "/api/live-darshan",
				{
					method: currentStream ? "PUT" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(
					errorData?.error ||
						errorData?.message ||
						"Failed to save live darshan entry",
				);
			}

			const savedStream = await response.json();
			setStreams((current) => {
				if (currentStream) {
					return current.map((item) =>
						item.id === currentStream.id ? savedStream : item,
					);
				}
				return [savedStream, ...current];
			});
			toast.success(
				currentStream
					? "Live darshan stream updated."
					: "Live darshan stream added.",
			);
			setIsFormOpen(false);
			setCurrentStream(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save entry",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteStream) return;
		try {
			const response = await fetch(`/api/live-darshan/${deleteStream.id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error("Failed to delete stream");
			setStreams((current) =>
				current.filter((item) => item.id !== deleteStream.id),
			);
			toast.success("Live darshan stream deleted.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete stream",
			);
		} finally {
			setIsDeleteOpen(false);
			setDeleteStream(null);
		}
	};

	return (
		<div className="container mx-auto py-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold">Live Darshan Management</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Add and manage YouTube live darshan streams for the frontend page.
					</p>
				</div>
				<Button onClick={() => openForm(null)} disabled={loading}>
					Add Live Darshan
				</Button>
			</div>

			<div className="mt-6">
				<LiveDarshanTable
					streams={streams}
					loading={loading}
					onAdd={() => openForm(null)}
					onEdit={(stream) => openForm(stream)}
					onDelete={(stream) => {
						setDeleteStream(stream);
						setIsDeleteOpen(true);
					}}
				/>
			</div>

			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="sm:max-w-[620px]">
					<DialogHeader>
						<DialogTitle>
							{currentStream ? "Edit Live Darshan" : "Add Live Darshan"}
						</DialogTitle>
					</DialogHeader>
					<LiveDarshanForm
						initialData={
							currentStream
								? {
										...currentStream,
										thumbnailUrl: currentStream.thumbnailUrl ?? undefined,
									}
								: undefined
						}
						onSubmit={handleFormSubmit}
						onCancel={() => {
							setIsFormOpen(false);
							setCurrentStream(null);
						}}
						isLoading={isSubmitting}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
				<DialogContent className="sm:max-w-[440px]">
					<DialogHeader>
						<DialogTitle>Delete Live Darshan Stream</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<p>Are you sure you want to delete this live darshan stream?</p>
						<p className="text-sm text-muted-foreground">
							{deleteStream?.title}
						</p>
					</div>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Delete
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
