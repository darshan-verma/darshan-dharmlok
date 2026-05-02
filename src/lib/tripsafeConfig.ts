const TRIPSAFE_API_URL = process.env.TRIPSAFE_API_URL || "";
const TRIPJACK_API_URL = process.env.TRIPJACK_API_URL || "";
const TRIPJACK_API_KEY = process.env.TRIPJACK_API_KEY || "";

/** TripSafe host: `TRIPSAFE_API_URL` if set, else `TRIPJACK_API_URL`; same `TRIPJACK_API_KEY`. */
export function isTripsafeConfigured(): boolean {
	const base = (TRIPSAFE_API_URL.trim() || TRIPJACK_API_URL.trim());
	return Boolean(base && TRIPJACK_API_KEY.trim());
}
