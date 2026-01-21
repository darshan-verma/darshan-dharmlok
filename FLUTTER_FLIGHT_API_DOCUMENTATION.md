# Flutter Flight Booking System - Complete API Documentation

This document contains all the information needed to implement the flight booking system in your Flutter app, including TBO and AirIQ API credentials, endpoints, request/response formats, and authentication details.

---

## Table of Contents

1. [Environment Variables & Credentials](#environment-variables--credentials)
2. [TBO API Documentation](#tbo-api-documentation)
3. [AirIQ API Documentation](#airiq-api-documentation)
4. [Base URLs](#base-urls)

---

## Environment Variables & Credentials

### TBO (TekTravels) Credentials

```env
# TBO API Base URLs
TEKTRAVELS_API_URL=http://Sharedapi.tektravels.com/SharedData.svc/rest
TEKTRAVELS_BOOKING_API_URL=http://api.tektravels.com/BookingEngineService_Flight/FlightService.svc/rest

# TBO Authentication Credentials
TEKTRAVELS_CLIENT_ID=ApiIntegrationNew
TEKTRAVELS_USER_ID=Dharmlok
TEKTRAVELS_PASSWORD=Dharmlok@1234

# End User IP (used in authentication and requests)
END_USER_IP=192.168.11.120
```

### AirIQ Credentials

```env
# AirIQ API Base URL
AIRIQ_API_URL=http://airiqnewapi.mywebcheck.in/TravelAPI.svc

# AirIQ Authentication Credentials
AIRIQ_AGENT_ID=AQAG060270
AIRIQ_USERNAME=7506209217
AIRIQ_PASSWORD=7506209217

# AirIQ Authorization Header (Base64 encoded: AgentID*Username:Password)
AIRIQ_AUTH_HEADER=QVFBRzA2MDI3MCo3NTA2MjA5MjE3Ojc1MDYyMDkyMTc=
```

**Note:** The `AIRIQ_AUTH_HEADER` is Base64 encoded format of `AgentID*Username:Password` (e.g., `AQAG060270*7506209217:7506209217`)

---

## Base URLs

### Next.js API Base URL
All endpoints below are relative to your Next.js server. Example:
- Development: `http://localhost:3000/api/travel/...`
- Production: `https://your-domain.com/api/travel/...`

### Direct TBO API URLs
- **Authentication**: `http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate`
- **Flight Booking**: `http://api.tektravels.com/BookingEngineService_Flight/FlightService.svc/rest/{endpoint}`

### Direct AirIQ API URLs
- **Base**: `http://airiqnewapi.mywebcheck.in/TravelAPI.svc/{endpoint}`
- **Login**: `http://airiqnewapi.mywebcheck.in/TravelAPI.svc/Login`

---

## TBO API Documentation

### Authentication

#### 1. Get TBO Token Status
**Endpoint**: `GET /api/travel/auth`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "token": "abc123def456...",
  "expiresAt": "2025-01-15T23:59:59.000Z",
  "isCached": true
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Authentication failed"
}
```

---

#### 2. Refresh TBO Token
**Endpoint**: `POST /api/travel/auth`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "token": "newtoken123...",
  "expiresAt": "2025-01-15T23:59:59.000Z",
  "message": "Token refreshed successfully"
}
```

---

#### 3. Clear TBO Token Cache
**Endpoint**: `DELETE /api/travel/auth`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token cache cleared"
}
```

---

#### 4. Direct TBO Authentication (Server-Side)
**Direct API Endpoint**: `POST http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate`

**Request Body:**
```json
{
  "ClientId": "ApiIntegrationNew",
  "UserName": "Dharmlok",
  "Password": "Dharmlok@1234",
  "EndUserIp": "192.168.11.120"
}
```

**Response:**
```json
{
  "Status": 1,
  "TokenId": "your-token-here",
  "Error": null
}
```

**Token Details:**
- Token expires at end of day (11:59:59 PM)
- Token is automatically cached server-side
- Token is included in request body for all TBO API calls

---

### Flight Search

#### Search Flights
**Endpoint**: `POST /api/travel/flights/search`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body (One-Way):**
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

**Request Body (Round-Trip):**
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

**Request Body (Multi-City):**
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
      "PreferredDepartureTime": "2025-01-20T00:00:00"
    }
  ]
}
```

**Field Descriptions:**
- `Origin`: IATA airport code (e.g., "DEL", "BOM")
- `Destination`: IATA airport code
- `PreferredDepartureTime`: ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
- `ReturnPreferredDepartureTime`: ISO 8601 format (for round-trip only)
- `JourneyType`: "1" = One-way, "2" = Round-trip, "3" = Multi-city
- `AdultCount`: String number (e.g., "1", "2")
- `ChildCount`: String number (e.g., "0", "1")
- `InfantCount`: String number (e.g., "0", "1")
- `FlightCabinClass`: "1" = Economy, "4" = Business, "6" = First
- `PreferredAirlines`: Optional array of airline codes (e.g., ["AI", "6E"])

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "Response": {
      "TraceId": "trace-id-123",
      "Results": [
        [
          {
            "ResultIndex": "result-index-1",
            "Source": 1,
            "IsLCC": false,
            "IsRefundable": true,
            "AirlineCode": "AI",
            "ValidatingAirlineCode": "AI",
            "ApiSource": "TBO",
            "Segments": [
              [
                {
                  "Airline": {
                    "AirlineCode": "AI",
                    "AirlineName": "Air India",
                    "FlightNumber": "AI101",
                    "FareClass": "Y"
                  },
                  "Origin": {
                    "Airport": {
                      "AirportCode": "DEL",
                      "AirportName": "Indira Gandhi International Airport",
                      "Terminal": "T3",
                      "CityCode": "DEL",
                      "CityName": "Delhi",
                      "CountryCode": "IN",
                      "CountryName": "India"
                    },
                    "DepTime": "2025-01-15T10:30:00.000Z"
                  },
                  "Destination": {
                    "Airport": {
                      "AirportCode": "BOM",
                      "AirportName": "Chhatrapati Shivaji Maharaj International Airport",
                      "Terminal": "T2",
                      "CityCode": "BOM",
                      "CityName": "Mumbai",
                      "CountryCode": "IN",
                      "CountryName": "India"
                    },
                    "ArrTime": "2025-01-15T12:45:00.000Z"
                  },
                  "Duration": 135,
                  "GroundTime": 0,
                  "StopOver": false,
                  "Baggage": "15K",
                  "CabinBaggage": "7K"
                }
              ]
            ],
            "Fare": {
              "Currency": "INR",
              "BaseFare": 5000,
              "Tax": 1500,
              "PublishedFare": 6500,
              "OfferedFare": 6000,
              "NetPayable": 6000,
              "TaxBreakup": [
                { "key": "YQ", "value": 500 },
                { "key": "YR", "value": 1000 }
              ]
            },
            "FareBreakdown": [
              {
                "PassengerType": 1,
                "PassengerCount": 1,
                "BaseFare": 5000,
                "Tax": 1500
              }
            ]
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
    "tboFlightCount": 10,
    "airiqFlightCount": 5,
    "totalFlightCount": 15
  }
}
```

**Error Response (400):**
```json
{
  "error": "Departure date cannot be in the past"
}
```

---

### Fare Rules

#### Get Fare Rules
**Endpoint**: `POST /api/travel/fare-rules` (TBO) or `POST /api/travel/airiq/fare-rules` (AirIQ)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body (TBO):**
```json
{
  "TraceId": "trace-id-123",
  "ResultIndex": "result-index-1",
  "EndUserIp": "192.168.1.1"
}
```

**Request Body (AirIQ):**
```json
{
  "traceId": "trace-id-123",
  "resultIndex": "result-index-1",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiq-trackid-123",
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

**Response (200 OK):**
```json
{
  "Response": {
    "Error": {
      "ErrorCode": 0,
      "ErrorMessage": ""
    },
    "ResponseStatus": 1,
    "TraceId": "trace-id-123",
    "FareRules": [
      {
        "Origin": "DEL",
        "Destination": "BOM",
        "Airline": "AI",
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

### Fare Quote (Detailed Pricing)

#### Get Fare Quote
**Endpoint**: `POST /api/travel/fare-quote` (TBO)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "TraceId": "trace-id-123",
  "ResultIndex": "result-index-1",
  "EndUserIp": "192.168.1.1"
}
```

**Response (200 OK):**
```json
{
  "Response": {
    "TraceId": "trace-id-123",
    "Results": {
      "ResultIndex": "result-index-1",
      "Fare": {
        "Currency": "INR",
        "BaseFare": 5000,
        "Tax": 1500,
        "PublishedFare": 6500,
        "OfferedFare": 6000,
        "NetPayable": 6000
      },
      "Segments": [...]
    }
  }
}
```

---

### SSR (Special Service Requests)

#### Get SSR Options
**Endpoint**: `POST /api/travel/ssr`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "TraceId": "trace-id-123",
  "ResultIndex": "result-index-1",
  "EndUserIp": "192.168.1.1"
}
```

**Response (200 OK):**
```json
{
  "Response": {
    "TraceId": "trace-id-123",
    "SSR": {
      "Meal": [...],
      "Baggage": [...],
      "Seat": [...]
    }
  }
}
```

---

### Fare Upsell

#### Get Fare Upsell Options
**Endpoint**: `POST /api/travel/fare-upsell`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "TraceId": "trace-id-123",
  "ResultIndex": "result-index-1",
  "EndUserIp": "192.168.1.1",
  "ReturnResultIndex": "return-index-1",
  "AdultCount": 2,
  "ChildCount": 1,
  "InfantCount": 0
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "Response": {
      "TraceId": "trace-id-123",
      "FareUpsell": [...]
    }
  }
}
```

---

### Booking

#### Book Flight (TBO)
**Endpoint**: `POST /api/travel/book` (Note: This endpoint may be for travel bookings, check actual TBO booking endpoint)

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "TraceId": "trace-id-123",
  "ResultIndex": "result-index-1",
  "EndUserIp": "192.168.1.1",
  "Passengers": [
    {
      "Title": "Mr",
      "FirstName": "John",
      "LastName": "Doe",
      "PaxType": 1,
      "DateOfBirth": "1990-01-01",
      "Gender": 1,
      "PassportNo": "A1234567",
      "PassportExpiry": "2030-01-01",
      "AddressLine1": "123 Main St",
      "City": "Mumbai",
      "CountryCode": "IN",
      "CountryName": "India",
      "Nationality": "IN",
      "ContactNo": "9876543210",
      "Email": "john.doe@example.com",
      "IsLeadPax": true
    }
  ],
  "SSRData": {
    "Meal": [...],
    "Baggage": [...],
    "Seat": [...]
  }
}
```

**Response (200 OK):**
```json
{
  "Response": {
    "TraceId": "trace-id-123",
    "BookingId": "booking-123",
    "Status": 1,
    "PNR": "ABC123",
    "BookingStatus": "Confirmed"
  }
}
```

---

## AirIQ API Documentation

### Authentication

#### 1. Direct AirIQ Authentication (Server-Side)
**Direct API Endpoint**: `POST http://airiqnewapi.mywebcheck.in/TravelAPI.svc/Login`

**Request Headers:**
```
Content-Type: application/json
Authorization: QVFBRzA2MDI3MCo3NTA2MjA5MjE3Ojc1MDYyMDkyMTc=
```

**Request Body:**
```json
{
  "AgentId": "AQAG060270",
  "Username": "7506209217",
  "Password": "7506209217"
}
```

**Response:**
```json
{
  "AgentID": "AQAG060270",
  "Status": {
    "Error": "",
    "ResultCode": "1",
    "SequenceID": "12345"
  },
  "TerminalID": "terminal-id",
  "Token": "airiq-token-here",
  "UserName": "7506209217"
}
```

**Token Details:**
- Token expires at end of day (11:59:59 PM)
- Maximum 5 concurrent logins per account
- Token is sent in header as `TOKEN` (all caps) for all API requests
- Authorization header is Base64 encoded `AgentID*Username:Password`

---

### Flight Search

#### Search Flights (AirIQ)
**Endpoint**: `POST /api/travel/flights/search` (Same as TBO, returns both TBO and AirIQ results)

**Note:** AirIQ search is automatically included in the main search endpoint. The response includes both `TboResults` and `AiriqResults` arrays.

**Request Body:** Same as TBO search request

**Response:** Same format as TBO, but flights from AirIQ will have `"ApiSource": "AIRiQ"` and include `_airiqOriginal` data structure.

---

### Pricing (Re-pricing)

#### Get Pricing
**Endpoint**: `POST /api/travel/airiq/pricing`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "traceId": "trace-id-123",
  "resultIndex": "result-index-1",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiq-trackid-123",
      "FlightDetails": [
        {
          "FlightID": "12345",
          "FlightNumber": "AI101",
          "Origin": "DEL",
          "Destination": "BOM",
          "DepartureDateTime": "2025-01-15T10:30:00",
          "ArrivalDateTime": "2025-01-15T12:45:00"
        }
      ],
      "Fares": [
        {
          "Faredescription": [
            {
              "BaseAmount": "5000.00",
              "GrossAmount": "6500.00",
              "TotalTaxAmount": "1500.00"
            }
          ]
        }
      ]
    },
    "Fare": {
      "BaseFare": 5000,
      "PublishedFare": 6500
    }
  },
  "returnFlight": null,
  "adultCount": 1,
  "childCount": 0,
  "infantCount": 0
}
```

**Response (200 OK):**
```json
{
  "ResponseStatus": {
    "ResultCode": "1",
    "Error": "",
    "SequenceID": "12345"
  },
  "PriceItenaryInfo": [
    {
      "Trackid": "new-trackid-from-pricing",
      "FlightDetails": [
        {
          "FlightID": "new-flight-id",
          "FlightNumber": "AI101",
          "Origin": "DEL",
          "Destination": "BOM",
          "DepartureDateTime": "15 JAN 2025 10:30",
          "ArrivalDateTime": "15 JAN 2025 12:45"
        }
      ],
      "AvailabilityResponse": [
        {
          "Flights": [...]
        }
      ],
      "FareDetails": {
        "BaseAmount": "5000.00",
        "GrossAmount": "6500.00",
        "TaxAmount": "1500.00"
      },
      "SSRDetails": {
        "Meal": [...],
        "Baggage": [...],
        "Seat": [...]
      }
    }
  ]
}
```

**Important Notes:**
- The `Trackid` returned from Pricing API is DIFFERENT from the search Trackid
- The `FlightID` returned from Pricing API is DIFFERENT from the search FlightID
- These new values MUST be used for subsequent Seat Map and Booking calls

---

### Fare Rules

#### Get Fare Rules (AirIQ)
**Endpoint**: `POST /api/travel/airiq/fare-rules`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "traceId": "trace-id-123",
  "resultIndex": "result-index-1",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiq-trackid-123",
      "FlightDetails": [
        {
          "FlightID": "12345",
          "Origin": "DEL",
          "Destination": "BOM",
          "AirlineDescription": "AI",
          "FareBasisCode": "Y"
        }
      ]
    }
  }
}
```

