"use client";

import Link from "next/link";
import PolicyPageLayout from "@/components/legal/PolicyPageLayout";

export default function PrivacyPolicyPage() {
	return (
		<PolicyPageLayout
			title="Privacy Policy"
			lastUpdated="January 1, 2025"
		>
			<p className="lead">
				Dharmlok (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is
				committed to protecting your privacy. This policy explains how we
				collect, use, and safeguard your information when you use our
				platform.
			</p>

			<h2>Information We Collect</h2>
			<p>
				We may collect information you provide directly (e.g., name, email,
				phone, address when booking services), account credentials, payment
				information, content you post or upload, and communications with
				support. We also collect certain information automatically, such as
				device information, log data, and cookies, as described in our Cookie
				Policy.
			</p>

			<h2>How We Use Your Information</h2>
			<p>
				We use your information to provide, maintain, and improve our
				services; process transactions; send updates and support; personalize
				your experience; ensure security and prevent fraud; and comply with
				legal obligations.
			</p>

			<h2>Sharing of Information</h2>
			<p>
				We may share your information with service providers who assist our
				operations, with spiritual guides or vendors when necessary to fulfill
				bookings, and when required by law or to protect our rights and
				safety.
			</p>

			<h2>Security</h2>
			<p>
				We implement appropriate technical and organizational measures to
				protect your personal data against unauthorized access, alteration,
				disclosure, or destruction.
			</p>

			<h2>Your Rights</h2>
			<p>
				Depending on your location, you may have rights to access, correct,
				delete, or port your data, and to object to or restrict certain
				processing. You may also withdraw consent where we rely on it. To
				request deletion of your account and data, please see our{" "}
				<Link href="/delete-account" className="text-orange-500 hover:underline">
					Delete Account
				</Link>{" "}
				page.
			</p>

			<h2>Contact</h2>
			<p>
				For privacy-related questions or requests, please contact us via our{" "}
				<Link href="/know-more" className="text-orange-500 hover:underline">
					Contact Us
				</Link>{" "}
				page or at the email address provided there.
			</p>
		</PolicyPageLayout>
	);
}
