"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FrameSafeAreaEditor } from "@/components/suvichar/FrameSafeAreaEditor";
import type { SuvicharFrameDto } from "@/lib/suvichar/types";

export default function SuvicharFramesPage() {
	const [frames, setFrames] = useState<SuvicharFrameDto[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [editing, setEditing] = useState<SuvicharFrameDto | null>(null);
	const [form, setForm] = useState({
		name: "",
		safeAreaX: 120,
		safeAreaY: 220,
		safeAreaWidth: 840,
		safeAreaHeight: 560,
		defaultTextColor: "#1a1a1a",
		defaultFontSize: 32,
		defaultTextAlign: "center",
		status: "active",
	});

	const loadFrames = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/suvichar/frames");
			if (!res.ok) throw new Error("Failed");
			const data = (await res.json()) as { content: SuvicharFrameDto[] };
			setFrames(data.content);
		} catch {
			toast.error("Failed to load frames");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void loadFrames();
	}, [loadFrames]);

	const handleUpload = async (file: File) => {
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const uploadRes = await fetch("/api/upload/image", {
				method: "POST",
				body: fd,
			});
			const uploadJson = await uploadRes.json();
			if (!uploadRes.ok) {
				throw new Error(uploadJson.error || "Upload failed");
			}

			const name = file.name.replace(/\.[^.]+$/, "") || "New Frame";
			const createRes = await fetch("/api/suvichar/frames", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					imageUrl: uploadJson.imageUrl,
					thumbnailUrl: uploadJson.imageUrl,
				}),
			});
			const created = await createRes.json();
			if (!createRes.ok) {
				throw new Error(created.error || "Failed to save frame");
			}
			toast.success("Frame uploaded");
			await loadFrames();
			openEditor(created as SuvicharFrameDto);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	};

	const openEditor = (frame: SuvicharFrameDto) => {
		setEditing(frame);
		setForm({
			name: frame.name,
			safeAreaX: frame.safeAreaX,
			safeAreaY: frame.safeAreaY,
			safeAreaWidth: frame.safeAreaWidth,
			safeAreaHeight: frame.safeAreaHeight,
			defaultTextColor: frame.defaultTextColor,
			defaultFontSize: frame.defaultFontSize,
			defaultTextAlign: frame.defaultTextAlign,
			status: frame.status,
		});
	};

	const saveFrame = async () => {
		if (!editing) return;
		try {
			const res = await fetch(`/api/suvichar/frames/${editing.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Save failed");
			toast.success("Frame updated");
			setEditing(null);
			await loadFrames();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Save failed");
		}
	};

	const deleteFrame = async (id: string) => {
		if (!confirm("Delete this frame?")) return;
		try {
			const res = await fetch(`/api/suvichar/frames/${id}`, { method: "DELETE" });
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Delete failed");
			toast.success("Frame deleted");
			await loadFrames();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Delete failed");
		}
	};

	if (loading) {
		return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-3">
				<Label
					htmlFor="frame-upload"
					className="cursor-pointer rounded-lg border border-dashed px-4 py-2 text-sm hover:bg-muted"
				>
					{uploading ? "Uploading…" : "+ Upload frame image"}
				</Label>
				<input
					id="frame-upload"
					type="file"
					accept="image/*"
					className="hidden"
					disabled={uploading}
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) void handleUpload(file);
						e.target.value = "";
					}}
				/>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{frames.map((frame) => (
					<div
						key={frame.id}
						className="overflow-hidden rounded-xl border bg-card shadow-sm"
					>
						<div className="relative aspect-square bg-muted">
							<Image
								src={frame.thumbnailUrl || frame.imageUrl}
								alt={frame.name}
								fill
								className="object-cover"
								unoptimized
							/>
						</div>
						<div className="space-y-2 p-3">
							<p className="font-medium truncate">{frame.name}</p>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									variant="outline"
									className="flex-1"
									onClick={() => openEditor(frame)}
								>
									Edit safe area
								</Button>
								<Button
									type="button"
									size="sm"
									variant="destructive"
									onClick={() => void deleteFrame(frame.id)}
								>
									Delete
								</Button>
							</div>
						</div>
					</div>
				))}
			</div>

			<Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Edit frame — {editing?.name}</DialogTitle>
					</DialogHeader>
					{editing && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Name</Label>
								<Input
									value={form.name}
									onChange={(e) =>
										setForm((f) => ({ ...f, name: e.target.value }))
									}
								/>
							</div>
							<FrameSafeAreaEditor
								imageUrl={editing.imageUrl}
								width={editing.width}
								height={editing.height}
								values={{
									safeAreaX: form.safeAreaX,
									safeAreaY: form.safeAreaY,
									safeAreaWidth: form.safeAreaWidth,
									safeAreaHeight: form.safeAreaHeight,
								}}
								onChange={(v) => setForm((f) => ({ ...f, ...v }))}
							/>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label>Text color</Label>
									<Input
										type="color"
										value={form.defaultTextColor}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												defaultTextColor: e.target.value,
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label>Font size</Label>
									<Input
										type="number"
										min={12}
										max={72}
										value={form.defaultFontSize}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												defaultFontSize: Number(e.target.value),
											}))
										}
									/>
								</div>
							</div>
							<Button
								type="button"
								className="w-full bg-orange-500 hover:bg-orange-600"
								onClick={() => void saveFrame()}
							>
								Save frame
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
