# TBO Hotel Search System - Implementation Guide

## Overview

This system implements a comprehensive hotel search solution using TBO APIs, following industry best practices like MakeMyTrip and Booking.com. Users can search by country, city, or hotel name with instant autocomplete results.

## Architecture

### Data Flow

1. **Static Data Sync** → TBO Static APIs → Local Database
2. **Search** → Local Database (instant autocomplete)
3. **Availability** → TBO Dynamic APIs (real-time pricing)

### Key Components

#### Database Models (Prisma)

- `TboCountry` - Master list of countries
- `TboCity` - Cities mapped to countries
- `TboHotel` - Hotels with full details
- `TboSearchIndex` - Unified search index for fast autocomplete

#### API Clients

- `tboStaticClient.ts` - Handles static data APIs (countries, cities, hotels)
- `tboHotelClient.ts` - Handles dynamic APIs (search, availability, booking)

#### API Endpoints

**Data Sync Endpoints:**

- `POST /api/travel/tbo-sync/countries` - Sync countries
- `POST /api/travel/tbo-sync/cities` - Sync cities
- `POST /api/travel/tbo-sync/hotels` - Sync hotels
- `POST /api/travel/tbo-sync/search-index` - Build search index
- `POST /api/travel/tbo-sync/full-sync` - Complete sync process
- `GET /api/travel/tbo-sync/status` - Check sync status

**Search & Availability Endpoints:**

- `GET /api/travel/hotel-search?q=query` - Autocomplete search
- `POST /api/travel/hotel-search` - Get details for selection
- `POST /api/travel/hotel/get-hotel-codes` - Convert selection to hotel codes
- `POST /api/travel/hotel/search` - Get hotel availability & pricing

## Setup Instructions

### 1. Initial Data Sync

First, check the system status:

```bash
curl http://localhost:3000/api/travel/tbo-sync/status
```

Run the full sync (this will take some time):

```bash
curl -X POST http://localhost:3000/api/travel/tbo-sync/full-sync \
  -H "Content-Type: application/json" \
  -d '{
    "syncCountries": true,
    "syncCities": true,
    "syncHotels": true,
    "buildIndex": true
  }'
```

**Alternative: Step-by-step sync**

```bash
# Step 1: Sync countries
curl -X POST http://localhost:3000/api/travel/tbo-sync/countries

# Step 2: Sync cities (all countries)
curl -X POST http://localhost:3000/api/travel/tbo-sync/cities

# Step 3: Sync cities for specific country (optional)
curl -X POST http://localhost:3000/api/travel/tbo-sync/cities \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "IN"}'

# Step 4: Sync hotels
curl -X POST http://localhost:3000/api/travel/tbo-sync/hotels

# Step 5: Build search index
curl -X POST http://localhost:3000/api/travel/tbo-sync/search-index
```

### 2. Incremental Sync for Specific Country

To sync only India, for example:

```bash
curl -X POST http://localhost:3000/api/travel/tbo-sync/full-sync \
  -H "Content-Type: application/json" \
  -d '{
    "syncCountries": false,
    "syncCities": true,
    "syncHotels": true,
    "buildIndex": true,
    "countryCode": "IN"
  }'
```

## Usage Examples

### 1. Autocomplete Search

Search for hotels, cities, or countries:

```bash
# Search for anything containing "delhi"
curl "http://localhost:3000/api/travel/hotel-search?q=delhi&limit=10"

# Search only for hotels
curl "http://localhost:3000/api/travel/hotel-search?q=taj&type=hotel&limit=10"

# Search only for cities
curl "http://localhost:3000/api/travel/hotel-search?q=mumbai&type=city&limit=10"
```

**Response:**

```json
{
	"success": true,
	"query": "delhi",
	"count": 10,
	"results": [
		{
			"id": "...",
			"type": "city",
			"name": "New Delhi, India",
			"countryCode": "IN",
			"cityCode": "130443"
		},
		{
			"id": "...",
			"type": "hotel",
			"name": "Taj Palace New Delhi",
			"countryCode": "IN",
			"cityCode": "130443",
			"hotelCode": "123456"
		}
	]
}
```

### 2. Get Details for Selection

After user selects a result:

```bash
# Get city details with hotels
curl -X POST http://localhost:3000/api/travel/hotel-search \
  -H "Content-Type: application/json" \
  -d '{
    "type": "city",
    "code": "130443"
  }'

# Get specific hotel details
curl -X POST http://localhost:3000/api/travel/hotel-search \
  -H "Content-Type: application/json" \
  -d '{
    "type": "hotel",
    "code": "1218373"
  }'
```

### 3. Convert Selection to Hotel Codes

Get hotel codes for availability search:

