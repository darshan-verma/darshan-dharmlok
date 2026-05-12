"use client";

import Link from "next/link";
import PolicyPageLayout from "@/components/legal/PolicyPageLayout";

export default function CookiePolicyPage() {
	return (
		<PolicyPageLayout
			title="Cookie Policy"
			lastUpdated="January 1, 2025"
		>
			<p className="lead">
				This Cookie Policy explains what cookies and similar technologies we
				use on the Dharmlok website and app, and how you can control them.
			</p>

			<h2>What Are Cookies</h2>
			<p>
				Cookies are small text files stored on your device when you visit a
				website. They help the site remember your preferences, keep you
				logged in, and understand how the site is used.
			</p>

			<h2>Cookies We Use</h2>
			<p>We use the following types of cookies:</p>
			<ul>
				<li>
					<strong>Essential:</strong> Required for the site to function (e.g.,
					authentication, security, load balancing). These cannot be disabled
					if you want to use the service.
				</li>
				<li>
					<strong>Analytics:</strong> Help us understand how visitors use our
					platform (e.g., pages viewed, features used) so we can improve
					experience and performance.
				</li>
				<li>
					<strong>Preferences:</strong> Remember your settings (e.g., language,
					theme) for a better experience on return visits.
				</li>
			</ul>

			<h2>How to Control Cookies</h2>
			<p>
				You can control or delete cookies through your browser settings. Most
				browsers allow you to refuse or accept cookies, or to delete existing
				ones. Disabling certain cookies may affect site functionality or
				your experience.
			</p>

			<h2>Third-Party Cookies</h2>
			<p>
				We may allow third-party services (e.g., analytics providers) to set
				cookies when you use our platform. Their use of data is governed by
				their own privacy policies.
			</p>

			<h2>Contact</h2>
			<p>
				For questions about our use of cookies, please visit our{" "}
				<Link href="/know-more" className="text-orange-500 hover:underline">
					Contact Us
				</Link>{" "}
				page.
			</p>
		</PolicyPageLayout>
	);
}
