"use client";

import Link from "next/link";
import PolicyPageLayout from "@/components/legal/PolicyPageLayout";

export default function ContentDisclaimerPage() {
	return (
		<PolicyPageLayout
			title="Content Disclaimer"
			lastUpdated="January 1, 2025"
		>
			<p className="lead">
				Dharmlok hosts religious, spiritual, and cultural content for
				informational and devotional purposes. This disclaimer explains how
				such content should be understood and used.
			</p>

			<h2>Not Professional Advice</h2>
			<p>
				Content on the Platform (including texts, discourses, rituals, and
				guidance from spiritual guides) is for general informational and
				devotional use only. It does not constitute legal, medical, or
				professional advice. For specific concerns, please consult qualified
				professionals.
			</p>

			<h2>Accuracy of Content</h2>
			<p>
				We strive to present content accurately but do not guarantee the
				completeness or correctness of all material. Traditions and
				interpretations may vary. Third-party content (including from
				creators and guides) reflects their own views and not necessarily
				those of Dharmlok.
			</p>

			<h2>User Responsibility</h2>
			<p>
				You are responsible for how you use the content. Participation in
				rituals, practices, or events is at your own discretion and risk. We
				encourage you to use your judgment and, where appropriate, consult
				knowledgeable sources.
			</p>

			<h2>No Endorsement</h2>
			<p>
				Inclusion of content, traditions, or viewpoints on the Platform does
				not imply endorsement of any particular belief, sect, or practice.
				Dharmlok aims to be a respectful space for diverse spiritual
				expressions.
			</p>

			<h2>Contact</h2>
			<p>
				If you have questions about this disclaimer, please visit our{" "}
				<Link href="/contact-us" className="text-orange-500 hover:underline">
					Contact Us
				</Link>{" "}
				page.
			</p>
		</PolicyPageLayout>
	);
}
