"use client";

import type { ReactNode } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

interface PolicyPageLayoutProps {
	title: string;
	lastUpdated?: string;
	children: ReactNode;
}

export default function PolicyPageLayout({
	title,
	lastUpdated,
	children,
}: PolicyPageLayoutProps) {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				<div className="container mx-auto px-4 py-12 max-w-4xl">
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
						{title}
					</h1>
					{lastUpdated && (
						<p className="text-sm text-gray-500 mb-8">
							Last updated: {lastUpdated}
						</p>
					)}
					<div className="prose prose-lg max-w-none text-gray-700">
						{children}
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
