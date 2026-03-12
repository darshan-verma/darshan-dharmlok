import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Content Disclaimer – Dharmlok",
	description:
		"Disclaimer regarding religious and spiritual content on the Dharmlok platform.",
};

export default function ContentDisclaimerLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
