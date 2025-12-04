import { Suspense } from "react";
import FlightSearch from "../components/FlightSearch";

export default function FlightSearchPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<Suspense fallback={<div>Loading...</div>}>
				<FlightSearch />
			</Suspense>
		</div>
	);
}
