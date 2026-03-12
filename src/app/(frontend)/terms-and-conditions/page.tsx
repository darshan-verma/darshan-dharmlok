"use client";

import Link from "next/link";
import PolicyPageLayout from "@/components/legal/PolicyPageLayout";

export default function TermsAndConditionsPage() {
	return (
		<PolicyPageLayout
			title="Terms & Conditions"
			lastUpdated="January 1, 2025"
		>
			<p className="lead">
				By accessing or using Dharmlok (&quot;the Platform&quot;), you agree
				to be bound by these Terms and Conditions. Please read them
				carefully.
			</p>

			<h2>Acceptance</h2>
			<p>
				By creating an account, browsing, or using any part of the Platform,
				you accept these Terms and our Privacy Policy. If you do not agree,
				do not use the Platform.
			</p>

			<h2>Use of Service</h2>
			<p>
				You agree to use the Platform only for lawful purposes and in
				accordance with these Terms. You must not misuse the Platform, harm
				others, or violate any applicable laws. You are responsible for
				maintaining the confidentiality of your account credentials.
			</p>

			<h2>Accounts</h2>
			<p>
				You must provide accurate information when registering. You are
				responsible for all activity under your account. We reserve the right
				to suspend or terminate accounts that violate these Terms.
			</p>

			<h2>Content</h2>
			<p>
				Content you post remains your responsibility. You grant us a license to
				use, display, and distribute such content as needed to operate the
				Platform. You must not post content that infringes others&apos;
				rights or violates our Community Guidelines.
			</p>

			<h2>Payments and Refunds</h2>
			<p>
				Fees for bookings, purchases, or subscriptions are as displayed at
				the time of transaction. Refund policies may vary by service and are
				stated at checkout or in the relevant service description.
			</p>

			<h2>Termination</h2>
			<p>
				We may terminate or suspend your access at any time for breach of
				these Terms. You may close your account at any time. See our{" "}
				<Link href="/delete-account" className="text-orange-500 hover:underline">
					Delete Account
				</Link>{" "}
				page for how to request account deletion.
			</p>

			<h2>Disclaimer</h2>
			<p>
				The Platform and services are provided &quot;as is&quot;. We do not
				guarantee uninterrupted or error-free service. Spiritual and
				religious content is subject to our{" "}
				<Link
					href="/content-disclaimer"
					className="text-orange-500 hover:underline"
				>
					Content Disclaimer
				</Link>
				.
			</p>

			<h2>Governing Law</h2>
			<p>
				These Terms are governed by the laws of India. Any disputes shall be
				subject to the exclusive jurisdiction of the courts as permitted by
				applicable law.
			</p>

			<h2>Contact</h2>
			<p>
				For questions about these Terms, please visit our{" "}
				<Link href="/contact-us" className="text-orange-500 hover:underline">
					Contact Us
				</Link>{" "}
				page.
			</p>
		</PolicyPageLayout>
	);
}