**Response (200 OK):**
```json
{
  "Response": {
    "Error": {
      "ErrorCode": 0,
      "ErrorMessage": ""
    },
    "ResponseStatus": 1,
    "TraceId": "airiq-trackid-123",
    "FareRules": [
      {
        "Origin": "DEL",
        "Destination": "BOM",
        "Airline": "AI",
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

### Seat Map

#### Get Seat Map
**Endpoint**: `POST /api/travel/airiq/seat-map`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "traceId": "trace-id-123",
  "resultIndex": "result-index-1",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiq-trackid-123",
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
        "Trackid": "new-trackid-from-pricing",
        "FlightDetails": [
          {
            "FlightID": "new-flight-id",
            "FlightNumber": "AI101",
            "Origin": "DEL",
            "Destination": "BOM",
            "DepartureDateTime": "15 JAN 2025 10:30",
            "ArrivalDateTime": "15 JAN 2025 12:45"
          }
        ]
      }
    ]
  }
}
```

**Important Notes:**
- `pricingData` is REQUIRED - must call Pricing API first
- Use `Trackid` from Pricing response (not search response)
- Use `FlightID` from Pricing response (not search response)

**Response (200 OK):**
```json
{
  "FlightSeat": [
    {
      "FlightNumber": "AI101",
      "Origin": "DEL",
      "Destination": "BOM",
      "DepartureDateTime": "15 JAN 2025 10:30",
      "SeatMap": {
        "Rows": [
          {
            "RowNumber": "1",
            "Seats": [
              {
                "SeatNumber": "1A",
                "SeatType": "Window",
                "Availability": "Available",
                "Price": 500
              }
            ]
          }
        ]
      }
    }
  ],
  "ResponseStatus": {
    "ResultCode": "1",
    "Error": "",
    "SequenceID": "12345"
  }
}
```

