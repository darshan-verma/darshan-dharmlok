# Flight and Hotel Booking System - Complete Documentation

This document provides comprehensive documentation of the flight and hotel booking system implemented in this Next.js project. Use this document to understand the complete system architecture, API endpoints, data models, UI components, and user flows for implementing the same system in a Flutter application.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Flight Booking System](#flight-booking-system)
3. [Hotel Booking System](#hotel-booking-system)
4. [Database Schema](#database-schema)
5. [Authentication & Token Management](#authentication--token-management)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Data Models & Type Definitions](#data-models--type-definitions)
8. [UI Components & User Flows](#ui-components--user-flows)
9. [External Service Integration](#external-service-integration)
10. [Caching & Performance](#caching--performance)
11. [Error Handling](#error-handling)
12. [SSR (Special Service Requests)](#ssr-special-service-requests)

---

## System Architecture Overview

### Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (via Prisma ORM)
- **External APIs**: 
  - TBO (Travel Booking Online) - Flight & Hotel APIs
  - AIRiQ - Flight API (alternative provider)
- **Authentication**: NextAuth.js
- **State Management**: React Hooks (useState, useEffect)
- **UI Library**: shadcn/ui components

### Architecture Pattern
- **Frontend**: React Server Components (RSC) + Client Components
- **Backend**: Next.js API Routes (Route Handlers)
- **Data Layer**: Prisma ORM with MongoDB
- **External API Integration**: Dedicated client libraries for each provider

### Key Design Principles
1. **Dual Provider Support**: Flight search queries both TBO and AIRiQ simultaneously
2. **Caching Strategy**: Client-side caching for search results and token management
3. **Unified Response Format**: AIRiQ responses converted to TBO-compatible format
4. **Progressive Enhancement**: SSR (seats, meals, baggage) loaded after flight selection
5. **Error Resilience**: Graceful degradation when one provider fails

---

## Flight Booking System

### Overview
The flight booking system supports:
- **Trip Types**: One-way, Round-trip, Multi-city
- **Providers**: TBO (primary) and AIRiQ (secondary)
- **Cabin Classes**: Economy, Premium Economy, Business, Premium Business, First
- **Passenger Types**: Adults, Children, Infants
- **Additional Services**: Seats, Meals, Baggage, Special Services

### User Flow

```
1. Flight Search
   ├── User enters origin, destination, dates, passengers
   ├── System queries TBO and AIRiQ simultaneously
   ├── Results merged and displayed
   └── Results cached for back navigation

2. Flight Selection
   ├── User selects a flight
   ├── System fetches detailed fare quote
   ├── System fetches fare rules
   ├── System fetches SSR options (if available)
   └── User proceeds to booking page

3. Booking Page
   ├── Display flight details
   ├── Show fare breakdown
   ├── Display fare rules
   ├── Show SSR selection (seats, meals, baggage)
   ├── Collect passenger details
   └── Submit booking

4. Booking Confirmation
   ├── API processes booking
   ├── Returns PNR and booking ID
   └── Display confirmation
```

### API Routes

#### 1. Flight Search
**Endpoint**: `POST /api/travel/flights/search`

**Request Body**:
```typescript
{
  Origin: string;                    // Airport code (e.g., "DEL")
  Destination: string;                // Airport code (e.g., "BOM")
  PreferredDepartureTime: string;    // ISO format: "2025-01-15T00:00:00"
  ReturnPreferredDepartureTime?: string; // For round-trip
  JourneyType: "1" | "2" | "3";      // 1=OneWay, 2=Return, 3=MultiCity
  AdultCount: string;                 // "1", "2", etc.
  ChildCount: string;                 // "0", "1", etc.
  InfantCount: string;                // "0", "1", etc.
  FlightCabinClass?: string;          // "1"=Economy, "4"=Business, etc.
  Segments?: Array<{                  // For multi-city
    Origin: string;
    Destination: string;
    PreferredDepartureTime: string;
  }>;
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    Response: {
      TraceId: string;               // Required for subsequent API calls
      Results: Array<FlightResult[]>; // Array of flight arrays (one per segment)
      TboResults: Array<FlightResult[]>;
      AiriqResults: Array<FlightResult[]>;
    };
  };
  sources: {
    tbo: boolean;
    airiq: boolean;
  };
  stats: {
    tboFlightCount: number;
    airiqFlightCount: number;
    totalFlightCount: number;
  };
}
```

**Key Implementation Details**:
- Validates dates are not in the past
- Formats dates to `yyyy-MM-ddTHH:mm:ss` format
- Queries TBO and AIRiQ in parallel using `Promise.allSettled`
- Converts AIRiQ responses to TBO-compatible format
- Calculates `NetPayable` for each flight
- Logs search activity for analytics

#### 2. Flight Booking (TBO)
**Endpoint**: `POST /api/travel/book` (Generic booking endpoint)

**Note**: TBO flight booking is handled through the TBO client library directly in the booking component.

#### 3. Flight Booking (AIRiQ)
**Endpoint**: `POST /api/travel/airiq/book`

**Request Body**:
```typescript
{
  traceId: string;
  resultIndex: string;
  passengers: Array<{
    Title: string;                    // "Mr", "Mrs", "Ms", "Miss"
    FirstName: string;
    LastName: string;
    DateOfBirth: string;              // "YYYY-MM-DD"
    Gender: number;                    // 1=Male, 2=Female
    PassportNo?: string;
    PassportExpiry?: string;          // "YYYY-MM-DD"
    AddressLine1: string;
    City: string;
    CountryCode: string;              // "IN", "US", etc.
    CountryName: string;
    Nationality?: string;
    ContactNo: string;
    Email: string;
    IsLeadPax: boolean;
    FFAirlineCode?: string;           // Frequent flyer airline code
    FFNumber?: string;                // Frequent flyer number
    GSTCompanyAddress?: string;
    GSTCompanyContactNumber?: string;
    GSTCompanyName?: string;
    GSTNumber?: string;
    GSTCompanyEmail?: string;
  }>;
  ssrData?: {
    seats?: Record<string, { Id: string; Price: number }>;
    meals?: Record<string, { Id: string; Price: number }>;
    baggage?: Record<string, { Id: string; Price: number }>;
  };
  flightData?: FlightResult;
  adultCount: number;
  childCount: number;
  infantCount: number;
}
```

**Response**:
```typescript
{
  Response: {
    Status: number;                   // 1 = success
    BookingId: string;
    PNR?: string;
    Error?: {
      ErrorMessage: string;
    };
  };
}
```

#### 4. Pricing (AIRiQ Re-pricing)
**Endpoint**: `POST /api/travel/airiq/pricing`

**Purpose**: Re-price selected flight and get updated SSR options, mandatory booking details, and fare breakdown.

**Request Body**:
```typescript
{
  traceId: string;
  resultIndex: string;
  flight: FlightResult;               // Must include _airiqOriginal data
  returnFlight?: FlightResult;        // For round-trip
  adultCount: number;
  childCount: number;
  infantCount: number;
}
```

**Response**:
```typescript
{
  ResponseStatus: {
    ResultCode: "1" | "0" | "-1";    // "1" = success
    Error?: string;
  };
  PriceItenaryInfo: Array<{
    Trackid: string;                  // NEW Trackid - use for seat map
    FlightDetails: Array<{
      FlightID: string;               // NEW FlightID - use for seat map
      FlightNumber: string;
      Origin: string;
      Destination: string;
      DepartureDateTime: string;
      ArrivalDateTime: string;
    }>;
    AvailabilityResponse: Array<{
      Meal?: Array<{
        MealID: string;
        Code: string;
        Description: string;
        Amount: string;
        Origin: string;
        Destination: string;
        SegRef: string;
        Itinref: string;
      }>;
      Bagg?: Array<{
        BaggageID: string;
        Code: string;
        Description: string;
        Amount: string;
        Origin: string;
        Destination: string;
        SegRef: string;
        Itinref: string;
      }>;
      OtherService?: Array<{
        OtherID: string;
        SSRCode: string;
        Description: string;
        Amount: string;
        SSRType: string;
        Origin: string;
        Destination: string;
        SegRef: string;
        Itinref: string;
      }>;
    }>;
  }>;
}
```

**Critical Notes**:
- For round-trip flights, onward and return segments MUST be in separate `ItineraryInfo` entries
- Amounts must be formatted as "XXXX.XX" strings (2 decimal places)
- The response provides NEW `Trackid` and `FlightID` values that must be used for seat map API

#### 5. Fare Rules
**Endpoint**: Internal (via TBO client)

**Purpose**: Get cancellation, refund, and change policies for selected flight.

#### 6. SSR (Special Service Requests)
**Endpoint**: `POST /api/travel/ssr` (TBO) or included in Pricing response (AIRiQ)

**Purpose**: Get available seats, meals, baggage, and special services.

**TBO Request**:
```typescript
{
  TraceId: string;
  ResultIndex: string;
  EndUserIp: string;
}
```

**TBO Response**:
```typescript
{
  Response: {
    Baggage?: Array<Array<{
      Code: string;
      Description: number;
      Weight: number;
      Currency: string;
      Price: number;
      Origin: string;
      Destination: string;
    }>>;
    MealDynamic?: Array<Array<{
      Code: string;
      Description: number;
      AirlineDescription: string;
      Quantity: number;
      Currency: string;
      Price: number;
      Origin: string;
      Destination: string;
    }>>;
    SeatDynamic?: Array<{
      SegmentSeat: Array<{
        RowSeats: Array<{
          Seats: Array<{
            Code: string;
            RowNo: string;
            SeatNo: string | null;
            SeatType: number;
            Currency: string;
            Price: number;
            AvailablityType: number;
          }>;
        }>;
      }>;
    }>;
    SpecialServices?: Array<{
      SegmentSpecialService: Array<{
        SSRService: Array<{
          Code: string;
          ServiceType: number;
          Text: string;
          Currency: string;
          Price: number;
        }>;
      }>;
    }>;
  };
}
```

#### 7. Seat Map (AIRiQ)
**Endpoint**: `POST /api/travel/airiq/seat-map`

**Request Body**:
```typescript
{
  trackId: string;                    // From Pricing response
  flightDetails: Array<{
    FlightID: string;                 // From Pricing response
    FlightNumber: string;
    Origin: string;
    Destination: string;
    DepartureDateTime: string;
    ArrivalDateTime: string;
  }>;
  passengers: Array<{
    Title: string;
    FirstName: string;
    LastName: string;
    PaxType: "ADT" | "CHD" | "INF";
  }>;
  baseOrigin: string;
  baseDestination: string;
  tripType: "O" | "R";
}
```

**Response**:
```typescript
{
  FlightSeat: Array<{
    SeatMap: Array<{
      SeatID: string;
      SeatName: string;                // e.g., "1A", "12F"
      SeatPosition: string;            // "Window", "Middle", "Aisle"
      SeatStatus: string;              // "true" = available
      SeatAmount: string;
      XAxis: string;                  // Horizontal position
      YAxis: string;                  // Vertical position (row)
      Origin: string;
      Destination: string;
      SegRef: string;
      ItinRef: string;
    }>;
  }>;
  ResponseStatus: {
    ResultCode: "1" | "0" | "-1";
    Error?: string;
  };
}
```

### Client Libraries

#### TBO Client (`src/lib/tboClient.ts`)
```typescript
// Main functions
searchFlights(params: FlightSearchRequest): Promise<FlightSearchResponse>
getFareRules(params: FareRuleRequest): Promise<FareRuleResponse>
getFareQuote(params: FareQuoteRequest): Promise<FareQuoteResponse>
getSSR(params: SSRRequest): Promise<SSRResponse>
bookFlight(params: BookingRequest): Promise<BookingResponse>
getFareUpsell(params: FareUpsellRequest): Promise<FareUpsellResponse>

// SSR methods
SSR.getSeatMap(params: SeatMapRequest): Promise<SeatMapResponse>
SSR.getMeal(params: Record<string, unknown>)
SSR.getBaggage(params: Record<string, unknown>)
```

**Key Features**:
- Automatic token management (cached tokens)
- Error handling with retry logic
- Unified request/response format

#### AIRiQ Client (`src/lib/airiqClient.ts`)
```typescript
// Main functions
searchFlights(params: AiriqFlightSearchRequest): Promise<AiriqFlightSearchResponse>
getFareRules(params: AiriqFareRuleRequest): Promise<AiriqFareRuleResponse>
getPricing(params: AiriqPricingRequest): Promise<AiriqPricingResponse>
getSeatMap(params: AiriqSeatMapRequest): Promise<AiriqSeatMapResponse>
bookFlight(params: AiriqBookingRequest): Promise<AiriqBookingResponse>
getSSR(params: AiriqSSRRequest): Promise<AiriqSSRResponse>

// Conversion functions
convertTboToAiriqParams(tboParams): AiriqFlightSearchRequest
convertAiriqToTboFormat(airiqResponse, journeyType): FlightSearchResponse
```

**Key Features**:
- Token management with file and memory caching
- Automatic retry on token timeout
- Response format conversion to TBO-compatible structure
- Stores original AIRiQ data in `_airiqOriginal` field for Pricing API

### UI Components

#### 1. FlightSearch (`src/app/(frontend)/travel-portal/components/FlightSearch.tsx`)
**Purpose**: Main flight search interface

**Key Features**:
- Trip type selector (One-way, Round-trip, Multi-city)
- Origin/Destination selector with autocomplete
- Date picker for departure/return dates
- Traveller selector (adults, children, infants)
- Cabin class selector
- Multi-city leg management
- Filtering (price, airline, departure/arrival times)
- Result display with fare breakdown
- Upsell modal for fare upgrades
- Caching for back navigation

**State Management**:
```typescript
const [flights, setFlights] = useState<FlightResult[]>([]);
const [traceId, setTraceId] = useState<string>("");
const [filteredFlights, setFilteredFlights] = useState<FlightResult[]>([]);
const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
```

**Search Flow**:
1. User fills search form
2. Validates inputs (dates not in past, required fields)
3. Formats request to match TBO API format
4. Calls `/api/travel/flights/search`
5. Merges TBO and AIRiQ results
6. Applies filters
7. Displays results with sorting options
8. Caches results for back navigation

#### 2. Booking Page (`src/app/(frontend)/travel-portal/book/page.tsx`)
**Purpose**: Server component that fetches flight details and routes to appropriate booking client

**Flow**:
1. Receives `traceId`, `resultIndex`, `apiSource` from URL params
2. Routes to AIRiQ booking page if `apiSource === "AIRiQ"`
3. For TBO: Fetches fare quote, fare rules, SSR, fare upsell
4. Passes data to `BookingClient` component

#### 3. BookingClient (`src/app/(frontend)/travel-portal/book/BookingClient.tsx`)
**Purpose**: TBO flight booking interface

**Features**:
- Flight details display
- Fare breakdown with expandable details
- Fare rules display
- SSR selection (seats, meals, baggage)
- Passenger details form
- Booking submission

#### 4. AiriqBookingClient (`src/app/(frontend)/travel-portal/book/AiriqBookingClient.tsx`)
**Purpose**: AIRiQ flight booking interface

**Features**:
- Calls Pricing API to get updated fare and SSR options
- Seat map integration
- SSR selection (meals, baggage, seats, other services)
- Passenger details form
- Booking submission

**Key Differences from TBO**:
- Requires Pricing API call before showing SSR options
- Seat map uses different API structure
- SSR data comes from Pricing response, not separate SSR API

#### 5. SSRSelection (`src/app/(frontend)/travel-portal/components/ssr/SSRSelection.tsx`)
**Purpose**: TBO SSR selection component

**Features**:
- Baggage selection (per passenger per segment)
- Meal selection (per passenger per segment)
- Seat selection (per passenger per segment)
- Special services selection

#### 6. AiriqSSRSelection (`src/app/(frontend)/travel-portal/components/ssr/AiriqSSRSelection.tsx`)
**Purpose**: AIRiQ SSR selection component

**Features**:
- Integrates with Pricing API response
- Seat map visualization
- Meal, baggage, and other services selection
- Only supports certain airlines (AI, UK)

#### 7. PassengerDetails (`src/app/(frontend)/travel-portal/components/PassengerDetails.tsx`)
**Purpose**: Collect passenger information

**Fields**:
- Title, First Name, Last Name
- Date of Birth
- Gender
- Passport details (for international flights)
- Contact information
- Address
- Frequent flyer information
- GST details (optional)

**Validation**:
- Required fields based on flight type (domestic vs international)
- Date of birth validation for passenger type (adult/child/infant)
- Email and phone format validation

### Data Models

See [Data Models & Type Definitions](#data-models--type-definitions) section for complete type definitions.

**Key Types**:
- `FlightResult`: Complete flight information with fare and segments
- `FlightSegmentDetail`: Individual flight segment details
- `Fare`: Fare breakdown with all charges
- `PassengerDetail`: Passenger information for booking
- `SSRResponse`: Available seats, meals, baggage options

---

## Hotel Booking System

### Overview
The hotel booking system supports:
- **Search Methods**: By country, city, or hotel name
- **Provider**: TBO Hotel API
- **Features**: Room selection, meal plans, cancellation policies, hotel details

### User Flow

```
1. Hotel Search
   ├── User enters location (country/city/hotel)
   ├── System searches local database for autocomplete
   ├── User selects location
   ├── User enters check-in/check-out dates
   ├── User selects rooms and guests
   └── System queries TBO Hotel API

2. Hotel Results
   ├── Display available hotels
   ├── Show room options with pricing
   ├── Display hotel details (images, facilities, location)
   └── User can filter by price, rating, meal type

3. Hotel Details
   ├── Display full hotel information
   ├── Show available rooms for selected dates
   ├── Display amenities, facilities, attractions
   └── User selects room

4. Booking Page
   ├── Display hotel and room details
   ├── Show booking summary
   ├── Call PreBook API to hold room
   └── Collect guest details

5. Booking Confirmation
   ├── Process booking
   └── Display confirmation
```

### API Routes

#### 1. Hotel Search (Autocomplete)
**Endpoint**: `GET /api/travel/hotel-search?q=<query>&limit=10&type=<type>`

**Purpose**: Search local database for countries, cities, and hotels (instant autocomplete)

**Query Parameters**:
- `q`: Search query (required)
- `limit`: Max results (default: 10)
- `type`: Filter by type - "country", "city", or "hotel" (optional)

**Response**:
```typescript
{
  success: boolean;
  query: string;
  count: number;
  results: Array<{
    id: string;
    type: "country" | "city" | "hotel";
    name: string;
    countryCode?: string;
    cityCode?: string;
    hotelCode?: string;
  }>;
}
```

#### 2. Get Selection Details
**Endpoint**: `POST /api/travel/hotel-search`

**Purpose**: Get detailed information about selected country, city, or hotel

**Request Body**:
```typescript
{
  type: "country" | "city" | "hotel";
  code: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  type: string;
  data: {
    // Country: includes cities
    // City: includes country and hotels
    // Hotel: includes country and city
  };
}
```

#### 3. Get Hotel Codes
**Endpoint**: `POST /api/travel/hotel/get-hotel-codes`

**Purpose**: Convert user selection to hotel codes for availability search

**Request Body**:
```typescript
{
  type: "country" | "city" | "hotel";
  code: string;
  limit?: number;                     // Default: 100
}
```

**Response**:
```typescript
{
  success: boolean;
  type: string;
  code: string;
  hotelCodes: string;                 // Comma-separated hotel codes
  count: number;
}
```

#### 4. Hotel Availability Search
**Endpoint**: `POST /api/travel/hotel/search`

**Purpose**: Search for hotel availability and pricing

**Request Body**:
```typescript
{
  checkIn: string;                    // "YYYY-MM-DD"
  checkOut: string;                   // "YYYY-MM-DD"
  hotelCodes?: string;                // Comma-separated hotel codes
  cityCode?: string;                   // City code (alternative to hotelCodes)
  countryCode?: string;               // Country code
  guestNationality: string;           // ISO country code (e.g., "IN")
  rooms: Array<{
    adults: number;                   // 1-8
    children: number;                 // 0-4
    childrenAges: number[];            // Required if children > 0
  }>;
  isDetailedResponse?: boolean;       // Default: false
  filters?: {
    refundable?: boolean;
    mealType?: "All" | "WithMeal" | "RoomOnly";
    starRating?: number[];
    minPrice?: number;
    maxPrice?: number;
  };
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    Status: {
      Code: number;                   // 1 = success
      Description: string;
    };
    HotelResult: Array<{
      HotelCode: string;
      Currency: string;
      Rooms: Array<{
        Name: string[];               // Room names
        BookingCode: string;           // Required for PreBook
        Inclusion: string;            // Included amenities
        DayRates: Array<Array<{
          BasePrice: number;
        }>>;
        TotalFare: number;
        TotalTax: number;
        RoomID: string[];
        MealType: string;             // "Room_Only", "Breakfast_For_2", etc.
        IsRefundable: boolean;
        CancelPolicies: Array<{
          Index: string;
          FromDate: string;
          ChargeType: "Percentage" | "Amount";
          CancellationCharge: number;
        }>;
        RoomPromotion: string[];
        Supplements: Array<Array<{
          Index: number;
          Type: "Included" | "AtProperty";
          Description: string;
          Price: number;
          Currency: string;
        }>>;
      }>;
    }>;
  };
  searchParams: {
    checkIn: string;
    checkOut: string;
    noOfRooms: number;
    guestNationality: string;
  };
}
```

#### 5. Hotel Details
**Endpoint**: `GET /api/travel/hotel/details?hotelCode=<code>&language=EN&isRoomDetailRequired=true`

**Purpose**: Get detailed hotel information (images, facilities, amenities, location)

**Query Parameters**:
- `hotelCode`: Hotel code (required)
- `language`: Language code (default: "EN")
- `isRoomDetailRequired`: Include room details (default: false)

**Response**:
```typescript
{
  success: boolean;
  data: {
    HotelDetails: {
      HotelCode: string;
      HotelName: string;
      Description: string;
      StarRating: string;
      Address: string;
      PinCode: string;
      CityId: string;
      CityName: string;
      CountryCode: string;
      CountryName: string;
      Latitude: string;
      Longitude: string;
      HotelFacilities: string | string[];
      Images: string | string[];
      Attractions: string | Array<{ key: string; value: string }>;
      HotelRooms?: Array<{
        RoomTypeName: string;
        RoomTypeCode: string;
        RoomDescription: string;
        Amenities: string[];
      }>;
      PhoneNumber?: string;
      Email?: string;
      HotelWebsiteUrl?: string;
      CheckInTime?: string;
      CheckOutTime?: string;
      Map?: string;                   // JSON string with lat/lng
    };
  };
}
```

#### 6. Hotel PreBook
**Endpoint**: `POST /api/travel/hotel/prebook`

**Purpose**: Hold a room before final booking

**Request Body**:
```typescript
{
  bookingCode: string;                // From room selection
  paymentMode?: string;               // "Limit" (default) or "Deposit"
  hotelData?: {
    hotelCode: string;
    hotelName: string;
    city: string;
    country: string;
    roomData: {
      bookingCode: string;
      name: string;
      totalFare: number;
      totalTax: number;
      mealType: string;
      isRefundable: boolean;
      inclusion: string;
      roomPromotion: string[];
      cancelPolicies: Array<{
        Index: string;
        FromDate: string;
        ChargeType: string;
        CancellationCharge: number;
      }>;
    };
  };
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    Status: {
      Code: number;                   // 1 = success
      Description: string;
    };
    HotelResult?: Array<{
      HotelCode: string;
      Currency: string;
      Rooms: Room[];
    }>;
    ValidationInfo?: {
      PanMandatory: boolean;
      PassportMandatory: boolean;
      CorporateBookingAllowed: boolean;
      PanCountRequired: number;
      SamePaxNameAllowed: boolean;
      SpaceAllowed: boolean;
      SpecialCharAllowed: boolean;
      PaxNameMinLength: number;
      PaxNameMaxLength: number;
      CharLimit: boolean;
      PackageFare: boolean;
      PackageDetailsMandatory: boolean;
      DepartureDetailsMandatory: boolean;
      GSTAllowed: boolean;
    };
  };
}
```

### Client Libraries

#### TBO Hotel Client (`src/lib/tboHotelClient.ts`)
```typescript
// Main functions
searchHotels(params: {
  checkIn: string;
  checkOut: string;
  hotelCodes?: string;
  cityCode?: string;
  countryCode?: string;
  guestNationality: string;
  rooms: Array<{
    adults: number;
    children: number;
    childrenAges: number[];
  }>;
  isDetailedResponse?: boolean;
  filters?: HotelFilters;
}): Promise<HotelSearchResponse>

getHotelDetails(params: {
  hotelCode: string;
  checkIn: string;
  checkOut: string;
  guestNationality: string;
  rooms: Array<{
    adults: number;
    children: number;
    childrenAges: number[];
  }>;
}): Promise<HotelDetailsResponse>

preBookHotel(params: {
  bookingCode: string;
  paymentMode?: string;
}): Promise<PreBookResponse>
```

**Key Features**:
- Uses Basic Auth for Affiliate API (Search endpoint)
- Uses Static API credentials for HotelDetails endpoint
- Automatic error handling
- Room configuration conversion

#### TBO Static Client (`src/lib/tboStaticClient.ts`)
```typescript
// Static data APIs
getCountryList(): Promise<TboCountryResponse>
getCityList(countryCode: string): Promise<TboCityResponse>
getHotelCodeList(cityCode: string): Promise<TboHotelCodeListResponse>
getHotelDetails(
  hotelCode: string,
  language?: string,
  isRoomDetailRequired?: boolean
): Promise<TboHotelDetailsResponse>
```

**Key Features**:
- Uses Static API credentials (different from Affiliate API)
- Retry logic for transient errors
- Batch hotel details fetching

### UI Components

#### 1. HotelSearchForm (`src/components/travel-portal/HotelSearchForm.tsx`)
**Purpose**: Hotel search form with location autocomplete

**Features**:
- Location search with autocomplete
- Date range picker
- Room and guest selector
- Guest nationality selector
- Search button

#### 2. HotelSearch Page (`src/app/(frontend)/travel-portal/hotel-search/page.tsx`)
**Purpose**: Hotel search results page

**Features**:
- Displays search form
- Shows hotel results with filters
- Fetches hotel details in batches
- Sorting options (price, rating)
- Filtering (price range, star rating, meal type, refundable)
- Caching for back navigation

**Search Flow**:
1. User enters location and dates
2. System gets city code from selection
3. Fetches hotels in city from local database
4. Limits to 100 hotels (TBO recommendation)
5. Calls `/api/travel/hotel/search` with hotel codes
6. Displays results
7. Fetches hotel details in batches of 5 (to avoid API rate limits)

#### 3. HotelDetails Page (`src/app/(frontend)/travel-portal/hotel-details/page.tsx`)
**Purpose**: Detailed hotel information page

**Features**:
- Hotel images gallery
- Hotel information (name, address, rating, facilities)
- Map integration (Google Maps)
- Available rooms for selected dates
- Room selection with pricing
- Attractions and nearby places
- Check-in/check-out times

**Flow**:
1. Fetches hotel details from Static API
2. Fetches available rooms for selected dates
3. Displays hotel information
4. User selects room
5. Navigates to booking page with room data

#### 4. HotelBooking Page (`src/app/(frontend)/travel-portal/hotel-booking/page.tsx`)
**Purpose**: Hotel booking confirmation page

**Features**:
- Hotel information display
- Booking details (dates, guests, rooms)
- Selected room details
- Price summary
- PreBook API call
- Guest details form (future implementation)

**Flow**:
1. Receives booking data from URL params
2. Fetches hotel details
3. Calls PreBook API to hold room
4. Displays booking summary
5. Collects guest details (future)

### Data Models

See [Data Models & Type Definitions](#data-models--type-definitions) section for complete type definitions.

**Key Types**:
- `HotelSearchRequest`: Search parameters
- `HotelSearchResponse`: Search results
- `HotelResult`: Hotel with available rooms
- `Room`: Room details with pricing and policies
- `HotelDetailsResponse`: Detailed hotel information

---

## Database Schema

### Prisma Models

#### TboCountry
```prisma
model TboCountry {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  countryCode String   @unique
  countryName String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([countryName])
}
```

#### TboCity
```prisma
model TboCity {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  cityCode    String   @unique
  cityName    String
  countryCode String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([cityName])
  @@index([countryCode])
  @@index([countryCode, cityName])
}
```

#### TboHotel
```prisma
model TboHotel {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  hotelCode    String   @unique
  hotelName    String
  cityCode     String
  cityName     String
  countryCode  String
  countryName  String
  latitude     String?
  longitude    String?
  hotelRating  String?
  address      String?
  description  String?
  facilities   String[]
  images       String[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([hotelName])
  @@index([cityCode])
  @@index([countryCode])
  @@index([cityCode, hotelName])
  @@index([countryCode, cityName])
}
```

#### TboSearchIndex
```prisma
model TboSearchIndex {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  type        String   // 'country' | 'city' | 'hotel'
  displayName String
  countryCode String
  cityCode    String?
  hotelCode   String?
  searchText  String   // Normalized searchable text
  priority    Int      // hotel=3 > city=2 > country=1
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([searchText])
  @@index([type])
  @@index([priority])
  @@index([type, priority])
  @@index([countryCode])
  @@index([cityCode])
}
```

### Data Sync

The system syncs static data from TBO APIs to local database:

1. **Countries**: Sync from TBO CountryList API
2. **Cities**: Sync from TBO CityList API (per country)
3. **Hotels**: Sync from TBO TBOHotelCodeList API (per city)
4. **Search Index**: Built from countries, cities, and hotels for fast autocomplete

**Sync Endpoints**:
- `POST /api/travel/tbo-sync/countries`
- `POST /api/travel/tbo-sync/cities`
- `POST /api/travel/tbo-sync/hotels`
- `POST /api/travel/tbo-sync/search-index`
- `POST /api/travel/tbo-sync/full-sync`

---

## Authentication & Token Management

### TBO Authentication

**Service**: `src/services/tboAuth.ts`

**Token Management**:
- Tokens cached in memory and file system
- Token expiration: End of day (11:59:59 PM)
- Automatic token refresh on expiration
- File cache: `.cache/tbo-token.json`

**API Endpoints**:
- `GET /api/travel/auth` - Get current token status
- `POST /api/travel/auth` - Force token refresh
- `DELETE /api/travel/auth` - Clear cached token

**Usage**:
```typescript
import { getTboToken } from "@/services/tboAuth";

const token = await getTboToken(); // Automatically handles caching
```

### AIRiQ Authentication

**Service**: `src/services/airiqAuth.ts`

**Token Management**:
- Tokens cached in memory and file system
- Token expiration: End of day (11:59:59 PM)
- Maximum 5 concurrent logins per account
- Automatic retry on token timeout
- File cache: `.cache/airiq-token.json`

**Authentication Method**:
- HTTP Basic Authentication
- Format: `AgentID*Username:Password` (Base64 encoded)
- Token sent in header as `TOKEN` (all caps)

**Usage**:
```typescript
import { getAiriqToken } from "@/services/airiqAuth";

const token = await getAiriqToken(); // Automatically handles caching
```

### Hotel API Authentication

**Two Different Credential Sets**:

1. **Affiliate API** (Search endpoint):
   - Username: `Dharmlok`
   - Password: `Dharmlok@123`
   - Method: Basic Auth
   - Endpoint: `https://affiliate.tektravels.com/HotelAPI`

2. **Static API** (HotelDetails endpoint):
   - Username: `TBOStaticAPITest`
   - Password: `Tbo@11530818`
   - Method: Basic Auth
   - Endpoint: `http://api.tbotechnology.in/TBOHolidays_HotelAPI`

---

## Complete API Endpoints Reference

This section provides detailed request and response examples for all endpoints. Use these when implementing your Flutter app.

### Base URL
All endpoints are relative to your Next.js server. Example: `https://your-domain.com/api/travel/...`

### Headers
Most endpoints require:
- `Content-Type: application/json` (for POST requests)
- No authentication headers required (tokens managed server-side)

---

## Authentication Endpoints

### 1. Get TBO Token Status
**Endpoint**: `GET /api/travel/auth`

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "token": "abc123def456...",
  "expiresAt": "2025-01-15T23:59:59.000Z",
  "isCached": true
}
```

**Error Response** (500):
```json
{
  "success": false,
  "error": "Authentication failed"
}
```

---

### 2. Refresh TBO Token
**Endpoint**: `POST /api/travel/auth`

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "token": "newtoken123...",
  "expiresAt": "2025-01-15T23:59:59.000Z",
  "message": "Token refreshed successfully"
}
```

---

### 3. Clear TBO Token Cache
**Endpoint**: `DELETE /api/travel/auth`

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token cache cleared"
}
```

---

### 4. Get Hotel Auth Status
**Endpoint**: `GET /api/travel/hotel/auth?refresh=true` (optional query param)

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "hasValidToken": true,
  "token": "partialtoken...",
  "tokenLength": 1234,
  "expiresAt": "2025-01-15T23:59:59.000Z",
  "message": "Token retrieved successfully"
}
```

---

## Flight Endpoints

### 1. Search Flights
**Endpoint**: `POST /api/travel/flights/search`

**Request Body**:
```json
{
  "Origin": "DEL",
  "Destination": "BOM",
  "PreferredDepartureTime": "2025-01-15T00:00:00",
  "ReturnPreferredDepartureTime": "2025-01-20T00:00:00",
  "JourneyType": "2",
  "AdultCount": "2",
  "ChildCount": "1",
  "InfantCount": "0",
  "FlightCabinClass": "1",
  "PreferredAirlines": ["AI", "6E"]
}
```

**One-Way Request**:
```json
{
  "Origin": "DEL",
  "Destination": "BOM",
  "PreferredDepartureTime": "2025-01-15T00:00:00",
  "JourneyType": "1",
  "AdultCount": "1",
  "ChildCount": "0",
  "InfantCount": "0",
  "FlightCabinClass": "1"
}
```

**Multi-City Request**:
```json
{
  "JourneyType": "3",
  "AdultCount": "2",
  "ChildCount": "0",
  "InfantCount": "0",
  "FlightCabinClass": "1",
  "Segments": [
    {
      "Origin": "DEL",
      "Destination": "BOM",
      "PreferredDepartureTime": "2025-01-15T00:00:00"
    },
    {
      "Origin": "BOM",
      "Destination": "BLR",
      "PreferredDepartureTime": "2025-01-18T00:00:00"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "Response": {
      "TraceId": "trace123456",
      "Results": [
        [
          {
            "ResultIndex": "AI123",
            "Source": 1,
            "IsLCC": false,
            "IsRefundable": true,
            "AirlineCode": "AI",
            "ValidatingAirlineCode": "AI",
            "Fare": {
              "Currency": "INR",
              "BaseFare": 5000,
              "Tax": 2000,
              "PublishedFare": 7000,
              "OfferedFare": 6500,
              "NetPayable": 6500
            },
            "Segments": [
              [
                {
                  "Origin": {
                    "Airport": {
                      "AirportCode": "DEL",
                      "AirportName": "Delhi",
                      "CityCode": "DEL",
                      "CityName": "Delhi",
                      "CountryCode": "IN",
                      "CountryName": "India"
                    },
                    "DepTime": "2025-01-15T10:00:00"
                  },
                  "Destination": {
                    "Airport": {
                      "AirportCode": "BOM",
                      "AirportName": "Mumbai",
                      "CityCode": "BOM",
                      "CityName": "Mumbai"
                    },
                    "ArrTime": "2025-01-15T12:30:00"
                  },
                  "Duration": 150,
                  "FlightNumber": "AI101",
                  "AirlineCode": "AI",
                  "CabinClass": 1
                }
              ]
            ],
            "ApiSource": "TBO"
          }
        ]
      ],
      "TboResults": [...],
      "AiriqResults": [...]
    }
  },
  "sources": {
    "tbo": true,
    "airiq": true
  },
  "stats": {
    "tboFlightCount": 15,
    "airiqFlightCount": 8,
    "totalFlightCount": 23
  }
}
```

**Error Response** (400):
```json
{
  "error": "Departure date cannot be in the past"
}
```

---

### 2. Get SSR Options (TBO)
**Endpoint**: `POST /api/travel/ssr`

**Request Body**:
```json
{
  "TraceId": "trace123456",
  "ResultIndex": "AI123",
  "EndUserIp": "192.168.1.1"
}
```

**Response** (200 OK):
```json
{
  "Response": {
    "Baggage": [
      [
        {
          "Code": "BG01",
          "Description": 15,
          "Weight": 15,
          "Currency": "INR",
          "Price": 1000,
          "Origin": "DEL",
          "Destination": "BOM"
        }
      ]
    ],
    "MealDynamic": [
      [
        {
          "Code": "ML01",
          "Description": 1,
          "AirlineDescription": "Vegetarian Meal",
          "Quantity": 1,
          "Currency": "INR",
          "Price": 300,
          "Origin": "DEL",
          "Destination": "BOM"
        }
      ]
    ],
    "SeatDynamic": [
      {
        "SegmentSeat": [
          {
            "RowSeats": [
              {
                "Seats": [
                  {
                    "Code": "1A",
                    "RowNo": "1",
                    "SeatNo": "A",
                    "SeatType": 1,
                    "Currency": "INR",
                    "Price": 500,
                    "AvailablityType": 1
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

### 3. Get Fare Upsell (TBO)
**Endpoint**: `POST /api/travel/fare-upsell`

**Request Body**:
```json
{
  "TraceId": "trace123456",
  "ResultIndex": "AI123",
  "EndUserIp": "192.168.1.1",
  "ReturnResultIndex": "AI456",
  "AdultCount": 2,
  "ChildCount": 0,
  "InfantCount": 0
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "Response": {
      "TraceId": "trace123456",
      "Results": [
        {
          "ResultIndex": "AI123U",
          "Fare": {
            "OfferedFare": 8000
          }
        }
      ]
    }
  }
}
```

---

### 4. AIRiQ Pricing
**Endpoint**: `POST /api/travel/airiq/pricing`

**Request Body**:
```json
{
  "traceId": "trace123456",
  "resultIndex": "AI123",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiqtrack789",
      "FlightDetails": [
        {
          "FlightID": "12345",
          "FlightNumber": "AI101",
          "Origin": "DEL",
          "Destination": "BOM",
          "DepartureDateTime": "15 JAN 2025 10:00",
          "ArrivalDateTime": "15 JAN 2025 12:30"
        }
      ],
      "Fares": [
        {
          "Faredescription": [
            {
              "BaseAmount": "5000.00",
              "GrossAmount": "7000.00"
            }
          ]
        }
      ]
    }
  },
  "returnFlight": null,
  "adultCount": 2,
  "childCount": 0,
  "infantCount": 0
}
```

**Round-Trip Request**:
```json
{
  "traceId": "trace123456",
  "resultIndex": "AI123",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiqtrack789",
      "FlightDetails": [...]
    }
  },
  "returnFlight": {
    "_airiqOriginal": {
      "Trackid": "airiqtrack789",
      "FlightDetails": [...]
    }
  },
  "adultCount": 2,
  "childCount": 0,
  "infantCount": 0
}
```

**Response** (200 OK):
```json
{
  "ResponseStatus": {
    "ResultCode": "1"
  },
  "PriceItenaryInfo": [
    {
      "Trackid": "newtrackid999",
      "FlightDetails": [
        {
          "FlightID": "newflightid888",
          "FlightNumber": "AI101",
          "Origin": "DEL",
          "Destination": "BOM",
          "DepartureDateTime": "15 JAN 2025 10:00",
          "ArrivalDateTime": "15 JAN 2025 12:30"
        }
      ],
      "AvailabilityResponse": [
        {
          "Meal": [
            {
              "MealID": "ML01",
              "Code": "VGML",
              "Description": "Vegetarian Meal",
              "Amount": "300.00",
              "Origin": "DEL",
              "Destination": "BOM",
              "SegRef": "1",
              "Itinref": "1"
            }
          ],
          "Bagg": [
            {
              "BaggageID": "BG01",
              "Code": "15KG",
              "Description": "15 KG Baggage",
              "Amount": "1000.00",
              "Origin": "DEL",
              "Destination": "BOM",
              "SegRef": "1",
              "Itinref": "1"
            }
          ],
          "OtherService": []
        }
      ]
    }
  ]
}
```

**Error Response** (400):
```json
{
  "error": "Missing original AIRiQ flight data. Please search again."
}
```

---

### 5. AIRiQ Seat Map
**Endpoint**: `POST /api/travel/airiq/seat-map`

**Request Body**:
```json
{
  "traceId": "trace123456",
  "resultIndex": "AI123",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiqtrack789",
      "FlightDetails": [...]
    }
  },
  "passengers": [
    {
      "Title": "Mr",
      "FirstName": "John",
      "LastName": "Doe",
      "PaxType": 1
    }
  ],
  "pricingData": {
    "PriceItenaryInfo": [
      {
        "Trackid": "newtrackid999",
        "FlightDetails": [
          {
            "FlightID": "newflightid888",
            "FlightNumber": "AI101",
            "Origin": "DEL",
            "Destination": "BOM",
            "DepartureDateTime": "15 JAN 2025 10:00",
            "ArrivalDateTime": "15 JAN 2025 12:30"
          }
        ]
      }
    ]
  }
}
```

**Response** (200 OK):
```json
{
  "FlightSeat": [
    {
      "SeatMap": [
        {
          "SeatID": "SEAT123",
          "SeatName": "1A",
          "SeatPosition": "Window",
          "SeatStatus": "true",
          "SeatAmount": "500.00",
          "XAxis": "1",
          "YAxis": "1",
          "Origin": "DEL",
          "Destination": "BOM",
          "SegRef": "1",
          "ItinRef": "1"
        }
      ]
    }
  ],
  "ResponseStatus": {
    "ResultCode": "1"
  }
}
```

---

### 6. AIRiQ Fare Rules
**Endpoint**: `POST /api/travel/airiq/fare-rules`

**Request Body**:
```json
{
  "traceId": "trace123456",
  "resultIndex": "AI123",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiqtrack789",
      "FlightDetails": [
        {
          "FlightID": "12345",
          "Origin": "DEL",
          "Destination": "BOM"
        }
      ]
    }
  }
}
```

**Response** (200 OK):
```json
{
  "Response": {
    "TraceId": "airiqtrack789",
    "FareRules": [
      {
        "Origin": "DEL",
        "Destination": "BOM",
        "Airline": "Air India",
        "FareBasisCode": "Y",
        "FareRuleDetail": "Fare rules text here...",
        "FareRestriction": "",
        "FareFamilyCode": "",
        "FareRuleIndex": ""
      }
    ]
  }
}
```

---

### 7. Book Flight (AIRiQ)
**Endpoint**: `POST /api/travel/airiq/book`

**Request Body**:
```json
{
  "traceId": "trace123456",
  "resultIndex": "AI123",
  "passengers": [
    {
      "Title": "Mr",
      "FirstName": "John",
      "LastName": "Doe",
      "DateOfBirth": "1990-01-15",
      "Gender": 1,
      "PassportNo": "A1234567",
      "PassportExpiry": "2030-01-15",
      "AddressLine1": "123 Main St",
      "City": "Mumbai",
      "CountryCode": "IN",
      "CountryName": "India",
      "Nationality": "IN",
      "ContactNo": "+919876543210",
      "Email": "john@example.com",
      "IsLeadPax": true,
      "FFAirlineCode": "AI",
      "FFNumber": "123456789"
    }
  ],
  "ssrData": {
    "seats": {
      "1A": {
        "Id": "SEAT123",
        "Price": 500
      }
    },
    "meals": {
      "ML01": {
        "Id": "ML01",
        "Price": 300
      }
    },
    "baggage": {
      "BG01": {
        "Id": "BG01",
        "Price": 1000
      }
    }
  },
  "flightData": {...},
  "adultCount": 1,
  "childCount": 0,
  "infantCount": 0
}
```

**Response** (200 OK):
```json
{
  "Response": {
    "Status": 1,
    "BookingId": "123456789",
    "PNR": "ABC123"
  }
}
```

**Error Response** (500):
```json
{
  "error": "Booking failed"
}
```

---

### 8. Post-Booking SSR (AIRiQ)
**Endpoint**: `POST /api/travel/airiq/ssr`

**Request Body**:
```json
{
  "airiqPNR": "AIRIQ123",
  "airlinePNR": "AI123456"
}
```

**Response** (200 OK):
```json
{
  "Status": {
    "ResultCode": "1"
  },
  "SSROptions": {
    "Meal": [...],
    "Baggage": [...],
    "Seat": [...]
  }
}
```

---

## Hotel Endpoints

### 1. Hotel Search (Autocomplete)
**Endpoint**: `GET /api/travel/hotel-search?q=mumbai&limit=10&type=city`

**Query Parameters**:
- `q` (required): Search query
- `limit` (optional): Max results (default: 10)
- `type` (optional): Filter by "country", "city", or "hotel"

**Response** (200 OK):
```json
{
  "success": true,
  "query": "mumbai",
  "count": 5,
  "results": [
    {
      "id": "abc123",
      "type": "city",
      "name": "Mumbai, India",
      "countryCode": "IN",
      "cityCode": "BOM"
    },
    {
      "id": "def456",
      "type": "hotel",
      "name": "Taj Mahal Palace",
      "countryCode": "IN",
      "cityCode": "BOM",
      "hotelCode": "12345"
    }
  ]
}
```

---

### 2. Get Selection Details
**Endpoint**: `POST /api/travel/hotel-search`

**Request Body**:
```json
{
  "type": "city",
  "code": "BOM"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "type": "city",
  "data": {
    "cityCode": "BOM",
    "cityName": "Mumbai",
    "countryCode": "IN",
    "country": {
      "countryCode": "IN",
      "countryName": "India"
    },
    "hotels": [
      {
        "hotelCode": "12345",
        "hotelName": "Taj Mahal Palace"
      }
    ]
  }
}
```

---

### 3. Get Hotel Codes
**Endpoint**: `POST /api/travel/hotel/get-hotel-codes`

**Request Body**:
```json
{
  "type": "city",
  "code": "BOM",
  "limit": 100
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "type": "city",
  "code": "BOM",
  "hotelCodes": "12345,67890,11111",
  "count": 3
}
```

**Error Response** (404):
```json
{
  "error": "No hotels found for city: BOM"
}
```

---

### 4. Search Hotel Availability
**Endpoint**: `POST /api/travel/hotel/search`

**Request Body**:
```json
{
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-18",
  "hotelCodes": "12345,67890",
  "guestNationality": "IN",
  "rooms": [
    {
      "adults": 2,
      "children": 1,
      "childrenAges": [8]
    }
  ],
  "isDetailedResponse": false,
  "filters": {
    "refundable": true,
    "mealType": "WithMeal",
    "starRating": [4, 5],
    "minPrice": 2000,
    "maxPrice": 10000
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "Status": {
      "Code": 1,
      "Description": "Successful"
    },
    "HotelResult": [
      {
        "HotelCode": "12345",
        "Currency": "INR",
        "Rooms": [
          {
            "Name": ["Deluxe Room"],
            "BookingCode": "BOOK123",
            "Inclusion": "WiFi, Breakfast",
            "TotalFare": 15000,
            "TotalTax": 2700,
            "RoomID": ["ROOM123"],
            "MealType": "Breakfast_For_2",
            "IsRefundable": true,
            "CancelPolicies": [
              {
                "Index": "1",
                "FromDate": "2025-01-10",
                "ChargeType": "Percentage",
                "CancellationCharge": 25
              }
            ],
            "RoomPromotion": ["Early Bird Discount"],
            "Supplements": []
          }
        ]
      }
    ]
  },
  "searchParams": {
    "checkIn": "2025-01-15",
    "checkOut": "2025-01-18",
    "noOfRooms": 1,
    "guestNationality": "IN"
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "Missing required field: checkIn"
}
```

---

### 5. Get Hotel Details
**Endpoint**: `GET /api/travel/hotel/details?hotelCode=12345&language=EN&isRoomDetailRequired=true`

**Query Parameters**:
- `hotelCode` (required): Hotel code
- `language` (optional): Language code (default: "EN")
- `isRoomDetailRequired` (optional): Include room details (default: false)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "HotelDetails": {
      "HotelCode": "12345",
      "HotelName": "Taj Mahal Palace",
      "Description": "Luxury hotel in Mumbai",
      "StarRating": "5",
      "Address": "Apollo Bunder, Mumbai",
      "PinCode": "400001",
      "CityId": "BOM",
      "CityName": "Mumbai",
      "CountryCode": "IN",
      "CountryName": "India",
      "Latitude": "18.9217",
      "Longitude": "72.8332",
      "HotelFacilities": ["WiFi", "Pool", "Spa"],
      "Images": ["https://example.com/image1.jpg"],
      "Attractions": [
        {
          "key": "Gateway of India",
          "value": "0.5 km"
        }
      ],
      "HotelRooms": [
        {
          "RoomTypeName": "Deluxe Room",
          "RoomTypeCode": "DLX",
          "RoomDescription": "Spacious room with sea view",
          "Amenities": ["TV", "AC", "Mini Bar"]
        }
      ],
      "PhoneNumber": "+912223456789",
      "Email": "reservations@tajhotels.com",
      "CheckInTime": "14:00",
      "CheckOutTime": "12:00"
    }
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": "Hotel details not found in response"
}
```

---

### 6. Pre-Book Hotel
**Endpoint**: `POST /api/travel/hotel/prebook`

**Request Body**:
```json
{
  "bookingCode": "BOOK123",
  "paymentMode": "Limit",
  "hotelData": {
    "hotelCode": "12345",
    "hotelName": "Taj Mahal Palace",
    "city": "Mumbai",
    "country": "India",
    "roomData": {
      "bookingCode": "BOOK123",
      "name": "Deluxe Room",
      "totalFare": 15000,
      "totalTax": 2700,
      "mealType": "Breakfast_For_2",
      "isRefundable": true,
      "inclusion": "WiFi, Breakfast",
      "roomPromotion": ["Early Bird Discount"],
      "cancelPolicies": [
        {
          "Index": "1",
          "FromDate": "2025-01-10",
          "ChargeType": "Percentage",
          "CancellationCharge": 25
        }
      ]
    }
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "Status": {
      "Code": 1,
      "Description": "Successful"
    },
    "HotelResult": [
      {
        "HotelCode": "12345",
        "Currency": "INR",
        "Rooms": [...]
      }
    ],
    "ValidationInfo": {
      "PanMandatory": false,
      "PassportMandatory": false,
      "CorporateBookingAllowed": true,
      "PanCountRequired": 0,
      "SamePaxNameAllowed": false,
      "SpaceAllowed": true,
      "SpecialCharAllowed": false,
      "PaxNameMinLength": 2,
      "PaxNameMaxLength": 50,
      "CharLimit": false,
      "PackageFare": false,
      "PackageDetailsMandatory": false,
      "DepartureDetailsMandatory": false,
      "GSTAllowed": true
    }
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": "bookingCode is required"
}
```

---

## Sync Endpoints

### 1. Sync Countries
**Endpoint**: `POST /api/travel/tbo-sync/countries`

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Country sync completed",
  "synced": 250,
  "errors": 0,
  "total": 250
}
```

---

### 2. Sync Cities
**Endpoint**: `POST /api/travel/tbo-sync/cities`

**Request Body** (optional - sync specific country):
```json
{
  "countryCode": "IN"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "City sync completed for all countries",
  "synced": 1500,
  "errors": 5,
  "countries": 250
}
```

---

### 3. Sync Hotels
**Endpoint**: `POST /api/travel/tbo-sync/hotels`

**Request Body** (optional):
```json
{
  "cityCode": "BOM",
  "limit": 100,
  "enrichDetails": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Hotel sync completed for all cities",
  "synced": 50000,
  "errors": 100,
  "cities": 1500
}
```

---

### 4. Build Search Index
**Endpoint**: `POST /api/travel/tbo-sync/search-index`

**Request**: No body required

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Search index rebuilt successfully",
  "indexed": 51750,
  "errors": 0,
  "breakdown": {
    "countries": 250,
    "cities": 1500,
    "hotels": 50000
  }
}
```

