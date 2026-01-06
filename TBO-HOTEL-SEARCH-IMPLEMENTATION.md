# TBO Hotel Search System - Implementation Guide

## Overview

This system implements a Google-like hotel search experience using TBO APIs. Users can search for hotels by **country**, **city**, or **hotel name** with instant autocomplete suggestions.

## Architecture

### Phase 1: Data Ingestion (Static API)

- **Static API Credentials**: `TBOStaticAPITest` / `Tbo@11530818`
- Syncs master data: Countries → Cities → Hotels
- Builds unified search index for fast lookups

### Phase 2: Search (Local Database)

- All searches happen against local database
- No TBO API calls during search/autocomplete
- Results sorted by priority: Hotels > Cities > Countries

### Phase 3: Availability Search (Dynamic API)

- Uses agency credentials (from env)
- Searches by `HotelCodes` only (never by name)
- Real-time availability and pricing

---

## Setup Instructions

### 1. Update Prisma Schema

The schema has been updated with these models:

- `TboCountry` - Country master data
- `TboCity` - City master data
- `TboHotel` - Hotel master data with location & details
- `TboSearchIndex` - Unified search index for autocomplete

**Run Prisma migration:**

```bash
npx prisma generate
npx prisma db push
```

### 2. Initial Data Sync

#### Option A: Full Sync (All Countries)

```bash
# Sync everything in sequence
curl -X POST http://localhost:3000/api/travel/tbo-sync/full
```

**Warning**: This will sync ALL countries and can take 30+ minutes. Use for production.

#### Option B: Partial Sync (Recommended for Testing)

```bash
# 1. Sync countries
curl -X POST http://localhost:3000/api/travel/tbo-sync/countries

# 2. Sync cities for specific country (e.g., India)
curl -X POST http://localhost:3000/api/travel/tbo-sync/cities \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "IN"}'

# 3. Sync hotels for specific city (e.g., Delhi)
curl -X POST http://localhost:3000/api/travel/tbo-sync/hotels \
  -H "Content-Type: application/json" \
  -d '{"cityCode": "130443", "enrichDetails": false}'

# 4. Build search index
curl -X POST http://localhost:3000/api/travel/tbo-sync/search-index
```

### 3. Sync Schedule (Production)

Set up cron jobs or scheduled tasks:

- **Countries**: Monthly
- **Cities**: Monthly
- **Hotels**: Weekly
- **Search Index**: After each hotel sync

---

## API Endpoints

### Search APIs

#### 1. Unified Hotel Search

**GET** `/api/travel/hotel-search?q=<query>&limit=10&type=hotel`

**Query Parameters:**

- `q` (required): Search query
- `limit` (optional): Max results (default: 10)
- `type` (optional): Filter by type (`country`, `city`, `hotel`)

**Example Request:**

```bash
curl "http://localhost:3000/api/travel/hotel-search?q=delhi&limit=10"
```

**Example Response:**

```json
{
	"success": true,
	"query": "delhi",
	"count": 3,
	"results": [
		{
			"id": "...",
			"type": "hotel",
			"name": "Hotel Taj Palace Delhi",
			"countryCode": "IN",
			"cityCode": "130443",
			"hotelCode": "1218373"
		},
		{
			"id": "...",
			"type": "city",
			"name": "New Delhi, India",
			"countryCode": "IN",
			"cityCode": "130443"
		}
	]
}
```

#### 2. Get Selection Details

**POST** `/api/travel/hotel-search`

Get detailed information about a selected country, city, or hotel.

**Request Body:**

```json
{
	"type": "city",
	"code": "130443"
}
```

**Response:** Returns detailed object with relations (cities for country, hotels for city, etc.)

#### 3. Get Hotel Codes for Availability Search

**POST** `/api/travel/hotel/get-hotel-codes`

Convert user selection to hotel codes for availability search.

**Request Body:**

```json
{
	"type": "city",
	"code": "130443",
	"limit": 50
}
```

**Response:**

```json
{
	"success": true,
	"type": "city",
	"code": "130443",
	"hotelCodes": "1218373,1234567,7891011",
	"count": 3
}
```

#### 4. Hotel Availability Search

**POST** `/api/travel/hotel/search`

Search for hotel availability using hotel codes.

**Request Body:**

```json
{
	"checkIn": "2026-02-01",
	"checkOut": "2026-02-03",
	"hotelCodes": "1218373,1234567",
	"guestNationality": "IN",
	"rooms": [
		{
			"adults": 2,
			"children": 0,
			"childrenAges": []
		}
	]
}
```

---

## Frontend Integration Flow

### Step 1: Search Input with Autocomplete

```typescript
// User types in search box
const searchQuery = "delhi";

// Call search API
const response = await fetch(
	`/api/travel/hotel-search?q=${encodeURIComponent(searchQuery)}&limit=10`
);
const { results } = await response.json();

// Display results in dropdown
// Each result has: type, name, countryCode, cityCode, hotelCode
```

### Step 2: User Selects from Autocomplete

