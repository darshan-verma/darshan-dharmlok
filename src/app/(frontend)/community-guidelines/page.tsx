"use client";

import Link from "next/link";
import PolicyPageLayout from "@/components/legal/PolicyPageLayout";

export default function CommunityGuidelinesPage() {
	return (
		<PolicyPageLayout
			title="Community Guidelines"
			lastUpdated="January 1, 2025"
		>
			<p className="lead">
				Our community is a space for respectful sharing and discussion around
				spirituality and tradition. These guidelines help keep the
				experience safe and meaningful for everyone.
			</p>

			<h2>Be Respectful</h2>
			<p>
				Treat others with respect. You may disagree with beliefs or
				opinions, but personal attacks, harassment, or demeaning language are
				not allowed. Respect diverse traditions and practices.
			</p>

			<h2>No Hate or Harm</h2>
			<p>
				Content that promotes hatred, violence, or discrimination based on
				religion, caste, gender, ethnicity, or any other protected
				characteristic is prohibited. Do not threaten or encourage harm to
				others.
			</p>

			<h2>Authenticity</h2>
			<p>
				Share content that is genuinely yours or that you have the right to
				share. Do not impersonate others or misrepresent your identity or
				credentials.
			</p>

			<h2>No Spam or Misuse</h2>
			<p>
				Do not use the community for unsolicited advertising, repetitive
				posting, or manipulation (e.g., fake engagement). Use features as
				intended.
			</p>

			<h2>Moderation</h2>
			<p>
				We may remove content or take action against accounts that violate
				these guidelines. We reserve the right to moderate at our discretion
				to maintain a safe and positive environment.
			</p>

			<h2>Consequences</h2>
			<p>
				Violations may result in a warning, temporary restriction, or
				permanent suspension of your account or access to community
				features, depending on severity and context.
			</p>

			<h2>Reporting</h2>
			<p>
				If you see content or behavior that violates these guidelines,
				please report it through the in-app reporting option or contact us
				via our{" "}
				<Link href="/contact-us" className="text-orange-500 hover:underline">
					Contact Us
				</Link>{" "}
				page.
			</p>

			<h2>Contact</h2>
			<p>
				For questions about these guidelines, please visit our{" "}
				<Link href="/contact-us" className="text-orange-500 hover:underline">
					Contact Us
				</Link>{" "}
				page.
			</p>
		</PolicyPageLayout>
	);
}
