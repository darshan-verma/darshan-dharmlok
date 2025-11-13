import Link from "next/link";

export default function Navbar() {
	return (
		<nav className="border-b">
			<div className="max-w-6xl mx-auto px-6 py-4 flex space-x-6">
				<Link
					href="/travel-portal"
					className="text-lg font-medium hover:underline"
				>
					Home
				</Link>
				<Link
					href="/travel-portal/destinations"
					className="text-lg font-medium hover:underline"
				>
					Destinations
				</Link>
				<Link
					href="/travel-portal/my-trips"
					className="text-lg font-medium hover:underline"
				>
					My Trips
				</Link>
			</div>
		</nav>
	);
}
