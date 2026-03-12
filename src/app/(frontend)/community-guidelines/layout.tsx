import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Community Guidelines – Dharmlok",
	description:
		"Rules and expectations for posting and interacting in the Dharmlok community.",
};

export default function CommunityGuidelinesLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
