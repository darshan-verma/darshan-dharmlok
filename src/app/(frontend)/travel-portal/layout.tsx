import Header from "@/components/landing/Header";
import Navbar from "../components/travel-portal/Navbar";

export default function TravelPortalLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div>
			<Header />
			<Navbar />
			<main>{children}</main>
		</div>
	);
}