---

### Booking

#### Book Flight (AirIQ)
**Endpoint**: `POST /api/travel/airiq/book`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "traceId": "trace-id-123",
  "resultIndex": "result-index-1",
  "passengers": [
    {
      "Title": "Mr",
      "FirstName": "John",
      "LastName": "Doe",
      "DateOfBirth": "1990-01-01",
      "Gender": 1,
      "PassportNo": "A1234567",
      "PassportExpiry": "2030-01-01",
      "AddressLine1": "123 Main St",
      "City": "Mumbai",
      "CountryCode": "IN",
      "CountryName": "India",
      "Nationality": "IN",
      "ContactNo": "9876543210",
      "Email": "john.doe@example.com",
      "IsLeadPax": true,
      "FFAirlineCode": "",
      "FFNumber": "",
      "GSTCompanyName": "",
      "GSTNumber": "",
      "GSTCompanyAddress": "",
      "GSTCompanyContactNumber": "",
      "GSTCompanyEmail": ""
    }
  ],
  "ssrData": {
    "seats": {},
    "meals": {},
    "baggage": {}
  },
  "flightData": {
    "Origin": {...},
    "Destination": {...},
    "Fare": {...}
  },
  "adultCount": 1,
  "childCount": 0,
  "infantCount": 0
}
```

**Response (200 OK):**
```json
{
  "Response": {
    "Status": 1,
    "BookingId": 12345,
    "Error": {
      "ErrorCode": 0,
      "ErrorMessage": ""
    },
    "PNR": "ABC123",
    "AirlinePNR": "XYZ789",
    "BookingStatus": "Confirmed"
  }
}
```

---

### Post-Booking SSR

#### Get Post-Booking SSR
**Endpoint**: `POST /api/travel/airiq/ssr`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "airiqPNR": "ABC123",
  "airlinePNR": "XYZ789"
}
```

