"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

interface MediaItem {
	url: string;
	type: "image" | "video";
}

export function PostComposer() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [caption, setCaption] = useState("");
	const [media, setMedia] = useState<MediaItem[]>([]);
	const [uploading, setUploading] = useState(false);
	const [publishing, setPublishing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleFile = useCallback(
		async (file: File, type: "image" | "video") => {
			if (!session?.user) return;
			setUploading(true);
			setError(null);
			try {
				const form = new FormData();
				form.append("file", file);
				form.append("type", type);
				const res = await fetch("/api/upload/community-media", {
					method: "POST",
					body: form,
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Upload failed");
				setMedia((prev) => [...prev, { url: data.url, type: data.type }]);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Upload failed");
			} finally {
				setUploading(false);
			}
		},
		[session?.user]
	);

	const removeMedia = (index: number) => {
		setMedia((prev) => prev.filter((_, i) => i !== index));
	};

	const handlePublish = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!session?.user || media.length === 0) return;
		setPublishing(true);
		setError(null);
		try {
			const res = await fetch("/api/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					caption: caption.trim() || undefined,
					media: media.map((m) => ({ url: m.url, type: m.type })),
					userType: (session.user as { role?: string }).role ?? "user",
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to post");
			router.push("/community");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to post");
		} finally {
			setPublishing(false);
		}
	};

	if (status === "loading") {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-orange-500" />
			</div>
		);
	}
	if (status !== "authenticated") {
		return (
			<div className="rounded-2xl border border-orange-500/20 bg-orange-50/50 p-8 text-center text-gray-600">
				Sign in to create a post.
			</div>
		);
	}

	return (
		<form onSubmit={handlePublish} className="space-y-6">
			{error && (
				<div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
					{error}
				</div>
			)}

			{/* Media */}
			<div>
				<label className="block text-sm font-semibold text-gray-800 mb-3">
					Media (image and/or video)
				</label>
				<div className="flex flex-wrap gap-3">
					{media.map((m, i) => (
						<div
							key={i}
							className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-orange-500/20 bg-gray-50 group"
						>
							{m.type === "video" ? (
								<video src={m.url} className="w-full h-full object-cover" />
							) : (
								<Image src={m.url} alt="" fill className="object-cover" unoptimized />
							)}
							<button
								type="button"
								onClick={() => removeMedia(i)}
								className="absolute top-1.5 right-1.5 rounded-full bg-black/60 hover:bg-red-500 p-1.5 text-white transition-colors"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</div>
					))}
					<label className="flex flex-col items-center justify-center w-28 h-28 rounded-xl border-2 border-dashed border-orange-500/30 bg-orange-50/30 cursor-pointer hover:border-orange-500/50 hover:bg-orange-50/50 transition-colors">
						<input
							type="file"
							accept="image/*,video/*"
							className="hidden"
							disabled={uploading}
							onChange={(e) => {
								const f = e.target.files?.[0];
								if (!f) return;
								const isVideo = f.type.startsWith("video/");
								handleFile(f, isVideo ? "video" : "image");
								e.target.value = "";
							}}
						/>
						{uploading ? (
							<Loader2 className="h-7 w-7 animate-spin text-orange-500" />
						) : (
							<>
								<Plus className="h-7 w-7 text-orange-500 mb-1" />
								<span className="text-xs text-gray-600">Add</span>
							</>
						)}
					</label>
				</div>
				<p className="text-xs text-gray-500 mt-2">Add at least one image or video. You can reorder by adding in sequence.</p>
			</div>

			{/* Caption */}
			<div>
				<label className="block text-sm font-semibold text-gray-800 mb-2">
					Caption (optional)
				</label>
				<textarea
					value={caption}
					onChange={(e) => setCaption(e.target.value)}
					placeholder="Add a caption..."
					rows={3}
					className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm placeholder:text-gray-400 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 outline-none transition-shadow"
				/>
			</div>

			<LiquidButton
				type="submit"
				disabled={media.length === 0 || publishing}
				size="sm"
				className="text-orange-500"
			>
				{publishing ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Publishing...
					</>
				) : (
					"Publish"
				)}
			</LiquidButton>
		</form>
	);
}
