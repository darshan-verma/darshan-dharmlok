"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ContactUsSection from "@/components/ui/contact-us-section";

export default function ContactUsPage() {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				<ContactUsSection />
			</main>
			<Footer />
		</div>
	);
}
