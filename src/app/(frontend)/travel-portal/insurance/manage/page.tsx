import { Suspense } from "react";
import TripsafeInsuranceManage from "@/components/travel-portal/insurance/TripsafeInsuranceManage";

export default function TravelInsuranceManagePage() {
	return (
		<Suspense fallback={<div className="p-8 text-center text-gray-500">Loading…</div>}>
			<TripsafeInsuranceManage />
		</Suspense>
	);
}
