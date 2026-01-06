# TBO Hotel API Authentication & Integration

## Overview

The TBO Hotel API authentication system provides secure, token-based access to hotel search and booking services. The system automatically manages token lifecycle with caching and auto-refresh capabilities.

## Authentication Flow

```
1. Initial Request → Check Token Cache → Valid? → Use Cached Token
                           ↓ Invalid/Missing
2. Call TBO Auth API → Receive Token → Cache for 24h → Return Token
3. Auto-refresh 30min before expiry → Repeat from step 2
```

## Authentication Details

### Endpoint

```
POST http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate
```

### Credentials

```json
{
	"ClientId": "ApiIntegrationNew",
	"UserName": "Dharmlok",
	"Password": "Dharmlok@1234",
	"EndUserIp": "192.168.11.120"
}
```

### Response

```json
{
	"Status": 1,
	"TokenId": "your-token-here",
	"Error": null
}
```

## Environment Variables

Add to `.env.local`:

```env
# TekTravels API Configuration (Shared for Flights & Hotels)
TEKTRAVELS_API_URL=http://Sharedapi.tektravels.com/SharedData.svc/rest
TEKTRAVELS_HOTEL_API_URL=http://api.tektravels.com/BookingEngineService_Hotel/HotelService.svc/rest
TEKTRAVELS_CLIENT_ID=ApiIntegrationNew
TEKTRAVELS_USER_ID=Dharmlok
TEKTRAVELS_PASSWORD=Dharmlok@1234
```

## Implementation

### Server-Side (API Routes)

The authentication is handled automatically by the service layer:

```typescript
// src/services/tboAuth.ts
import { getTboToken } from "@/services/tboAuth";

// Get token (cached or fresh)
const token = await getTboToken();

// Check if token is valid
import { hasValidToken } from "@/services/tboAuth";
const isValid = hasValidToken();

// Force refresh token
import { clearTokenCache } from "@/services/tboAuth";
clearTokenCache();
const newToken = await getTboToken();
```

### Client-Side (React Components)

Use the custom hook for authentication status:

```typescript
import { useTboHotelAuth } from "@/hooks/useTboHotelAuth";

function HotelBooking() {
	const { isAuthenticated, isLoading, error, tokenExpiry, refreshToken } =
		useTboHotelAuth();

	if (isLoading) return <div>Authenticating...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!isAuthenticated) return <div>Not authenticated</div>;

	// Render booking form
	return <div>Ready to search hotels!</div>;
}
```

### Searching Hotels

```typescript
import { searchHotelsWithAuth } from "@/hooks/useTboHotelAuth";

const results = await searchHotelsWithAuth({
	checkIn: "2026-01-15",
	checkOut: "2026-01-17",
	hotelCodes: "215869,215870",
	guestNationality: "IN",
	rooms: [
		{
			adults: 2,
			children: 1,
			childrenAges: [8],
		},
	],
	filters: {
		refundable: false,
		mealType: "All",
		minPrice: 1000,
		maxPrice: 5000,
	},
});
```

## API Endpoints

### Check Authentication

```
GET /api/travel/hotel/auth
GET /api/travel/hotel/auth?refresh=true
```

Response:

```json
{
	"success": true,
	"hasValidToken": true,
	"token": "abc123...",
	"tokenLength": 150,
	"expiresAt": "2026-01-07T12:00:00Z",
	"message": "Token retrieved successfully"
}
```

### Force Refresh Token

```
POST /api/travel/hotel/auth
```

### Search Hotels

```
POST /api/travel/hotel/search
```

Request body:

```json
{
	"checkIn": "2026-01-15",
	"checkOut": "2026-01-17",
	"hotelCodes": "215869,215870",
	"guestNationality": "IN",
	"rooms": [
		{
			"adults": 2,
			"children": 0,
			"childrenAges": []
		}
	],
	"isDetailedResponse": false,
	"filters": {
		"refundable": false,
		"mealType": "All"
	}
}
```

## Token Management Features

### ✅ Automatic Caching

- Token is cached in memory for 24 hours
- Reduces API calls and improves performance
- No database required for simple caching

### ✅ Auto-Refresh

- Token refreshes automatically 30 minutes before expiry
- Seamless experience with no interruptions
- Configurable refresh timing

### ✅ Error Handling

- Automatic retry on authentication failure
- Clear error messages
- Graceful degradation

### ✅ Security

- Credentials stored in environment variables
- Token not exposed in frontend
- Server-side authentication only

## Testing

### Test Authentication

```bash
node test-tbo-hotel-auth.js
```

Expected output:

```
🔐 Testing TBO Hotel API Authentication...
✅ Authentication Response:
{
  "Status": 1,
  "TokenId": "your-token-here"
}
🎉 SUCCESS! Token received
📝 This token is valid for 24 hours
```

### Test via API

```bash
# Check auth status
curl http://localhost:3000/api/travel/hotel/auth

# Force refresh
curl -X POST http://localhost:3000/api/travel/hotel/auth

# Search hotels
curl -X POST http://localhost:3000/api/travel/hotel/search \
  -H "Content-Type: application/json" \
  -d '{
    "checkIn": "2026-01-15",
    "checkOut": "2026-01-17",
    "hotelCodes": "215869",
    "guestNationality": "IN",
    "rooms": [{"adults": 2, "children": 0, "childrenAges": []}]
  }'
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ HotelBooking │  │ SearchResults│  │ BookingForm  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         └─────────────────┴─────────────────┘           │
│                           │                              │
│                  ┌────────▼────────┐                     │
│                  │ useTboHotelAuth │                     │
│                  └────────┬────────┘                     │
└─────────────────────────────┬──────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────┐
│                     API Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  /auth       │  │  /search     │  │  /details    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         └─────────────────┴─────────────────┘           │
│                           │                              │
│                  ┌────────▼────────┐                     │
│                  │ tboHotelClient  │                     │
│                  └────────┬────────┘                     │
└─────────────────────────────┬──────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────┐
│                   Service Layer                         │
│                  ┌────────────────┐                      │
│                  │    tboAuth     │                      │
│                  │  (Shared Auth) │                      │
│                  └────────┬───────┘                      │
│                           │                              │
│                  ┌────────▼────────┐                     │
│                  │  Token Cache    │                     │
│                  │  (In-Memory)    │                     │
│                  └─────────────────┘                     │
└─────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   TBO API Server  │
                    │ (Shared & Hotel)  │
                    └───────────────────┘
```

## Best Practices

1. **Never expose credentials** - Always use environment variables
2. **Use server-side authentication** - Keep tokens on the server
3. **Cache tokens appropriately** - Avoid unnecessary API calls
4. **Handle errors gracefully** - Provide user-friendly messages
5. **Monitor token expiry** - Auto-refresh before expiration
6. **Log authentication events** - Track token lifecycle for debugging

## Troubleshooting

### Authentication Failed

- Check environment variables are set correctly
- Verify API endpoint is accessible
- Confirm credentials are valid

### Token Expired

- Token should auto-refresh
- Manually refresh: `POST /api/travel/hotel/auth`
- Check system time is synchronized

### Search Not Working

- Ensure authentication is successful first
- Verify hotel codes are valid
- Check date format (YYYY-MM-DD)
- Validate room configuration

## Next Steps

1. ✅ Authentication implemented
2. ✅ Token caching and auto-refresh
3. ✅ Hotel search API integration
4. 🔄 City/destination search
5. 🔄 Hotel details and room availability
6. 🔄 Booking flow implementation

## Support

For issues or questions:

- Check API documentation: TBO Hotel API docs
- Review error logs in console
- Test with provided test script
- Contact TBO support if API issues persist
