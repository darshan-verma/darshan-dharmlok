import { Suspense } from "react";
import TripsafeInsuranceWizard from "@/components/travel-portal/insurance/TripsafeInsuranceWizard";

export default function TravelInsurancePage() {
	return (
		<Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
			<TripsafeInsuranceWizard />
		</Suspense>
	);
}