**Response (200 OK):**
```json
{
  "Status": {
    "ResultCode": "1",
    "Error": "",
    "SequenceID": "12345"
  },
  "SSRDetails": {
    "Meal": [...],
    "Baggage": [...],
    "Seat": [...]
  }
}
```

---

## Common Request/Response Patterns

### Error Response Format

**TBO Error:**
```json
{
  "Error": {
    "ErrorCode": 1,
    "ErrorMessage": "Error message here"
  }
}
```

**AirIQ Error:**
```json
{
  "Status": {
    "ResultCode": "0",
    "Error": "Error message here",
    "SequenceID": "12345"
  }
}
```

### Journey Type Values

- `"1"` = One-way
- `"2"` = Round-trip
- `"3"` = Multi-city

### Cabin Class Values

- `"1"` = Economy
- `"4"` = Business
- `"6"` = First

### Passenger Type Values

- `1` = Adult
- `2` = Child
- `3` = Infant

### Gender Values

- `1` = Male
- `2` = Female

---

## Implementation Notes for Flutter

### 1. Token Management
- TBO tokens are managed server-side and automatically included in requests
- AirIQ tokens are managed server-side and sent in `TOKEN` header
- No need to handle token refresh in Flutter app

### 2. Error Handling
- Always check `success` field in response
- Check `Error.ErrorCode` for TBO (0 = success)
- Check `Status.ResultCode` for AirIQ ("1" = success)

