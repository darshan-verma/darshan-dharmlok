"use client";

import { HelpCircle } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
	{
		question: "What is Dharmlok and who is it for?",
		answer:
			"Dharmlok is India's spiritual platform for devotees, families, and travellers. You can discover and book poojas, yoga, temple visits, pilgrimage travel, e-books, audio content, and community conversations — all in one place built with care for tradition.",
	},
	{
		question: "How do I book pooja, yoga, or other spiritual services?",
		answer:
			"Browse the Services section to explore available offerings such as pooja ceremonies and yoga sessions. Select a service, review the details, and follow the booking steps on the listing. If you need help choosing the right option, use the contact form below or reach us by phone or email.",
	},
	{
		question: "Can I find temples, dharmshalas, and spiritual guides?",
		answer:
			"Yes. Dharmlok helps you discover temples and dharmshalas, and connect with kathavachaks, dharmgurus, and pandits for ceremonies and guidance. Listings are presented with clear information so you can plan visits and bookings with confidence.",
	},
	{
		question: "Does Dharmlok offer travel booking for pilgrimage?",
		answer:
			"Yes. Dharmlok Travels lets you search and book flights, hotels, and plan spiritual itineraries tailored for pilgrimage and sacred cities across India. Visit the Travel Portal from the main navigation to start planning your journey.",
	},
	{
		question: "What spiritual content is available on the platform?",
		answer:
			"You can explore e-books, Bal Vidhya, events, an audio library, spiritual blogs, and live streams. Whether you want daily inspiration, learning, or media to unwind with, content is organized so you can browse and return to what matters to you.",
	},
	{
		question: "How does the Dharmlok E-Shop work?",
		answer:
			"The E-Shop offers puja items and spiritual products curated for quality and authenticity. Browse categories, add items to your cart, and complete checkout online. Product details and availability are shown on each listing before you purchase.",
	},
	{
		question: "Can I join the Dharmlok community?",
		answer:
			"Yes. The Community section lets you share experiences, join conversations, and stay connected with others on a similar spiritual path. You can participate in discussions and learn from fellow devotees across the platform.",
	},
	{
		question: "How do I contact support or get help with a booking?",
		answer:
			"Our team is available Monday to Saturday, 9:00 AM to 6:00 PM IST. You can call us, email Info@dharmlok.com or support@dharmlok.com, or send a message through the contact form on this page. We aim to respond promptly and respectfully.",
	},
];

export default function FaqSection() {
	return (
		<section
			id="faq-section"
			className="w-full py-20 px-4 bg-white text-gray-800"
		>
			<div className="container mx-auto max-w-3xl">
				<div className="flex flex-col items-center mb-10 text-center">
					<span className="text-orange-600 font-medium mb-2 flex items-center gap-2 text-sm tracking-wide uppercase">
						<HelpCircle className="w-4 h-4" />
						FAQ
					</span>
					<h2 className="text-3xl md:text-4xl font-light mb-4">
						Frequently Asked Questions
					</h2>
					<div className="w-24 h-1 bg-orange-500 mb-4" />
					<p className="text-gray-600 max-w-2xl">
						Quick answers about services, travel, content, and support on
						Dharmlok. Can&apos;t find what you need? Reach out through the
						contact section below.
					</p>
				</div>

				<div className="rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50/50 to-amber-50/30 px-5 md:px-8 shadow-sm">
					<Accordion type="single" collapsible className="w-full">
						{faqs.map((faq, index) => (
							<AccordionItem
								key={faq.question}
								value={`faq-${index}`}
								className="border-orange-100 last:border-b-0"
							>
								<AccordionTrigger className="text-left text-gray-900 hover:no-underline hover:text-orange-600 py-5 text-base md:text-[17px] font-medium">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="text-gray-600 leading-relaxed pb-5">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</div>
			</div>
		</section>
	);
}
