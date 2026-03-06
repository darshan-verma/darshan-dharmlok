"use client";

import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { PostComposer } from "@/components/community/PostComposer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreatePostPage() {
	return (
		<div className="min-h-screen bg-[#f5f5f0]/90">
			<Header />
			<section className="border-b border-white/40 bg-gradient-to-b from-white/60 to-[#f5f5f0]/80 backdrop-blur-sm">
				<div className="container mx-auto px-4 py-8 max-w-2xl">
					<div className="flex items-center justify-between">
						<h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
							Create post
						</h1>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="rounded-full text-gray-600 hover:text-orange-500 hover:bg-orange-50"
						>
							<Link href="/community" className="flex items-center gap-2">
								<ArrowLeft className="h-4 w-4" />
								Back to Community
							</Link>
						</Button>
					</div>
				</div>
			</section>

			<div className="container mx-auto px-4 py-8 max-w-2xl">
				<div className="rounded-2xl border border-white/50 bg-white/90 backdrop-blur-sm p-6 md:p-8 shadow-[0_4px_14px_rgba(0,0,0,0.06)]">
					<PostComposer />
				</div>
			</div>
			<Footer />
		</div>
	);
}
