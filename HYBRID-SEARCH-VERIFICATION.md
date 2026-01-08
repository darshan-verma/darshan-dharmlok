# Hotel Hybrid Search Verification

## Overview
The hybrid search combines:
1. **Local Database Search** - Fast autocomplete from local DB
2. **TBO Affiliate API** - Real-time availability search
3. **TBO Static API** - Hotel details with images and amenities

## Credentials Configuration

### ✅ Static API (Hotel Details) - WORKING
- **Username**: `TBOStaticAPITest`
- **Password**: `Tbo@11530818`
- **Endpoint**: `http://api.tbotechnology.in/TBOHolidays_HotelAPI/HotelDetails`
- **Status**: ✅ Confirmed working by user
- **Location**: `src/lib/tboStaticClient.ts` (hardcoded) and `src/lib/tboHotelClient.ts` (with env fallback)

### ⚠️ Affiliate API (Hotel Search) - NEEDS VERIFICATION
- **Username**: From `TEKTRAVELS_USER_ID` env variable (default: `Dharmlok`)
- **Password**: From `TEKTRAVELS_PASSWORD` env variable (default: `Dharmlok@123`)
- **Endpoint**: `https://affiliate.tektravels.com/HotelAPI/Search`
- **Status**: ⚠️ Needs verification
- **Location**: `src/lib/tboHotelClient.ts` - `getAffiliateCredentials()` function

## Hybrid Search Flow

### Step 1: Location Search (Local DB)
**Endpoint**: `GET /api/travel/hotel-search?q=<location>`
- Searches local database (`tboSearchIndex` table)
- Returns cities, countries, and hotels matching the query
- **Status**: ✅ Working (uses Prisma, no external API)

### Step 2: Get Hotel Codes for City
**Endpoint**: `POST /api/travel/hotel-search`
```json
{
  "type": "city",
  "code": "130443"
}
```
- Fetches all hotels for the selected city from local DB
- Returns hotel codes as comma-separated string
- **Status**: ✅ Working (uses Prisma)

### Step 3: Hotel Availability Search (TBO Affiliate API)
**Endpoint**: `POST /api/travel/hotel/search`
- Uses hotel codes from Step 2
- Calls TBO Affiliate API with Basic Auth
- Returns available rooms and pricing
- **Status**: ⚠️ Depends on `TEKTRAVELS_USER_ID` and `TEKTRAVELS_PASSWORD` env vars

### Step 4: Hotel Details (TBO Static API)
**Endpoint**: `GET /api/travel/hotel/details?hotelCode=<code>`
- Fetches detailed hotel information (name, images, amenities, etc.)
- Uses Static API credentials
- **Status**: ✅ Confirmed working

## Testing the Hybrid Search

### Manual Test Flow

1. **Search for a location** (e.g., "Delhi")
   ```bash
   curl "http://localhost:3000/api/travel/hotel-search?q=delhi&limit=10"
   ```

2. **Get hotels for a city** (use cityCode from step 1)
   ```bash
   curl -X POST http://localhost:3000/api/travel/hotel-search \
     -H "Content-Type: application/json" \
     -d '{"type": "city", "code": "130443"}'
   ```

3. **Search hotel availability** (use hotel codes from step 2)
   ```bash
   curl -X POST http://localhost:3000/api/travel/hotel/search \
     -H "Content-Type: application/json" \
     -d '{
       "checkIn": "2025-01-15",
       "checkOut": "2025-01-17",
       "hotelCodes": "1218373,1234567",
       "guestNationality": "IN",
       "rooms": [{"adults": 2, "children": 0, "childrenAges": []}],
       "isDetailedResponse": true
     }'
   ```

4. **Get hotel details** (use hotelCode from step 3)
   ```bash
   curl "http://localhost:3000/api/travel/hotel/details?hotelCode=1218373&language=EN&isRoomDetailRequired=false"
   ```

### Frontend Test
1. Navigate to `/travel-portal/hotel-search`
2. Search for a location (e.g., "Delhi")
3. Select a city from suggestions
4. Enter check-in/check-out dates
5. Click "Search Hotels"
6. Verify:
   - ✅ Hotels are displayed with availability
   - ✅ Hotel names and images load (from Static API)
   - ✅ Prices and room details are shown

## Environment Variables Required

Make sure these are set in `.env.local`:

```env
# Affiliate API (for hotel search/availability)
TEKTRAVELS_USER_ID=Dharmlok
TEKTRAVELS_PASSWORD=Dharmlok@123

# Static API (for hotel details) - Already hardcoded, but can override
TBO_STATIC_API_USERNAME=TBOStaticAPITest
TBO_STATIC_API_PASSWORD=Tbo@11530818
```

## Current Status

- ✅ **Hotel Details API**: Working with Static API credentials
- ✅ **Local DB Search**: Working (Prisma queries)
- ⚠️ **Hotel Availability Search**: Needs verification of Affiliate API credentials
- ✅ **Code Implementation**: All endpoints properly implemented

## Next Steps

1. Verify `TEKTRAVELS_USER_ID` and `TEKTRAVELS_PASSWORD` are set correctly
2. Test the full hybrid search flow from frontend
3. Check server logs for any authentication errors during hotel search
4. If hotel search fails, verify Affiliate API credentials are correct
