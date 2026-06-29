import AiriqBookingClient from "./AiriqBookingClient";

interface AiriqBookingPageProps {
	traceId: string;
	resultIndex: string;
	returnResultIndex?: string;
	adultCount: string;
	childCount: string;
	infantCount: string;
	isUpsellAllowed: boolean;
	searchJourneyType?: string;
}

export default async function AiriqBookingPage({
	traceId,
	resultIndex,
	adultCount,
	childCount,
	infantCount,
	isUpsellAllowed,
	searchJourneyType,
}: AiriqBookingPageProps) {
	// returnResultIndex is for future use with round-trip flights
	return (
		<main className="min-h-screen bg-gray-50/50 pb-20">
			<AiriqBookingClient
				adultCount={parseInt(adultCount)}
				childCount={parseInt(childCount)}
				infantCount={parseInt(infantCount)}
				traceId={traceId}
				resultIndex={resultIndex}
				isUpsellAllowed={isUpsellAllowed}
				searchJourneyType={searchJourneyType}
			/>
		</main>
	);
}
