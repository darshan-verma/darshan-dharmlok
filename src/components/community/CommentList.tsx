"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { CommentType, PostUser } from "@/types/community";

interface CommentListProps {
	postId: string;
}

export function CommentList({ postId }: CommentListProps) {
	const { data: session } = useSession();
	const [comments, setComments] = useState<CommentType[]>([]);
	const [loading, setLoading] = useState(true);
	const [text, setText] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const fetchComments = useCallback(async () => {
		try {
			const res = await fetch(`/api/posts/${postId}/comments`);
			const data = await res.json();
			if (res.ok && data.comments) setComments(data.comments);
		} finally {
			setLoading(false);
		}
	}, [postId]);

	useEffect(() => {
		fetchComments();
	}, [fetchComments]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!text.trim() || !session?.user?.id) return;
		setSubmitting(true);
		try {
			const res = await fetch(`/api/posts/${postId}/comments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: text.trim() }),
			});
			const data = await res.json();
			if (res.ok && data.comment) {
				setComments((prev) => [data.comment, ...prev]);
				setText("");
			}
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="space-y-4">
			{session?.user && (
				<form onSubmit={handleSubmit} className="flex gap-2">
					<input
						type="text"
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Add a comment..."
						className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 outline-none"
					/>
					<Button
						type="submit"
						size="sm"
						disabled={submitting || !text.trim()}
						className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-4"
					>
						Post
					</Button>
				</form>
			)}
			{loading ? (
				<p className="text-sm text-gray-500">Loading comments...</p>
			) : comments.length === 0 ? (
				<p className="text-sm text-gray-500">No comments yet.</p>
			) : (
				<ul className="space-y-3">
					{comments.map((c) => (
						<CommentItem key={c.id} comment={c} />
					))}
				</ul>
			)}
		</div>
	);
}

function CommentItem({ comment }: { comment: CommentType }) {
	const user = comment.user as PostUser;
	const avatarUrl = user?.profileImageUrl || user?.image || null;
	return (
		<li className="flex gap-3 text-sm">
			<Avatar className="h-8 w-8 shrink-0 rounded-full ring-1 ring-orange-500/10">
				{avatarUrl && <AvatarImage src={avatarUrl} />}
				<AvatarFallback className="bg-orange-100 text-orange-600 text-xs font-medium">
					{(user?.name || "U").slice(0, 1)}
				</AvatarFallback>
			</Avatar>
			<div className="flex-1 min-w-0">
				<span className="font-medium text-gray-900">{user?.name || "User"}</span>{" "}
				<span className="text-gray-700">{comment.text}</span>
			</div>
		</li>
	);
}
