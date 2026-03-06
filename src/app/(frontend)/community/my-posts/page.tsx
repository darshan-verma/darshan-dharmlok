"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Loader2, PenLine, ArrowLeft } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { PostCard } from "@/components/community/PostCard";
import { Button } from "@/components/ui/button";
import type { PostType } from "@/types/community";

export default function MyPostsPage() {
	const { data: _session, status } = useSession();
	const [posts, setPosts] = useState<PostType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (status !== "authenticated") {
			setLoading(false);
			return;
		}
		const fetchPosts = async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await fetch("/api/posts?feed=own");
				if (res.status === 401) {
					setPosts([]);
					return;
				}
				if (!res.ok) throw new Error("Failed to fetch posts");
				const data = await res.json();
				setPosts(Array.isArray(data) ? data : []);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Failed to load posts");
			} finally {
				setLoading(false);
			}
		};
		fetchPosts();
	}, [status]);

	const handleDeleted = (postId: string) => {
		setPosts((prev) => prev.filter((p) => p.id !== postId));
	};

	return (
		<div className="min-h-screen bg-[#f5f5f0]/90">
			<Header />
			<section className="border-b border-white/40 bg-gradient-to-b from-white/60 to-[#f5f5f0]/80 backdrop-blur-sm">
				<div className="container mx-auto px-4 py-8 max-w-2xl">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="rounded-full text-gray-600 hover:text-orange-500 hover:bg-orange-50 shrink-0"
						>
							<Link href="/community" className="flex items-center gap-2">
								<ArrowLeft className="h-4 w-4" />
								Back to Community
							</Link>
						</Button>
						<h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 order-first w-full text-center md:order-none md:w-auto md:text-left">
							My posts
						</h1>
						<Button
							asChild
							size="sm"
							className="rounded-full bg-orange-500 hover:bg-orange-600 text-white shrink-0"
						>
							<Link href="/community/create" className="flex items-center gap-2">
								<PenLine className="h-4 w-4" />
								Create post
							</Link>
						</Button>
					</div>
				</div>
			</section>

			<div className="container mx-auto px-4 py-8 max-w-2xl">
				{status !== "authenticated" && (
					<div className="rounded-2xl border border-orange-500/20 bg-white/90 backdrop-blur-sm p-6 text-center text-gray-600 mb-8">
						Sign in to view your posts.
					</div>
				)}

				{loading ? (
					<div className="flex flex-col items-center justify-center py-16">
						<div className="rounded-full bg-white/80 p-4 shadow-sm border border-orange-500/10">
							<Loader2 className="h-8 w-8 animate-spin text-orange-500" />
						</div>
						<p className="text-muted-foreground mt-4 text-sm">Loading...</p>
					</div>
				) : error ? (
					<div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center text-red-600 text-sm">
						{error}
					</div>
				) : posts.length === 0 ? (
					<div className="rounded-2xl border border-orange-500/15 bg-white/90 backdrop-blur-sm p-12 text-center shadow-sm">
						<p className="text-gray-600 font-medium mb-1">You haven&apos;t posted yet</p>
						<p className="text-gray-500 text-sm mb-6">Create your first post to share with the community.</p>
						<Button asChild size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600 text-white">
							<Link href="/community/create" className="flex items-center gap-2 inline-flex">
								<PenLine className="h-4 w-4" />
								Create post
							</Link>
						</Button>
					</div>
				) : (
					<div className="space-y-6">
						{posts.map((post) => (
							<PostCard
								key={post.id}
								post={post}
								showDelete
								onDeleted={handleDeleted}
							/>
						))}
					</div>
				)}
			</div>
			<Footer />
		</div>
	);
}