```typescript
// User clicks on a result
const selectedResult = {
	type: "city", // or "country" or "hotel"
	name: "New Delhi, India",
	cityCode: "130443",
	countryCode: "IN",
};

// If hotel selected, you already have hotelCode
// If city/country selected, get hotel codes:
const codesResponse = await fetch("/api/travel/hotel/get-hotel-codes", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		type: selectedResult.type,
		code:
			selectedResult.type === "hotel"
				? selectedResult.hotelCode
				: selectedResult.cityCode || selectedResult.countryCode,
	}),
});

const { hotelCodes } = await codesResponse.json();
```

### Step 3: Search for Availability

```typescript
// User enters dates and rooms
const searchParams = {
	checkIn: "2026-02-01",
	checkOut: "2026-02-03",
	hotelCodes, // From step 2
	guestNationality: "IN",
	rooms: [{ adults: 2, children: 0, childrenAges: [] }],
};

const availabilityResponse = await fetch("/api/travel/hotel/search", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(searchParams),
});

const { data: hotels } = await availabilityResponse.json();
// Display available hotels with pricing
```

---

## Data Sync APIs (Admin Only)

### Individual Sync Endpoints

#### Sync Countries

**POST** `/api/travel/tbo-sync/countries`

Syncs all countries from TBO.

#### Sync Cities

**POST** `/api/travel/tbo-sync/cities`

**Body (optional):**

```json
{
	"countryCode": "IN" // Sync specific country, or omit for all
}
```

#### Sync Hotels

**POST** `/api/travel/tbo-sync/hotels`

**Body (optional):**

```json
{
	"cityCode": "130443", // Sync specific city, or omit for all
	"limit": 10, // Limit number of cities
	"enrichDetails": true // Fetch extended hotel details
}
```

#### Build Search Index

**POST** `/api/travel/tbo-sync/search-index`

Rebuilds search index from synced data.

### Full Sync Endpoint

**POST** `/api/travel/tbo-sync/full`

Orchestrates complete sync: Countries → Cities → Hotels → Search Index

**Body (optional):**

```json
{
	"countryCodes": ["IN", "AE"], // Specific countries, or omit for all
	"cityLimit": 10, // Limit cities to sync
	"enrichHotelDetails": false // Fetch extended details
}
```

---

## Important Notes

### ✅ DO's

- Always search using the `/hotel-search` endpoint (local DB)
- Always use `HotelCodes` for availability searches
- Use full sync for production initial setup
- Schedule regular syncs for data freshness

### ❌ DON'Ts

- Never call TBO static APIs from frontend
- Never search TBO by hotel name
- Never mix static and agency credentials
- Never skip search index rebuild after data sync

---

## Testing

### Test Search

```bash
# Search for hotels in Delhi
curl "http://localhost:3000/api/travel/hotel-search?q=delhi"

# Search only hotels
curl "http://localhost:3000/api/travel/hotel-search?q=taj&type=hotel"
```

### Test Full Flow

```bash
# 1. Search for a city
curl "http://localhost:3000/api/travel/hotel-search?q=mumbai"

# 2. Get hotel codes for that city
curl -X POST http://localhost:3000/api/travel/hotel/get-hotel-codes \
  -H "Content-Type: application/json" \
  -d '{"type":"city","code":"130444"}'

# 3. Search for availability
curl -X POST http://localhost:3000/api/travel/hotel/search \
  -H "Content-Type: application/json" \
  -d '{
    "checkIn": "2026-03-01",
    "checkOut": "2026-03-03",
    "hotelCodes": "1234567,7891011",
    "guestNationality": "IN",
    "rooms": [{"adults": 2, "children": 0, "childrenAges": []}]
  }'
```

---

## Troubleshooting

### No search results

- Verify data is synced: Check DB for records in `TboCountry`, `TboCity`, `TboHotel`
- Rebuild search index: `POST /api/travel/tbo-sync/search-index`

### Slow search

- Add indexes to `TboSearchIndex.searchText` (already configured)
- Reduce search limit

### Sync failures

- Check TBO static API credentials
- Verify network connectivity to `api.tbotechnology.in`
- Check logs for specific error messages

---

## Files Created

### Database Models

- `/prisma/schema.prisma` - Added TBO models

### Libraries

- `/src/lib/tboStaticClient.ts` - TBO static API client

### API Routes

- `/src/app/api/travel/hotel-search/route.ts` - Unified search
- `/src/app/api/travel/hotel/get-hotel-codes/route.ts` - Helper for availability search
- `/src/app/api/travel/tbo-sync/countries/route.ts` - Country sync
- `/src/app/api/travel/tbo-sync/cities/route.ts` - City sync
- `/src/app/api/travel/tbo-sync/hotels/route.ts` - Hotel sync
- `/src/app/api/travel/tbo-sync/search-index/route.ts` - Search index builder
- `/src/app/api/travel/tbo-sync/full/route.ts` - Full sync orchestration

---

## Next Steps

1. **Run Prisma migration** to create database tables
2. **Initial data sync** using one of the sync endpoints
3. **Test search** endpoint with sample queries
4. **Integrate frontend** search component with autocomplete
5. **Set up cron jobs** for regular data syncing
6. **Add authentication** to admin sync endpoints (recommended)

---

## Support

For issues or questions:

1. Check the plan document: `TBO-hotel-search-plan.md`
2. Review TBO API documentation
3. Check application logs for detailed error messages
