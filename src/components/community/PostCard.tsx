"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CommentList } from "./CommentList";
import type { PostType } from "@/types/community";
import { cn } from "@/lib/utils";

interface PostCardProps {
	post: PostType;
	onLikeToggle?: (postId: string, liked: boolean) => void;
	onDeleted?: (postId: string) => void;
	showDelete?: boolean;
}

export function PostCard({ post, onLikeToggle, onDeleted, showDelete }: PostCardProps) {
	const { data: session } = useSession();
	const [showComments, setShowComments] = useState(false);
	const [mediaIndex, setMediaIndex] = useState(0);
	const [likeCount, setLikeCount] = useState(post.likes?.length ?? 0);
	const [liked, setLiked] = useState(
		!!(session?.user?.id && post.likes?.includes(session.user.id))
	);
	const [deleting, setDeleting] = useState(false);

	const mediaCount = post.media?.length ?? 0;
	const hasMultipleMedia = mediaCount > 1;
	const currentMedia = post.media?.[mediaIndex];

	const userId = session?.user?.id;

	const handleLike = useCallback(async () => {
		if (!userId) return;
		try {
			if (liked) {
				await fetch(`/api/posts/${post.id}/like`, { method: "DELETE" });
				setLikeCount((c) => Math.max(0, c - 1));
				setLiked(false);
				onLikeToggle?.(post.id, false);
			} else {
				await fetch(`/api/posts/${post.id}/like`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				});
				setLikeCount((c) => c + 1);
				setLiked(true);
				onLikeToggle?.(post.id, true);
			}
		} catch {
			// ignore
		}
	}, [post.id, liked, userId, onLikeToggle]);

	const handleDelete = useCallback(async () => {
		if (!showDelete || !userId || post.userId !== userId) return;
		if (!confirm("Delete this post?")) return;
		setDeleting(true);
		try {
			const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
			if (res.ok) onDeleted?.(post.id);
		} finally {
			setDeleting(false);
		}
	}, [post.id, post.userId, userId, showDelete, onDeleted]);

	const avatarUrl = post.user?.profileImageUrl || post.user?.image || null;

	return (
		<article
			className={cn(
				"rounded-2xl overflow-hidden border border-white/50 bg-white/90 backdrop-blur-sm",
				"shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(255,140,66,0.12)]",
				"transition-shadow duration-300"
			)}
		>
			{/* Author row */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
				<div className="flex items-center gap-3">
					<Avatar className="h-11 w-11 rounded-full ring-2 ring-orange-500/10">
						{avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
						<AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
							{(post.user?.name || "U").slice(0, 1).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="font-semibold text-gray-900">{post.user?.name || "User"}</p>
						<p className="text-xs text-gray-500">{post.userType}</p>
					</div>
				</div>
				{showDelete && post.userId === userId && (
					<Button
						variant="ghost"
						size="icon"
						onClick={handleDelete}
						disabled={deleting}
						className="rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				)}
			</div>

			{/* Media carousel */}
			{post.media?.length > 0 && (
				<div className="relative aspect-[4/3] bg-gray-100">
					{currentMedia?.type === "video" ? (
						<video
							key={currentMedia.url}
							src={currentMedia.url}
							controls
							className="w-full h-full object-contain"
						/>
					) : (
						<Image
							key={currentMedia?.url}
							src={currentMedia?.url ?? ""}
							alt=""
							fill
							className="object-contain"
							unoptimized
						/>
					)}
					{hasMultipleMedia && (
						<>
							<button
								type="button"
								onClick={() => setMediaIndex((i) => (i === 0 ? mediaCount - 1 : i - 1))}
								className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-orange-500/90 text-white flex items-center justify-center transition-colors z-10 backdrop-blur-sm"
								aria-label="Previous media"
							>
								<ChevronLeft className="h-5 w-5" />
							</button>
							<button
								type="button"
								onClick={() => setMediaIndex((i) => (i === mediaCount - 1 ? 0 : i + 1))}
								className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-orange-500/90 text-white flex items-center justify-center transition-colors z-10 backdrop-blur-sm"
								aria-label="Next media"
							>
								<ChevronRight className="h-5 w-5" />
							</button>
							<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
								{post.media.map((_, i) => (
									<button
										key={i}
										type="button"
										onClick={() => setMediaIndex(i)}
										className={cn(
											"h-1.5 rounded-full transition-all duration-200",
											i === mediaIndex
												? "w-5 bg-orange-500"
												: "w-1.5 bg-white/70 hover:bg-white"
										)}
										aria-label={`Go to media ${i + 1}`}
									/>
								))}
							</div>
						</>
					)}
				</div>
			)}

			{post.caption && (
				<div className="px-4 py-3 text-gray-700 text-sm leading-relaxed border-b border-gray-50">
					{post.caption}
				</div>
			)}

			{/* Actions */}
			<div className="flex items-center gap-6 px-4 py-3">
				<button
					type="button"
					onClick={userId ? handleLike : undefined}
					className={cn(
						"flex items-center gap-1.5 text-sm font-medium transition-colors",
						liked
							? "text-red-500"
							: "text-gray-500 hover:text-orange-500"
					)}
				>
					<Heart className={cn("h-5 w-5", liked && "fill-current")} />
					<span>{likeCount}</span>
				</button>
				<button
					type="button"
					onClick={() => setShowComments((c) => !c)}
					className={cn(
						"flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-500 transition-colors",
						showComments && "text-orange-500"
					)}
				>
					<MessageCircle className="h-5 w-5" />
					<span>{post.commentCount ?? 0}</span> comments
				</button>
			</div>

			{showComments && (
				<div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
					<CommentList postId={post.id} />
				</div>
			)}
		</article>
	);
}
