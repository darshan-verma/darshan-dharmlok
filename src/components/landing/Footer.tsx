"use client";

import Link from "next/link";
import Image from "next/image";
import {
	MapPin,
	Mail,
	Phone,
	Facebook,
	Twitter,
	Youtube,
	Instagram,
} from "lucide-react";

const quickLinks = [
	"Pooja Services",
	"Spiritual Guides",
	"Temples & Dharamshalas",
	"Travel Portal",
	"E-Shop",
];

const recentPosts = [
	"Complete Guide to Char Dham Yatra",
	"Understanding Pooja Rituals: Beginner's Guide",
	"Top 10 Sacred Temples in India",
];

const legalLinks = [
	{ name: "Privacy Policy", href: "/privacy-policy" },
	{ name: "Terms & Conditions", href: "/terms-and-conditions" },
	{ name: "Delete Account", href: "/delete-account" },
	{ name: "Community Guidelines", href: "/community-guidelines" },
	{ name: "Cookie Policy", href: "/cookie-policy" },
	{ name: "Content Disclaimer", href: "/content-disclaimer" },
	{ name: "Contact Us", href: "/contact-us" },
];

export default function Footer() {
	return (
		<footer className="bg-[#f5f5f0]/80 backdrop-blur-sm text-gray-900">
			<div className="container mx-auto px-4 py-16">
				<div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
					{/* Column 1 - Logo & Description */}
					<div className="space-y-6">
						<div className="flex items-center gap-2">
							<Image
								src="/dharmlok-logo.svg"
								alt="Dharmlok Logo"
								width={80}
								height={80}
								className="object-contain"
							/>
						</div>
						<p className="text-gray-600 leading-relaxed">
							Dharmlok is your trusted platform for authentic spiritual
							services, pilgrimage planning, and connecting with verified
							spiritual guides across India.
						</p>
						<div>
							<p className="text-gray-600 mb-3">followers</p>
							<div className="flex gap-3">
								<a
									href="#"
									className="w-10 h-10 bg-white/80 backdrop-blur-sm hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors text-gray-700 hover:text-white shadow-sm"
								>
									<Facebook className="w-5 h-5" />
								</a>
								<a
									href="#"
									className="w-10 h-10 bg-white/80 backdrop-blur-sm hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors text-gray-700 hover:text-white shadow-sm"
								>
									<Twitter className="w-5 h-5" />
								</a>
								<a
									href="#"
									className="w-10 h-10 bg-white/80 backdrop-blur-sm hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors text-gray-700 hover:text-white shadow-sm"
								>
									<Youtube className="w-5 h-5" />
								</a>
								<a
									href="#"
									className="w-10 h-10 bg-white/80 backdrop-blur-sm hover:bg-orange-500 rounded-full flex items-center justify-center transition-colors text-gray-700 hover:text-white shadow-sm"
								>
									<Instagram className="w-5 h-5" />
								</a>
							</div>
						</div>
					</div>

					{/* Column 2 - Quick Links */}
					<div>
						<h3 className="text-xl font-bold mb-6 relative pb-3 text-gray-900">
							Quick Links
							<div className="absolute bottom-0 left-0 w-12 h-1 bg-orange-500" />
						</h3>
						<ul className="space-y-3">
							{quickLinks.map((link) => (
								<li key={link}>
									<Link
										href="#"
										className="text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-2 group"
									>
										<span className="w-2 h-2 bg-orange-500 rounded-full group-hover:scale-150 transition-transform" />
										{link}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Column 3 - Recent Posts */}
					<div>
						<h3 className="text-xl font-bold mb-6 relative pb-3 text-gray-900">
							Recent Posts
							<div className="absolute bottom-0 left-0 w-12 h-1 bg-orange-500" />
						</h3>
						<ul className="space-y-4">
							{recentPosts.map((post, index) => (
								<li key={index} className="flex gap-3 group">
									<div className="w-16 h-16 bg-orange-100 backdrop-blur-sm rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm">
										<div className="w-2 h-2 bg-orange-500 rounded-full" />
									</div>
									<Link
										href="#"
										className="text-gray-600 hover:text-orange-500 transition-colors text-sm leading-relaxed"
									>
										{post}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Column 4 - Contact Info */}
					<div>
						<h3 className="text-xl font-bold mb-6 relative pb-3 text-gray-900">
							Contact Info
							<div className="absolute bottom-0 left-0 w-12 h-1 bg-orange-500" />
						</h3>
						<ul className="space-y-4">
							<li className="flex items-start gap-3">
								<MapPin className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
								<span className="text-gray-600">
									Gotham Hall, 1356 Brodway squore, NY 10018, California, USA
								</span>
							</li>
							<li className="flex items-start gap-3">
								<Mail className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
								<div className="text-gray-600">
									<div>info@dharmlok.com</div>
									<div>support@dharmlok.com</div>
								</div>
							</li>
							<li className="flex items-start gap-3">
								<Phone className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
								<div className="text-gray-600">
									<div>+(91)1800-DHARMLOK</div>
									<div>+(91)1800-342-6756</div>
								</div>
							</li>
						</ul>
					</div>

					{/* Column 5 - Legal / Policies */}
					<div>
						<h3 className="text-xl font-bold mb-6 relative pb-3 text-gray-900">
							Legal
							<div className="absolute bottom-0 left-0 w-12 h-1 bg-orange-500" />
						</h3>
						<ul className="space-y-3">
							{legalLinks.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-gray-600 hover:text-orange-500 transition-colors flex items-center gap-2 group"
									>
										<span className="w-2 h-2 bg-orange-500 rounded-full group-hover:scale-150 transition-transform" />
										{link.name}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Copyright */}
				<div className="border-t border-gray-300 pt-8 text-center text-gray-600">
					<p>Copyright © 2025-26 Dharmlok. All Right Reserved.</p>
				</div>
			</div>

			{/* Chat Widget */}
			<div className="fixed bottom-8 right-8 z-50">
				<button className="w-16 h-16 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110">
					<span className="text-xl font-bold">Chat</span>
				</button>
			</div>
		</footer>
	);
}
