import { Suspense } from "react";
import ConfirmationContent from "./ConfirmationContent";

export default function BookingConfirmationPage() {
	return (
		<Suspense fallback={
			<div className="container mx-auto py-8 px-4 max-w-3xl">
				<p className="text-gray-600">Loading…</p>
			</div>
		}>
			<ConfirmationContent />
		</Suspense>
	);
}
