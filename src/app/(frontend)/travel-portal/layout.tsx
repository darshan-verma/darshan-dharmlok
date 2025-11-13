import Navbar from "../components/travel-portal/Navbar";

export default function TravelPortalLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div>
			<Navbar />
			<main>{children}</main>
		</div>
	);
}
