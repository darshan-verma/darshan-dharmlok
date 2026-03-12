import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms & Conditions – Dharmlok",
	description: "Terms and conditions for using the Dharmlok platform and services.",
};

export default function TermsLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
