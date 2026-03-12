import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Cookie Policy – Dharmlok",
	description:
		"Information about how Dharmlok uses cookies and similar technologies.",
};

export default function CookiePolicyLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
