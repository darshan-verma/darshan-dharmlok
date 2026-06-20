"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import AboutSection from "@/components/ui/about-section";
import FaqSection from "@/components/ui/faq-section";
import ContactUsSection from "@/components/ui/contact-us-section";

export default function KnowMorePage() {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1">
				<AboutSection />
				<ContactUsSection />
				<FaqSection />
			</main>
			<Footer />
		</div>
	);
}
