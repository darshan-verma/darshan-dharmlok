"use client";

import Link from "next/link";
import PolicyPageLayout from "@/components/legal/PolicyPageLayout";

export default function DeleteAccountPage() {
	return (
		<PolicyPageLayout
			title="Delete Account"
			lastUpdated="January 1, 2025"
		>
			<p className="lead">
				You may request permanent deletion of your Dharmlok account and
				associated personal data at any time. This page explains how to do so
				and what to expect.
			</p>

			<h2>How to Request Deletion</h2>
			<p>
				You can request account deletion in either of the following ways:
			</p>
			<ul>
				<li>
					<strong>From your account:</strong> Log in and go to Dashboard →
					Settings (or Profile). Look for the &quot;Delete account&quot; or
					&quot;Account data&quot; section and follow the instructions to
					submit a deletion request.
				</li>
				<li>
					<strong>By contacting us:</strong> Send a clear request to delete your
					account to our support team via the{" "}
					<Link href="/contact-us" className="text-orange-500 hover:underline">
						Contact Us
					</Link>{" "}
					page. Include the email address associated with your account so we
					can verify your identity.
				</li>
			</ul>

			<h2>What Gets Removed</h2>
			<p>
				Once your request is processed, we will permanently delete your
				account profile, contact information, and other personal data we hold
				that is linked to your account. Content you have posted (e.g., in the
				Community) may be anonymized or removed in accordance with our
				systems and policies.
			</p>

			<h2>Data We May Retain</h2>
			<p>
				We may retain certain information where required by law (e.g., for
				tax, legal, or regulatory compliance) or for legitimate business
				purposes such as resolving disputes or enforcing our agreements.
				Such data will be kept only as long as necessary.
			</p>

			<h2>Timeline</h2>
			<p>
				We aim to process deletion requests within a reasonable period (e.g.,
				30 days) after verifying your identity. You will receive a
				confirmation once the process is complete.
			</p>

			<h2>Contact</h2>
			<p>
				If you have questions or need help with account deletion, please use
				our{" "}
				<Link href="/contact-us" className="text-orange-500 hover:underline">
					Contact Us
				</Link>{" "}
				page.
			</p>
		</PolicyPageLayout>
	);
}
