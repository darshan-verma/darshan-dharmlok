# TekTravels Integration - Quick Start

## ✅ What's Been Set Up

### 1. Authentication System

- **Location**: `src/services/tekTravelsAuth.ts`
- **Features**:
  - Automatic token fetching from TekTravels API
  - 24-hour token caching with auto-refresh
  - Token expiry management with 5-minute buffer

### 2. API Client

- **Location**: `src/lib/tekTravelsClient.ts`
- **Includes methods for**:
  - Flight search
  - Fare quotes
  - Booking
  - Cancellation
  - SSR (Seat, Meal, Baggage)

### 3. API Routes

- **`/api/travel/auth`** - Token management endpoint
- **`/api/travel/flights/search`** - Flight search endpoint

### 4. Frontend Hook

- **Location**: `src/hooks/useTekTravelsFlights.ts`
- Ready-to-use React hook for flight search

## 🚀 Getting Started

### Step 1: Add Your Credentials

Edit `.env.local` and replace these values with your actual TekTravels credentials:

```env
TEKTRAVELS_API_URL=http://Sharedapi.tektravels.com/SharedData.svc/rest
TEKTRAVELS_BOOKING_API_URL=http://api.tektravels.com/BookingEngineService_Air/AirService.svc/rest
TEKTRAVELS_CLIENT_ID=your_actual_client_id
TEKTRAVELS_USER_ID=your_actual_user_id
TEKTRAVELS_PASSWORD=your_actual_password
```

### Step 2: Test Authentication

Restart your dev server and test:

```bash
# Restart dev server
npm run dev

# Test authentication (in another terminal)
curl http://localhost:3000/api/travel/auth
```

You should see a response with a token:

```json
{
	"success": true,
	"token": "abc123...",
	"expiresAt": "2025-12-04T12:00:00.000Z",
	"isCached": false
}
```

### Step 3: Use in Your Code

#### Option A: From API Routes (Server-Side)

```typescript
import { searchFlights } from "@/lib/tekTravelsClient";

export async function POST(request: Request) {
	const result = await searchFlights({
		Origin: "DEL",
		Destination: "BOM",
		// ... other params
	});
	return Response.json(result);
}
```

#### Option B: From Frontend Components

```typescript
import { useTekTravelsFlights } from "@/hooks/useTekTravelsFlights";

function MyComponent() {
	const { searchFlights, loading, flights } = useTekTravelsFlights();

	const handleSearch = async () => {
		await searchFlights({
			origin: "DEL",
			destination: "BOM",
			departureDate: "2025-12-15T00:00:00",
			adults: 1,
		});
	};

	// Use loading and flights state
}
```

## 📁 Files Created

```
.env.local                                    # Updated with API credentials
.env.example                                  # Template for environment variables
TEKTRAVELS_INTEGRATION.md                    # Full documentation
TEKTRAVELS_QUICKSTART.md                     # This file

src/
├── services/
│   └── tekTravelsAuth.ts                    # Authentication service
├── lib/
│   └── tekTravelsClient.ts                  # API client with helper methods
├── hooks/
│   └── useTekTravelsFlights.ts              # React hook for frontend
└── app/
    └── api/
        └── travel/
            ├── auth/
            │   └── route.ts                  # Auth endpoint
            └── flights/
                └── search/
                    └── route.ts              # Flight search endpoint
```

## 🔑 Key Features

- ✅ **Zero manual token management** - Handles auth automatically
- ✅ **Smart caching** - Token cached for 24 hours
- ✅ **Auto-refresh** - Regenerates before expiry
- ✅ **Multi-service support** - Handles both authentication and booking APIs
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Error handling** - Comprehensive error messages
- ✅ **Ready-to-use** - Example implementations included

## 📖 Next Steps

1. **Add credentials** to `.env.local`
2. **Test authentication** endpoint
3. **Review** `TEKTRAVELS_INTEGRATION.md` for detailed docs
4. **Implement** flight search in your booking flow
5. **Add more endpoints** as needed (booking, cancellation, etc.)

## 🆘 Need Help?

- Check `TEKTRAVELS_INTEGRATION.md` for full documentation
- Review example code in `useTekTravelsFlights.ts`
- Test endpoints using the curl commands above

## 📝 Important Notes

- Token is cached in-memory (resets on server restart)
- For production, consider Redis for persistent token storage
- The `EndUserIp` is currently hardcoded - make dynamic for production
- Refer to TekTravels API documentation for complete parameter details
