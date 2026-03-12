import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Delete Account – Dharmlok",
	description:
		"Learn how to permanently delete your Dharmlok account and associated data.",
};

export default function DeleteAccountLayout({
	children,
}: { children: React.ReactNode }) {
	return children;
}