---

### 5. Full Sync
**Endpoint**: `POST /api/travel/tbo-sync/full-sync`

**Request Body** (optional):
```json
{
  "syncCountries": true,
  "syncCities": true,
  "syncHotels": true,
  "buildIndex": true,
  "cityLimit": 100,
  "countryCode": "IN"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Full sync completed: 4/4 steps successful",
  "results": {
    "success": true,
    "steps": [
      {
        "step": "countries",
        "success": true,
        "data": {...}
      },
      {
        "step": "cities",
        "success": true,
        "data": {...}
      },
      {
        "step": "hotels",
        "success": true,
        "data": {...}
      },
      {
        "step": "search-index",
        "success": true,
        "data": {...}
      }
    ],
    "errors": []
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Logging Endpoints

### 1. Get Travel Logs
**Endpoint**: `GET /api/travel/logs?page=1&limit=20&logType=flight&action=booking&userId=abc123&startDate=2025-01-01&endDate=2025-01-31`

**Query Parameters** (all optional):
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `logType`: "flight" or "hotel"
- `action`: "booking" or "search"
- `userId`: Filter by user ID
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)

**Response** (200 OK):
```json
{
  "success": true,
  "logs": [
    {
      "id": "log123",
      "logType": "flight",
      "action": "booking",
      "userId": "user123",
      "userEmail": "user@example.com",
      "provider": "TBO",
      "bookingCode": "ABC123",
      "totalAmount": 15000,
      "currency": "INR",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

---

### 2. Log Travel Selection
**Endpoint**: `POST /api/travel/log-selection`

**Request Body**:
```json
{
  "logType": "flight",
  "action": "selection",
  "provider": "TBO",
  "traceId": "trace123",
  "resultIndex": "AI123",
  "flightData": {
    "origin": "DEL",
    "destination": "BOM",
    "departureDate": "2025-01-15"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Missing required parameters"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error message"
}
```

---

## Data Models & Type Definitions

### Flight Types (TBO)

**Location**: `src/types/tbo.ts`

#### FlightSearchRequest
```typescript
interface FlightSearchRequest {
  EndUserIp: string;
  TokenId?: string;
  AdultCount: string;
  ChildCount: string;
  InfantCount: string;
  DirectFlight: string;
  OneStopFlight: string;
  JourneyType: string; // "1" | "2" | "3"
  PreferredAirlines?: string[] | null;
  Segments: FlightSegment[];
  Sources?: string[] | null;
  MaxResults?: number;
}
```

#### FlightSegment
```typescript
interface FlightSegment {
  Origin: string;
  Destination: string;
  FlightCabinClass: string;
  PreferredDepartureTime: string;
  PreferredArrivalTime?: string;
}
```

#### FlightResult
```typescript
interface FlightResult {
  ResultIndex: string;
  Source: number;
  IsLCC: boolean;
  IsRefundable: boolean;
  IsUpsellAllowed?: boolean;
  AirlineCode: string;
  ValidatingAirlineCode: string;
  AirlineRemark: string;
  Fare?: Fare;
  ReturnResultIndex?: string;
  ApiSource?: "TBO" | "AIRiQ";
  FareBreakdown: Array<{
    Currency?: string;
    PassengerType: number;
    PassengerCount: number;
    BaseFare: number;
    Tax: number;
    TaxBreakUp?: Array<{ key: string; value: number }>;
    YQTax?: number;
    AdditionalTxnFeeOfrd?: number;
    AdditionalTxnFeePub?: number;
    PGCharge?: number;
  }>;
  Segments: Array<FlightSegmentDetail[]>;
  FareClassification?: {
    Color: string;
    Type: string;
  };
}
```

#### Fare
```typescript
interface Fare {
  Currency: string;
  BaseFare: number;
  Tax: number;
  TaxBreakup: Array<{ key: string; value: number }>;
  YQTax: number;
  AdditionalTxnFeeOfrd: number;
  AdditionalTxnFeePub: number;
  PGCharge: number;
  OtherCharges: number;
  ChargeBU: Array<{ key: string; value: number }>;
  Discount: number;
  PublishedFare: number;
  CommissionEarned: number;
  PLBEarned: number;
  IncentiveEarned: number;
  OfferedFare: number;
  TdsOnCommission: number;
  TdsOnPLB: number;
  TdsOnIncentive: number;
  ServiceFee: number;
  TotalBaggageCharges: number;
  TotalMealCharges: number;
  TotalSeatCharges: number;
  TotalSpecialServiceCharges: number;
  IGSTAmount?: number;
  CGSTAmount?: number;
  SGSTAmount?: number;
  CessAmount?: number;
  AirlineTransFee?: number;
  NetPayable?: number; // Calculated field
}
```

#### PassengerDetail
```typescript
interface PassengerDetail {
  Title: string;
  FirstName: string;
  LastName: string;
  PaxType: 1 | 2 | 3; // 1:Adult, 2:Child, 3:Infant
  DateOfBirth: string;
  Gender: 1 | 2; // 1:Male, 2:Female
  PassportNo?: string;
  PassportExpiry?: string;
  AddressLine1: string;
  AddressLine2?: string;
  City: string;
  CountryCode: string;
  CountryName: string;
  Nationality?: string;
  ContactNo: string;
  Email: string;
  IsLeadPax: boolean;
  FFAirlineCode?: string;
  FFNumber?: string;
  Meal?: string;
  Seat?: string;
}
```

### Hotel Types

**Location**: `src/types/hotelApi.ts`

#### HotelSearchRequest
```typescript
interface HotelSearchRequest {
  CheckIn: string; // "YYYY-MM-DD"
  CheckOut: string; // "YYYY-MM-DD"
  HotelCodes: string; // Comma-separated
  GuestNationality: string; // ISO country code
  NoOfRooms: number;
  PaxRooms: PaxRoom[];
  ResponseTime?: number;
  IsDetailedResponse?: boolean;
  Filters?: HotelFilters;
}
```

#### PaxRoom
```typescript
interface PaxRoom {
  Adults: number; // 1-8
  Children: number; // 0-4
  ChildrenAges: number[] | null; // Required if Children > 0
}
```

#### Room
```typescript
interface Room {
  Name: string[];
  BookingCode: string;
  Inclusion: string;
  DayRates: DayRate[][];
  TotalFare: number;
  TotalTax: number;
  RoomID: string[];
  ExtraGuestCharges?: number;
  RecommendedSellingRate?: string;
  RoomPromotion: string[];
  CancelPolicies: CancelPolicy[];
  MealType: string;
  IsRefundable: boolean;
  Supplements: Supplement[][];
  WithTransfers: boolean;
}
```

### AIRiQ Types

**Location**: `src/types/airiq.ts`

#### AiriqFlightSearchRequest
```typescript
interface AiriqFlightSearchRequest {
  Token?: string;
  AgentInfo: {
    AgentId: string;
    UserName: string;
    AppType: string;
    Version: number;
  };
  TripType: string; // "O" | "R" | "M"
  AirlineID: string;
  AvailInfo: AiriqAvailInfo[];
  PassengersInfo: {
    AdultCount: string;
    ChildCount: string;
    InfantCount: string;
  };
}
```

#### AiriqAvailInfo
```typescript
interface AiriqAvailInfo {
  DepartureStation: string;
  ArrivalStation: string;
  FlightDate: string; // "YYYYMMDD"
  FarecabinOption: string; // "E" | "B" | "F"
  FareType: string; // "N"
  OnlyDirectFlight: boolean;
}
```

---

## UI Components & User Flows

### Flight Booking Flow

#### 1. Search Page
**Component**: `FlightSearch.tsx`
**Route**: `/travel-portal/flight-search`

**User Actions**:
1. Select trip type (One-way, Round-trip, Multi-city)
2. Enter origin and destination
3. Select departure date (and return date for round-trip)
4. Select passengers (adults, children, infants)
5. Select cabin class
6. Click "Search Flights"

**System Actions**:
1. Validates inputs
2. Formats request to TBO format
3. Calls `/api/travel/flights/search`
4. Merges TBO and AIRiQ results
5. Displays results with filters
6. Caches results

#### 2. Results Display
**Features**:
- Flight cards with airline, times, duration, stops
- Price display with fare breakdown
- Filtering (price, airline, departure/arrival times)
- Sorting (price, duration, departure time)
- Upsell modal for fare upgrades
- "Select" button to proceed

#### 3. Booking Page
**Component**: `BookingClient.tsx` (TBO) or `AiriqBookingClient.tsx` (AIRiQ)
**Route**: `/travel-portal/book?traceId=...&resultIndex=...&apiSource=...`

**User Actions**:
1. Review flight details
2. View fare breakdown
3. View fare rules
4. Select seats (if available)
5. Select meals (if available)
6. Select baggage (if available)
7. Enter passenger details
8. Submit booking

**System Actions**:
1. Fetches fare quote
2. Fetches fare rules
3. Fetches SSR options
4. For AIRiQ: Calls Pricing API
5. Displays booking form
6. Validates passenger details
7. Submits booking
8. Displays confirmation

### Hotel Booking Flow

#### 1. Search Page
**Component**: `HotelSearchForm.tsx` + `HotelSearch.tsx`
**Route**: `/travel-portal/hotel-search`

**User Actions**:
1. Enter location (country/city/hotel)
2. Select from autocomplete suggestions
3. Select check-in and check-out dates
4. Select rooms and guests
5. Click "Search Hotels"

**System Actions**:
1. Searches local database for autocomplete
2. Gets hotel codes for selected location
3. Calls `/api/travel/hotel/search`
4. Fetches hotel details in batches
5. Displays results with filters

#### 2. Results Display
**Features**:
- Hotel cards with images, name, rating, location
- Price per night
- Room options
- Filters (price, rating, meal type, refundable)
- Sorting (price, rating)
- "View Details" button

#### 3. Hotel Details Page
**Component**: `HotelDetails.tsx`
**Route**: `/travel-portal/hotel-details?hotelCode=...&checkIn=...&checkOut=...`

**User Actions**:
1. View hotel images
2. Read hotel description
3. View facilities and amenities
4. View location on map
5. View available rooms
6. Select room
7. Click "Book Now"

**System Actions**:
1. Fetches hotel details from Static API
2. Fetches available rooms for dates
3. Displays hotel information
4. Navigates to booking page

#### 4. Booking Page
**Component**: `HotelBooking.tsx`
**Route**: `/travel-portal/hotel-booking?bookingCode=...&hotelCode=...`

**User Actions**:
1. Review hotel and room details
2. Review booking summary
3. Enter guest details (future)
4. Complete booking

**System Actions**:
1. Fetches hotel details
2. Calls PreBook API to hold room
3. Displays booking summary
4. Processes booking (future)

---

## External Service Integration

### TBO API Integration

**Base URLs**:
- Booking API: `https://api.tektravels.com/TekTravelB2BBookingAPI_V1` (from env)
- Hotel Affiliate API: `https://affiliate.tektravels.com/HotelAPI`
- Static API: `http://api.tbotechnology.in/TBOHolidays_HotelAPI`

**Authentication**:
- Token-based (for Booking API)
- Basic Auth (for Hotel APIs)

**Key Endpoints**:
- `/Search` - Flight search
- `/FareQuote` - Get fare quote
- `/FareRule` - Get fare rules
- `/SSR` - Get SSR options
- `/Book` - Book flight
- `/FareUpsell` - Get fare upsell options

### AIRiQ API Integration

**Base URL**: `http://airiqnewapi.mywebcheck.in/TravelAPI.svc` (from env)

**Authentication**:
- HTTP Basic Auth: `AgentID*Username:Password` (Base64)
- Token in header: `TOKEN: <token>`
- Authorization header: From env (`AIRIQ_AUTH_HEADER`)

**Key Endpoints**:
- `/Availability` - Flight search
- `/Pricing` - Re-price flight
- `/GetFareRule` - Get fare rules
- `/GetSSR` - Get SSR options
- `/GetAvailSeatMap` - Get seat map
- `/Book` - Book flight

**Important Notes**:
- Token valid until end of day
- Maximum 5 concurrent logins
- Round-trip flights require separate itineraries in Pricing API
- Seat map requires NEW Trackid and FlightID from Pricing response

---

## Caching & Performance

### Search Result Caching

**Location**: `src/lib/searchCache.ts`

**Features**:
- In-memory cache for flight and hotel search results
- Cache key based on search parameters
- Last search parameters stored for back navigation
- Cache expiration: 30 minutes (configurable)

**Usage**:
```typescript
import { flightCache, generateCacheKey } from "@/lib/searchCache";

const cacheKey = await generateCacheKey(searchParams);
const cached = flightCache.get(cacheKey);
if (cached) {
  // Use cached results
}
flightCache.set(cacheKey, { results, timestamp, searchData });
```

### Token Caching

**TBO Tokens**:
- Memory cache + file cache (`.cache/tbo-token.json`)
- Expiration: End of day
- Automatic refresh

**AIRiQ Tokens**:
- Memory cache + file cache (`.cache/airiq-token.json`)
- Expiration: End of day
- Automatic refresh with retry

### Hotel Details Caching

**Strategy**:
- Fetched in batches of 5 to avoid rate limits
- 500ms delay between batches
- 15-second timeout per request
- Failed requests don't block others (Promise.allSettled)

---

## Error Handling

### API Error Handling

**TBO Errors**:
- Error codes in response: `Error.ErrorCode`
- Status codes: 0 = success, non-zero = error
- Special handling for "No result found" (not an error)

**AIRiQ Errors**:
- ResultCode: "1" = success, "0" = failure, "-1" = exception
- Token timeout: Automatic retry with cache clear
- IP validation errors: Graceful handling

**Hotel API Errors**:
- Status codes: 1 = success, 0 = success/pending, 200 = success (with "Successful" description)
- Transient errors (503, 502, 504): Automatic retry with exponential backoff

### User-Facing Errors

**Flight Search**:
- "Departure date cannot be in the past"
- "No flights found for the selected criteria"
- "Session expired. Please search again"
- "Flight not available"

**Hotel Search**:
- "Please select a city from the suggestions"
- "No hotels found for this location"
- "No hotels found for the selected criteria"

**Booking**:
- "Invalid Result Index" → Session expired
- "Booking failed" → Display error message
- "Room not available" → Return to search

---

## SSR (Special Service Requests)

### TBO SSR

**Available Services**:
- **Baggage**: Additional checked baggage
- **Meals**: In-flight meals
- **Seats**: Seat selection (window, aisle, middle)
- **Special Services**: Wheelchair, special meals, etc.

**Data Structure**:
- Nested arrays: `Array<Array<Option>>` (per passenger, per segment)
- Dynamic pricing per option
- Currency in response

**Selection Flow**:
1. User selects flight
2. System fetches SSR options
3. User selects services per passenger per segment
4. Selections stored in state
5. Included in booking request

### AIRiQ SSR

**Available Services**:
- **Baggage**: Additional checked baggage
- **Meals**: In-flight meals
- **Seats**: Seat selection with seat map
- **Other Services**: Various special services

**Data Source**:
- SSR options come from Pricing API response
- Not a separate SSR API call
- Only supported for certain airlines (AI, UK)

**Selection Flow**:
1. User selects flight
2. System calls Pricing API
3. SSR options extracted from Pricing response
4. Seat map fetched separately (if available)
5. User selects services
6. Included in booking request

**Important Notes**:
- Seat map requires NEW Trackid and FlightID from Pricing response
- Seat map API requires passenger details (even placeholder names)
- Not all airlines support SSR in AIRiQ

---

## Implementation Notes for Flutter

### Key Considerations

1. **State Management**: Use Provider, Riverpod, or Bloc for complex state
2. **API Client**: Create separate service classes for TBO and AIRiQ
3. **Caching**: Use shared_preferences or Hive for token caching
4. **Date Formatting**: Ensure dates match API requirements exactly
5. **Error Handling**: Implement retry logic for transient errors
6. **Token Management**: Implement token caching and refresh logic
7. **UI Components**: Recreate search forms, result lists, booking forms
8. **Navigation**: Use Flutter navigation with proper parameter passing

### Critical API Requirements

1. **Date Formats**:
   - TBO: `yyyy-MM-ddTHH:mm:ss` (e.g., "2025-01-15T00:00:00")
   - AIRiQ: `yyyyMMdd` for search, `DD MMM YYYY HH:MM` for Pricing/SeatMap

2. **Amount Formats**:
   - AIRiQ Pricing: Must be "XXXX.XX" strings (2 decimal places)

3. **Round-Trip Flights**:
   - AIRiQ: Onward and return MUST be in separate ItineraryInfo entries

4. **Token Headers**:
   - TBO: Token in request body as `TokenId`
   - AIRiQ: Token in header as `TOKEN` (all caps)

5. **Hotel Codes**:
   - Limit to 100 hotel codes per search request
   - Comma-separated string format

### Recommended Flutter Packages

- `http` or `dio` - HTTP client
- `shared_preferences` - Token caching
- `intl` - Date formatting
- `provider` or `riverpod` - State management
- `flutter_typeahead` - Autocomplete
- `cached_network_image` - Image caching
- `google_maps_flutter` - Hotel location maps

---

## Conclusion

This documentation provides a complete overview of the flight and hotel booking system. Use this as a reference when implementing the same functionality in Flutter or any other platform. Pay special attention to:

1. API request/response formats
2. Token management and authentication
3. Error handling and retry logic
4. Data model structures
5. User flow sequences
6. Caching strategies

For any specific implementation details, refer to the source code files mentioned in each section.
