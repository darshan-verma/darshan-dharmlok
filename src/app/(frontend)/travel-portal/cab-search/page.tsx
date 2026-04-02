import { Suspense } from "react";
import CabSearch from "../components/CabSearch";

export default function CabSearchPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<Suspense fallback={<div>Loading...</div>}>
				<CabSearch />
			</Suspense>
		</div>
	);
}
