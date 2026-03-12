import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy – Dharmlok",
	description:
		"Learn how Dharmlok collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
