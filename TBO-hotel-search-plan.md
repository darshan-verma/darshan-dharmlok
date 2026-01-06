🧠 COPILOT MASTER PROMPT (FINAL)

End-to-End Hotel Search & Availability System using TBO APIs

Objective

Build an industry-grade hotel search system (like MakeMyTrip / Booking.com) using TBO APIs.

The system must support one unified search input where users can search by:

Country name

City name

Hotel name

Search & suggestions must be instant and local (DB-driven).
Availability & pricing must be fetched only from TBO Search APIs using hotel codes.

Static API Authentication (IMPORTANT)

All static/master APIs must use Basic Auth with:

Username: TBOStaticAPITest
Password: Tbo@11530818


These credentials are used ONLY for static data endpoints.

Static Data Endpoints (Authoritative)
1️⃣ Country List API
GET http://api.tbotechnology.in/TBOHolidays_HotelAPI/CountryList


Method: GET

Auth: Basic Auth (static credentials)

Request Body: ❌ None

Purpose:

Fetch master list of countries

Store CountryCode and CountryName

2️⃣ City List API
POST http://api.tbotechnology.in/TBOHolidays_HotelAPI/CityList


Method: POST

Auth: Basic Auth (static credentials)

Request Body:

{
  "CountryCode": "IN"
}


Purpose:

Fetch cities for a given country

CountryCode must come from Country List API

Store CityCode, CityName, CountryCode

3️⃣ TBO Hotel Code List API
POST http://api.tbotechnology.in/TBOHolidays_HotelAPI/TBOHotelCodeList


Method: POST

Auth: Basic Auth (static credentials)

Request Body:

{
  "CityCode": "130443"
}


Response structure (important fields):

{
  "Hotels": [
    {
      "HotelCode": "1218373",
      "HotelName": "Airport Hotel Ramhan Palace Mahipalpur",
      "Latitude": "28.54907",
      "Longitude": "77.127326",
      "HotelRating": "FourStar",
      "Address": "...",
      "CountryName": "India",
      "CountryCode": "IN",
      "CityName": "New Delhi"
    }
  ]
}


Purpose:

Get list of hotels available in a city

This response already contains:

HotelName

CityName

CountryName

HotelCode

This allows correct mapping across all entities

4️⃣ Hotel Details API
POST http://api.tbotechnology.in/TBOHolidays_HotelAPI/HotelDetails


Request:

{
  "Hotelcodes": 1218373,
  "Language": "EN",
  "IsRoomDetailRequired": true
}


Purpose:

Fetch detailed hotel information

Used for:

Hotel detail pages

Enriching local DB

Requires HotelCode

Phase 1: Data Ingestion & Sync
Step 1: Country ingestion

Call CountryList

Store:

countryCode
countryName

Step 2: City ingestion

For each country:

Call CityList with CountryCode

Store:

cityCode
cityName
countryCode

Step 3: Hotel ingestion (CRITICAL)

For each city:

Call TBOHotelCodeList

Store directly from response:

hotelCode
hotelName
cityName
countryName
cityCode
countryCode
latitude
longitude
hotelRating
address


⚠️ This response already allows perfect matching between:

City

Country

Hotel

No guessing or joins required.

Step 4: Hotel enrichment (optional but recommended)

Call HotelDetails per hotel

Store extended details

Phase 2: Database Design
Tables
countries
countryCode (PK)
countryName

cities
cityCode (PK)
cityName
countryCode (FK)

hotels
hotelCode (PK)
hotelName
cityCode
cityName
countryCode
countryName
latitude
longitude
hotelRating
address

Phase 3: Search Index (MOST IMPORTANT)
Unified Search Index Table
search_index
------------
id
type          // 'country' | 'city' | 'hotel'
displayName
countryCode
cityCode
hotelCode     // nullable
searchText    // normalized searchable text
priority      // hotel > city > country

Insert rules

Countries → from countries

Cities → from cities

Hotels → from hotels

Example hotel entry:

type: hotel
displayName: Airport Hotel Ramhan Palace Mahipalpur
hotelCode: 1218373
cityCode: 130443
countryCode: IN
searchText: airport hotel ramhan palace mahipalpur new delhi india
priority: 3

Phase 4: Search API (Backend)
Endpoint
GET /api/search?q=<query>


Behavior:

Query only search_index

Partial / fuzzy match

Return mixed results (hotel, city, country)

Sorted by priority

Limit to 10 results

⚠️ Never call TBO APIs for autocomplete

Phase 5: User Selection Logic
If user selects COUNTRY

Show city list OR auto-select popular city

If user selects CITY

Use CityCode

Call TBOHotelCodeList

Extract hotel codes

Proceed to availability search

If user selects HOTEL

Use HotelCode

Proceed directly to availability search

Phase 6: Availability Search (Dynamic APIs)

Use agency credentials only

Always search using HotelCodes

Never use names in TBO search

Final payload example:

{
  "CheckIn": "2026-02-01",
  "CheckOut": "2026-02-03",
  "HotelCodes": "1218373",
  "GuestNationality": "IN",
  "NoOfRooms": 1,
  "PaxRooms": [
    {
      "Adults": 2,
      "Children": 0
    }
  ]
}

Architectural Rules (NON-NEGOTIABLE)

❌ No TBO calls for search suggestions

❌ No hotel name search via TBO

❌ No mixing static and agency credentials

✅ Static APIs → static creds

✅ Availability APIs → agency creds

✅ HotelCodes are the single source of truth

Cron & Sync Strategy

Country & City → monthly

Hotel list → weekly

Hotel details → daily

Search index → rebuild after sync

Final Result

Fast, Google-like search

Correct hotel mapping

Scalable backend

Industry-standard UX & architecture

END OF PROMPT