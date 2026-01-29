"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { ProfileCard } from "@/components/ui/profile-card";
import { extractPlainTextFromBlockNote } from "@/lib/blog-content";

interface Blog {
	id: string;
	title: string;
	content: string;
	coverImage?: string;
	bannerImage?: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

export default function BlogsPage() {
	const router = useRouter();
	const [blogs, setBlogs] = useState<Blog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [readingBlogId, setReadingBlogId] = useState<string | null>(null);

	useEffect(() => {
		const fetchBlogs = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch("/api/blogs?page=1&limit=1000");
				if (!response.ok) {
					throw new Error("Failed to fetch blogs");
				}
				const data = await response.json();
				const content = data.content || [];
				const activeBlogs: Blog[] = content
					.filter((b: { status?: string }) => b.status === "Active")
					.map((b: Blog) => ({
						id: b.id,
						title: b.title,
						content: b.content,
						coverImage: b.coverImage,
						bannerImage: b.bannerImage,
						status: b.status,
						createdAt: b.createdAt,
						updatedAt: b.updatedAt,
					}));
				setBlogs(activeBlogs);
			} catch (err) {
				console.error("Error fetching blogs:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load blogs"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchBlogs();
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Banner Section with Text Overlay */}
			<section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
				<div className="absolute inset-0">
					<Image
						src="/banners/9983f4c9bb5fd3f6d8213d08ad1e99d3.jpg"
						alt="Blogs Banner"
						fill
						className="object-cover"
						priority
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							target.src = "/landing-page/amritsar-6184343.jpg";
						}}
					/>
					<div className="absolute inset-0 bg-black/40" />
				</div>

				<div className="relative z-10 h-full flex items-center justify-center">
					<div className="container mx-auto px-4 text-center">
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 drop-shadow-2xl animate-fade-in-up">
							Blogs
						</h1>
						<p
							className="text-xl md:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light"
							style={{ fontFamily: "var(--font-jost), sans-serif" }}
						>
							Read articles and insights on spirituality and devotion
						</p>
					</div>
				</div>
			</section>

			{/* Blogs Cards Section */}
			<section className="py-16 bg-[#f5f5f0]">
				<div className="container mx-auto px-4 max-w-7xl">
					{loading ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
							<p className="text-muted-foreground">Loading blogs...</p>
						</div>
					) : error ? (
						<div className="text-center py-12">
							<p className="text-red-500">{error}</p>
						</div>
					) : blogs.length > 0 ? (
						<div className="grid gap-6 justify-items-center grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
							{blogs.map((blog) => (
								<ProfileCard
									key={blog.id}
									variant="blog"
									name={blog.title}
									description={extractPlainTextFromBlockNote(
										blog.content,
										120
									)}
									image={blog.coverImage}
									isVerified={blog.status === "Active"}
									isBooking={readingBlogId === blog.id}
									onBook={() => {
										setReadingBlogId(blog.id);
										router.push(`/blogs/${blog.id}`);
									}}
									enableAnimations={true}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-16 text-gray-500">
							<p className="text-xl">
								No blogs available at the moment.
							</p>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</div>
	);
}
