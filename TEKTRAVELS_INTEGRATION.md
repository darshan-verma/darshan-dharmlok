# TekTravels Flight Booking API Integration

This documentation explains how to use the TekTravels flight booking API integration in your Next.js application.

## Setup

### 1. Environment Variables

Add your TekTravels API credentials to `.env.local`:

```env
TEKTRAVELS_API_URL=http://Sharedapi.tektravels.com/SharedData.svc/rest
TEKTRAVELS_BOOKING_API_URL=http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest
TEKTRAVELS_CLIENT_ID=your_client_id_here
TEKTRAVELS_USER_ID=your_user_id_here
TEKTRAVELS_PASSWORD=your_password_here
```

**Important:** Replace `your_client_id_here`, `your_user_id_here`, and `your_password_here` with your actual credentials.

## Architecture

### API Services

TekTravels uses two different API services:

1. **Authentication Service** (`TEKTRAVELS_API_URL`)

   - URL: `http://Sharedapi.tektravels.com/SharedData.svc/rest`
   - Used for: Authentication, token generation

2. **Booking Engine Service** (`TEKTRAVELS_BOOKING_API_URL`)
   - URL: `http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest`
   - Used for: Flight search, booking, fare quotes, SSR, etc.

The client automatically routes requests to the appropriate service based on the operation type.

1. **`src/services/tekTravelsAuth.ts`** - Authentication service with token management
2. **`src/lib/tekTravelsClient.ts`** - API client with helper methods
3. **`src/app/api/travel/auth/route.ts`** - Authentication API endpoint
4. **`src/app/api/travel/flights/search/route.ts`** - Flight search example

## Features

### ✓ Automatic Token Management

- Token is automatically fetched on first request
- Cached for 24 hours with 5-minute buffer before expiry
- Auto-refreshes when expired
- No manual token management needed

### ✓ Authentication Service

The authentication service (`src/services/tekTravelsAuth.ts`) provides:

```typescript
// Get token (from cache or by authenticating)
const token = await getTekTravelsToken();

// Clear cached token (force refresh)
clearTokenCache();

// Check if valid token exists
const isValid = hasValidToken();

// Get token expiration time
const expiresAt = getTokenExpiration();
```

### ✓ API Client

The API client (`src/lib/tekTravelsClient.ts`) provides ready-to-use methods:

```typescript
import {
	searchFlights,
	bookFlight,
	getFareQuote,
} from "@/lib/tekTravelsClient";

// Search flights
const flights = await searchFlights(searchParams);

// Get fare quote
const quote = await getFareQuote(quoteParams);

// Book flight
const booking = await bookFlight(bookingParams);
```

## Usage Examples

### From API Routes (Server-Side)

```typescript
// src/app/api/some-route/route.ts
import { searchFlights } from "@/lib/tekTravelsClient";

export async function POST(request: Request) {
	const searchParams = await request.json();

	try {
		const flights = await searchFlights(searchParams);
		return Response.json(flights);
	} catch (error) {
		return Response.json({ error: "Search failed" }, { status: 500 });
	}
}
```

### From Frontend (Client-Side)

```typescript
// Call your API route that uses the TekTravels client
const response = await fetch("/api/travel/flights/search", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		Origin: "DEL",
		Destination: "BOM",
		PreferredDepartureTime: "2025-12-15T00:00:00",
		AdultCount: 1,
		JourneyType: 1, // 1: OneWay, 2: Return
	}),
});

const data = await response.json();
```

## API Endpoints

### Authentication

#### GET /api/travel/auth

Get current authentication token and status.

**Response:**

```json
{
	"success": true,
	"token": "abc123...",
	"expiresAt": "2025-12-04T12:00:00.000Z",
	"isCached": true
}
```

#### POST /api/travel/auth

Force refresh the authentication token.

#### DELETE /api/travel/auth

Clear the cached token.

### Flight Search

#### POST /api/travel/flights/search

**Request Body:**

```json
{
	"EndUserIp": "183.83.54.192",
	"AdultCount": "1",
	"ChildCount": "0",
	"InfantCount": "0",
	"DirectFlight": "true",
	"OneStopFlight": "false",
	"JourneyType": "1",
	"PreferredAirlines": null,
	"Segments": [
		{
			"Origin": "DEL",
			"Destination": "BOM",
			"FlightCabinClass": "1",
			"PreferredDepartureTime": "2026-11-06T00:00:00",
			"PreferredArrivalTime": "2026-11-06T00:00:00"
		}
	],
	"Sources": null
}
```

**Journey Types:**

- `1` - One Way
- `2` - Return
- `3` - Multi City

**Cabin Classes:**

- `1` - All
- `2` - Economy
- `3` - Premium Economy
- `4` - Business
- `5` - Premium Business
- `6` - First

## Available TekTravels API Methods

The `tekTravelsClient.ts` includes these ready-to-use methods:

### Flight Operations

- `searchFlights()` - Search for flights
- `getFareRules()` - Get fare rules
- `getFareQuote()` - Get detailed pricing
- `bookFlight()` - Book a flight
- `getBookingDetails()` - Get booking information
- `cancelBooking()` - Cancel a booking
- `sendChangeRequest()` - Request booking changes
- `getCalendarFare()` - Get calendar fare

### Special Service Requests (SSR)

- `SSR.getSeatMap()` - Get seat map
- `SSR.getMeal()` - Get meal options
- `SSR.getBaggage()` - Get baggage options

## Error Handling

All methods include error handling:

```typescript
try {
	const result = await searchFlights(params);
	// Handle success
} catch (error) {
	if (error instanceof Error) {
		console.error("Error:", error.message);
	}
	// Handle error
}
```

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│  First Request → Authenticate → Cache Token (24h)       │
│  Subsequent Requests → Use Cached Token                 │
│  After 23h 55m → Auto Refresh → New Token               │
└─────────────────────────────────────────────────────────┘
```

## Testing

Test the authentication:

```bash
# Get token
curl http://localhost:3000/api/travel/auth

# Force refresh
curl -X POST http://localhost:3000/api/travel/auth

# Clear cache
curl -X DELETE http://localhost:3000/api/travel/auth
```

## Next Steps

1. **Add your credentials** to `.env.local`
2. **Test authentication** by calling `/api/travel/auth`
3. **Implement flight search** in your frontend
4. **Add more endpoints** as needed (fare quote, booking, etc.)

## Important Notes

- The token is cached in-memory (resets on server restart)
- For production, consider using Redis or similar for persistent caching
- Always handle errors gracefully in your frontend
- Check TekTravels API documentation for complete parameter details
- The `EndUserIp` is currently hardcoded - make it dynamic for production

## Support

For TekTravels API documentation and support:

- API Documentation: Contact TekTravels
- Base URL: http://Sharedapi.tektravels.com/SharedData.svc/rest
