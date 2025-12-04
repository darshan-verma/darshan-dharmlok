/**
 * Example hook for using TekTravels flight search in your frontend
 * Place this in: src/hooks/useTekTravelsFlights.ts
 */

import { useState } from "react";

interface FlightSearchParams {
	origin: string;
	destination: string;
	departureDate: string;
	returnDate?: string;
	adults: number;
	children?: number;
	infants?: number;
	cabinClass?: number;
	journeyType?: 1 | 2 | 3; // 1: OneWay, 2: Return, 3: MultiCity
}

export function useTekTravelsFlights() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [flights, setFlights] = useState<unknown[]>([]);

	const searchFlights = async (params: FlightSearchParams) => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/travel/flights/search", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					Origin: params.origin,
					Destination: params.destination,
					PreferredDepartureTime: params.departureDate,
					AdultCount: String(params.adults),
					ChildCount: String(params.children || 0),
					InfantCount: String(params.infants || 0),
					FlightCabinClass: String(params.cabinClass || 1),
					JourneyType: String(params.journeyType || 1),
					ReturnDate: params.returnDate,
					DirectFlight: "true", // Default to direct flights
					OneStopFlight: "false",
				}),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || "Flight search failed");
			}

			setFlights(data.data);
			return data.data;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "An error occurred";
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const clearFlights = () => {
		setFlights([]);
		setError(null);
	};

	return {
		searchFlights,
		clearFlights,
		flights,
		loading,
		error,
	};
}

// Example usage in a component:
/*
import { useTekTravelsFlights } from '@/hooks/useTekTravelsFlights';

export default function FlightSearchComponent() {
  const { searchFlights, flights, loading, error } = useTekTravelsFlights();

  const handleSearch = async () => {
    try {
      await searchFlights({
        origin: 'DEL',
        destination: 'BOM',
        departureDate: '2025-12-15T00:00:00',
        adults: 1,
        journeyType: 1,
      });
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search Flights'}
      </button>
      {error && <p>Error: {error}</p>}
      {flights && <div>{JSON.stringify(flights, null, 2)}</div>}
    </div>
  );
}
*/