```bash
# Get hotels in a city
curl -X POST http://localhost:3000/api/travel/hotel/get-hotel-codes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "city",
    "code": "130443",
    "limit": 50
  }'

# Single hotel
curl -X POST http://localhost:3000/api/travel/hotel/get-hotel-codes \
  -H "Content-Type: application/json" \
  -d '{
    "type": "hotel",
    "code": "1218373"
  }'
```

**Response:**

```json
{
	"success": true,
	"type": "city",
	"code": "130443",
	"hotelCodes": "1218373,1234567,1234568",
	"count": 3
}
```

### 4. Search Hotel Availability

Search for available rooms with pricing:

```bash
curl -X POST http://localhost:3000/api/travel/hotel/search \
  -H "Content-Type: application/json" \
  -d '{
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
    ],
    "isDetailedResponse": true
  }'
```

## Frontend Integration Flow

### 1. Search Input Component

```typescript
// Autocomplete search as user types
const searchHotels = async (query: string) => {
	const response = await fetch(
		`/api/travel/hotel-search?q=${encodeURIComponent(query)}&limit=10`
	);
	const data = await response.json();
	return data.results;
};
```

### 2. Handle User Selection

```typescript
const handleSelection = async (selection: any) => {
	if (selection.type === "hotel") {
		// Direct hotel selection - ready for availability search
		setSelectedHotelCode(selection.hotelCode);
	} else if (selection.type === "city") {
		// City selection - get hotel codes
		const response = await fetch("/api/travel/hotel/get-hotel-codes", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				type: "city",
				code: selection.cityCode,
				limit: 50,
			}),
		});
		const data = await response.json();
		setSelectedHotelCodes(data.hotelCodes);
	} else if (selection.type === "country") {
		// Show popular cities or get hotel codes
		// ... handle country selection
	}
};
```

### 3. Search Availability

```typescript
const searchAvailability = async (hotelCodes: string) => {
	const response = await fetch("/api/travel/hotel/search", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			checkIn: "2026-02-01",
			checkOut: "2026-02-03",
			hotelCodes,
			guestNationality: "IN",
			rooms: [{ adults: 2, children: 0, childrenAges: [] }],
			isDetailedResponse: true,
		}),
	});
	return await response.json();
};
```

## Maintenance & Sync Schedule

### Recommended Cron Jobs

**Monthly:** Sync countries

```bash
0 0 1 * * curl -X POST http://localhost:3000/api/travel/tbo-sync/countries
```

**Weekly:** Sync cities and hotels

```bash
0 2 * * 0 curl -X POST http://localhost:3000/api/travel/tbo-sync/full-sync \
  -H "Content-Type: application/json" \
  -d '{"syncCountries": false, "syncCities": true, "syncHotels": true, "buildIndex": true}'
```

**Daily:** Rebuild search index

```bash
0 3 * * * curl -X POST http://localhost:3000/api/travel/tbo-sync/search-index
```

## Authentication

### Static API Credentials (for sync)

- Username: `TBOStaticAPITest`
- Password: `Tbo@11530818`
- Used for: Countries, Cities, Hotel Code Lists

### Agency Credentials (for availability)

- Configured in environment variables
- Used for: Hotel search, availability, booking
- Managed by `tboAuth.ts`

## Troubleshooting

### Check System Status

```bash
curl http://localhost:3000/api/travel/tbo-sync/status
```

### Re-sync Specific Country

```bash
curl -X POST http://localhost:3000/api/travel/tbo-sync/cities \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "IN"}'
```

### Rebuild Search Index

```bash
curl -X POST http://localhost:3000/api/travel/tbo-sync/search-index
```

## Performance Considerations

1. **Search is instant** - All searches use local database index
2. **Availability is real-time** - Only availability/pricing calls TBO
3. **Hotel codes are cached** - Pre-fetched during sync
4. **Limit hotel codes** - TBO API has limits on number of hotels per search
5. **Pagination** - For cities with many hotels, use pagination

## Best Practices

✅ **DO:**

- Always search using hotel codes
- Use local database for autocomplete
- Sync data regularly
- Limit number of hotels per availability search (max 50-100)
- Cache hotel codes for popular cities

❌ **DON'T:**

- Never call TBO for autocomplete/suggestions
- Don't use hotel names in availability search
- Don't mix static and agency credentials
- Don't sync too frequently (rate limits)

## Database Indexes

All critical fields are indexed for fast queries:

- `searchText` - Primary search field
- `type` + `priority` - Result ordering
- `countryCode`, `cityCode`, `hotelCode` - Lookups
- Unique constraints on codes prevent duplicates

## API Rate Limits

Be mindful of TBO API rate limits:

- Static APIs: Used during sync only
- Dynamic APIs: Used for every search
- Implement caching and request throttling
