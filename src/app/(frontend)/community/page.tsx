"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, PenLine, MessageCircle, LayoutGrid, Rss } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { PostCard } from "@/components/community/PostCard";
import { PageBanner } from "@/components/shared/PageBanner";
import type { PostType } from "@/types/community";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/community", label: "Feed", icon: Rss },
	{ href: "/community/create", label: "Create post", icon: PenLine },
	{ href: "/community/my-posts", label: "My posts", icon: LayoutGrid },
	{ href: "/community/chat", label: "Chat", icon: MessageCircle },
] as const;

export default function CommunityPage() {
	const pathname = usePathname();
	const { data: session, status: _status } = useSession();
	const [posts, setPosts] = useState<PostType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPosts = async () => {
			try {
				setLoading(true);
				setError(null);
				const res = await fetch("/api/posts?feed=community");
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
	}, []);

	return (
		<div className="min-h-screen bg-[#f5f5f0]/90">
			<Header />

			<PageBanner
				pageSlug="community"
				title="Community"
				description="Share moments, connect with others, and discover posts from the community."
				alt="Community Banner"
				titleClassName="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl"
				descriptionClassName="text-lg md:text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-lg font-light"
			/>

			{/* Nav strip: same style for all links */}
			{session?.user && (
				<section className="border-b border-gray-200/80 bg-white/80 backdrop-blur-sm sticky top-[5rem] z-30">
					<div className="container mx-auto px-4 py-3 max-w-2xl">
						<nav className="flex items-center justify-center gap-1 p-1 rounded-xl bg-gray-100/80" aria-label="Community navigation">
							{navItems.map(({ href, label, icon: Icon }) => {
								const isActive =
									href === "/community/chat"
										? pathname.startsWith(href)
										: pathname === href;
								return (
									<Link
										key={href}
										href={href}
										className={cn(
											"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
											isActive
												? "bg-white text-orange-600 shadow-sm"
												: "text-gray-600 hover:text-orange-600 hover:bg-white/60"
										)}
									>
										<Icon className="h-4 w-4 shrink-0" />
										{label}
									</Link>
								);
							})}
						</nav>
					</div>
				</section>
			)}

			<div className="container mx-auto px-4 py-8 max-w-2xl">
				{!session?.user && (
					<div className="rounded-2xl border border-orange-500/20 bg-white/90 backdrop-blur-sm p-6 text-center text-gray-600 mb-8 shadow-sm animate-in fade-in">
						<p className="text-sm">Sign in to view and create posts.</p>
					</div>
				)}

				{loading ? (
					<div className="flex flex-col items-center justify-center py-16">
						<div className="rounded-full bg-white/80 p-4 shadow-sm border border-orange-500/10">
							<Loader2 className="h-8 w-8 animate-spin text-orange-500" />
						</div>
						<p className="text-muted-foreground mt-4 text-sm">Loading posts...</p>
					</div>
				) : error ? (
					<div className="rounded-2xl border border-red-200 bg-red-50/80 p-8 text-center text-red-600 text-sm">
						{error}
					</div>
				) : posts.length === 0 ? (
					<div className="rounded-2xl border border-orange-500/15 bg-white/90 backdrop-blur-sm p-12 text-center shadow-sm">
						<div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
							<LayoutGrid className="h-7 w-7 text-orange-500" />
						</div>
						<p className="text-gray-600 font-medium mb-1">No posts yet</p>
						<p className="text-gray-500 text-sm mb-6">Be the first to create one!</p>
						{session?.user && (
							<Link
								href="/community/create"
								className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
							>
								<PenLine className="h-4 w-4" />
								Create post
							</Link>
						)}
					</div>
				) : (
					<div className="space-y-6">
						{posts.map((post) => (
							<PostCard key={post.id} post={post} />
						))}
					</div>
				)}
			</div>
			<Footer />
		</div>
	);
}