### 3. Date Formats
- Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss`
- Example: `"2025-01-15T10:30:00"`

### 4. AirIQ Special Requirements
- Always call Pricing API before Seat Map
- Use Trackid and FlightID from Pricing response (not search response)
- Store `_airiqOriginal` data from search response for subsequent calls

### 5. Request Headers
- Always include `Content-Type: application/json` for POST requests
- No authentication headers needed (handled server-side)

---

## Complete Endpoint List

### TBO Endpoints
1. `GET /api/travel/auth` - Get token status
2. `POST /api/travel/auth` - Refresh token
3. `DELETE /api/travel/auth` - Clear token cache
4. `POST /api/travel/flights/search` - Search flights
5. `POST /api/travel/fare-rules` - Get fare rules
6. `POST /api/travel/fare-quote` - Get fare quote
7. `POST /api/travel/ssr` - Get SSR options
8. `POST /api/travel/fare-upsell` - Get fare upsell options
9. `POST /api/travel/book` - Book flight (if implemented)

### AirIQ Endpoints
1. `POST /api/travel/flights/search` - Search flights (same as TBO, returns both)
2. `POST /api/travel/airiq/pricing` - Get pricing
3. `POST /api/travel/airiq/fare-rules` - Get fare rules
4. `POST /api/travel/airiq/seat-map` - Get seat map
5. `POST /api/travel/airiq/book` - Book flight
6. `POST /api/travel/airiq/ssr` - Get post-booking SSR

---

## Testing

### Test Authentication
```bash
# TBO
curl -X GET http://localhost:3000/api/travel/auth

# AirIQ (via search endpoint)
curl -X POST http://localhost:3000/api/travel/flights/search \
  -H "Content-Type: application/json" \
  -d '{"Origin":"DEL","Destination":"BOM","PreferredDepartureTime":"2025-01-15T00:00:00","JourneyType":"1","AdultCount":"1","ChildCount":"0","InfantCount":"0","FlightCabinClass":"1"}'
```

---

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Ensure dates are not in the past
4. Verify airport codes are valid IATA codes

---

**Last Updated:** 2025-01-15
**Version:** 1.0
