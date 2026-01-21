# Flutter Integration Plan: Roundtrip & Multi-City Flights

## Overview

This document provides a comprehensive guide for integrating roundtrip and multi-city flight functionality in your Flutter app with the Next.js backend API. It covers critical implementation details about how results are structured, how to handle API source separation, and how to correctly display flight results.

---

## Table of Contents

1. [Critical Concepts](#critical-concepts)
2. [API Response Structure](#api-response-structure)
3. [Roundtrip Flight Integration](#roundtrip-flight-integration)
4. [Multi-City Flight Integration](#multi-city-flight-integration)
5. [Flutter Implementation Guide](#flutter-implementation-guide)
6. [API Source Handling](#api-source-handling)
7. [Display Logic Examples](#display-logic-examples)
8. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## Critical Concepts

### 🔴 IMPORTANT: API Source Separation

**The backend ensures that TBO and AirIQ flights are NEVER mixed together:**

- ✅ **Roundtrip**: Outbound and return flights are ALWAYS from the same API source (TBO↔TBO, AirIQ↔AirIQ)
- ✅ **Multi-City**: Only TBO results are returned (AirIQ doesn't support multi-city)
- ✅ Each flight has an `ApiSource` field: `"TBO"` or `"AIRiQ"`

**Why this matters:**
- Different booking endpoints for TBO vs AirIQ
- Different pricing structures
- Different fare rules and policies
- Booking must use the same API source as the search

---

## API Response Structure

### Search Endpoint

**Endpoint**: `POST /api/travel/flights/search`

**Base URL**: Your Next.js server (e.g., `https://your-domain.com/api/travel/flights/search`)

### Response Structure

```typescript
{
  "success": boolean,
  "data": {
    "Response": {
      "TraceId": string,              // Required for booking/pricing
      "Results": Array<FlightResult[]>, // Structure varies by journey type
      "TboResults": Array<FlightResult[]>, // Only TBO flights
      "AiriqResults": Array<FlightResult[]>, // Only AirIQ flights
      "Error"?: {...}
    }
  },
  "sources": {
    "tbo": boolean,    // Whether TBO search succeeded
    "airiq": boolean   // Whether AirIQ search succeeded
  },
  "stats": {
    "tboFlightCount": number,
    "airiqFlightCount": number,
    "totalFlightCount": number
  }
}
```

### FlightResult Structure

```typescript
{
  "ResultIndex": string,           // Required for booking/pricing
  "ReturnResultIndex"?: string,    // For roundtrip return flight
  "ApiSource": "TBO" | "AIRiQ",   // CRITICAL: Identifies provider
  "AirlineCode": string,
  "ValidatingAirlineCode": string,
  "IsLCC": boolean,
  "IsRefundable": boolean,
  "IsUpsellAllowed"?: boolean,
  "Fare": {
    "Currency": string,
    "BaseFare": number,
    "Tax": number,
    "OfferedFare": number,
    "PublishedFare": number,
    "NetPayable": number,          // Final price to display
    // ... other fare components
  },
  "Segments": Array<FlightSegmentDetail[]>, // Structure varies by journey type
  "FareBreakdown": Array<{...}>,
  // ... other fields
}
```

---

## Roundtrip Flight Integration

### Request Format

```json
{
  "Origin": "DEL",
  "Destination": "BOM",
  "PreferredDepartureTime": "2025-01-15T00:00:00",
  "ReturnPreferredDepartureTime": "2025-01-20T00:00:00",
  "JourneyType": "2",
  "AdultCount": "1",
  "ChildCount": "0",
  "InfantCount": "0",
  "FlightCabinClass": "1"
}
```

### Response Structure (Roundtrip)

**Key Point**: The Next.js backend **pre-combines** outbound and return flights. You receive a single array of combined flight results.

```typescript
{
  "success": true,
  "data": {
    "Response": {
      "TraceId": "trace-123",
      "Results": [
        // Array of PRE-COMBINED roundtrip flights
        [
          {
            "ResultIndex": "outbound-idx-1",
            "ReturnResultIndex": "return-idx-1",  // Return flight reference
            "ApiSource": "TBO",
            "Fare": {
              // Combined fare (outbound + return)
              "NetPayable": 15000,  // Total for both flights
              "OfferedFare": 15000,
              "BaseFare": 12000,
              "Tax": 3000
            },
            "Segments": [
              // Index 0: Outbound segments
              [
                {
                  "Origin": {...},
                  "Destination": {...},
                  "Airline": {...},
                  "DepTime": "2025-01-15T10:30:00",
                  "ArrTime": "2025-01-15T12:45:00",
                  "Duration": 135
                }
              ],
              // Index 1: Return segments
              [
                {
                  "Origin": {...},
                  "Destination": {...},
                  "Airline": {...},
                  "DepTime": "2025-01-20T14:00:00",
                  "ArrTime": "2025-01-20T16:15:00",
                  "Duration": 135
                }
              ]
            ]
          },
          {
            "ResultIndex": "outbound-idx-2",
            "ReturnResultIndex": "return-idx-2",
            "ApiSource": "AIRiQ",  // Different API source
            "Fare": {...},
            "Segments": [...]
          }
        ]
      ]
    }
  }
}
```

### Important Notes for Roundtrip

1. **Results Array Structure**: 
   - `Results[0]` contains ALL combined roundtrip flights
   - Each flight has `Segments[0]` (outbound) and `Segments[1]` (return)

2. **API Source Consistency**:
   - Each combined flight has a single `ApiSource` value
   - Both outbound and return are from the same provider
   - If no matching return flight exists for an outbound, that combination is **not included**

3. **Fare Display**:
   - `Fare.NetPayable` is the **total price for both flights**
   - Don't split or double the price
   - Display as: "₹15,000" (for both flights combined)

4. **Segment Access**:
   ```dart
   // Access outbound segments
   final outboundSegments = flight.segments[0];
   
   // Access return segments
   final returnSegments = flight.segments[1];
   ```

---

## Multi-City Flight Integration

### Request Format

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
    },
    {
      "Origin": "BLR",
      "Destination": "HYD",
      "PreferredDepartureTime": "2025-01-25T00:00:00"
    }
  ]
}
```

### Response Structure (Multi-City)

**Key Point**: Multi-city flights come **pre-combined** from the TBO API. All segments are in a single flight object.

```typescript
{
  "success": true,
  "data": {
    "Response": {
      "TraceId": "trace-123",
      "Results": [
        // Array of multi-city flights (all segments combined)
        [
          {
            "ResultIndex": "multi-idx-1",
            "ApiSource": "TBO",  // Always TBO for multi-city
            "Fare": {
              "NetPayable": 25000,  // Total for ALL segments
              "OfferedFare": 25000,
              "BaseFare": 20000,
              "Tax": 5000
            },
            "Segments": [
              // All segments in order (DEL->BOM->BLR->HYD)
              [
                {
                  // Segment 1: DEL -> BOM
                  "Origin": {"Airport": {"AirportCode": "DEL", ...}},
                  "Destination": {"Airport": {"AirportCode": "BOM", ...}},
                  "DepTime": "2025-01-15T10:30:00",
                  "ArrTime": "2025-01-15T12:45:00"
                }
              ],
              [
                {
                  // Segment 2: BOM -> BLR
                  "Origin": {"Airport": {"AirportCode": "BOM", ...}},
                  "Destination": {"Airport": {"AirportCode": "BLR", ...}},
                  "DepTime": "2025-01-20T14:00:00",
                  "ArrTime": "2025-01-20T15:30:00"
                }
              ],
              [
                {
                  // Segment 3: BLR -> HYD
                  "Origin": {"Airport": {"AirportCode": "BLR", ...}},
                  "Destination": {"Airport": {"AirportCode": "HYD", ...}},
                  "DepTime": "2025-01-25T09:00:00",
                  "ArrTime": "2025-01-25T10:15:00"
                }
              ]
            ]
          }
        ]
      ]
    }
  },
  "sources": {
    "tbo": true,
    "airiq": false  // Always false for multi-city
  }
}
```

### Important Notes for Multi-City

1. **API Source**: 
   - Multi-city is **ALWAYS TBO only**
   - AirIQ doesn't support multi-city searches
   - `sources.airiq` will always be `false`

2. **Results Array Structure**:
   - `Results[0]` contains ALL multi-city flights
   - Each flight has `Segments` array with all journey segments

3. **Segment Access**:
   ```dart
   // Access all segments
   final allSegments = flight.segments;
   
   // Access specific segment (e.g., segment 2)
   final segment2 = flight.segments[1];
   
   // Get origin of first segment
   final origin = flight.segments[0][0].origin.airport.airportCode;
   
   // Get destination of last segment
   final finalDestination = flight.segments.last.last.destination.airport.airportCode;
   ```

4. **Fare Display**:
   - `Fare.NetPayable` is the **total price for ALL segments combined**
   - Display as: "₹25,000" (for entire journey)

---

## Flutter Implementation Guide

### 1. Data Models

```dart
// Flight Result Model
class FlightResult {
  final String resultIndex;
  final String? returnResultIndex;  // For roundtrip
  final String? apiSource;          // "TBO" or "AIRiQ"
  final Fare? fare;
  final List<List<FlightSegmentDetail>> segments;
  final String airlineCode;
  final bool isRefundable;
  final bool isLCC;
  
  // Helper methods
  bool get isFromTbo => apiSource == "TBO";
  bool get isFromAiriq => apiSource == "AIRiQ";
  bool get isRoundtrip => returnResultIndex != null;
  
  // Get outbound segments (roundtrip)
  List<FlightSegmentDetail>? get outboundSegments => 
    isRoundtrip && segments.isNotEmpty ? segments[0] : null;
  
  // Get return segments (roundtrip)
  List<FlightSegmentDetail>? get returnSegments => 
    isRoundtrip && segments.length > 1 ? segments[1] : null;
  
  // Get all segments (multi-city or one-way)
  List<List<FlightSegmentDetail>> get allSegments => segments;
}

// Flight Search Response Model
class FlightSearchResponse {
  final bool success;
  final FlightSearchData? data;
  final ApiSources? sources;
  final FlightStats? stats;
}

class FlightSearchData {
  final FlightResponse response;
}

class FlightResponse {
  final String traceId;
  final List<List<FlightResult>> results;  // Structure varies by journey type
  final List<List<FlightResult>>? tboResults;
  final List<List<FlightResult>>? airiqResults;
}

// Helper: Extract flights based on journey type
extension FlightResponseExtension on FlightResponse {
  // For one-way: Results[0] contains all flights
  List<FlightResult> get oneWayFlights => 
    results.isNotEmpty ? results[0] : [];
  
  // For roundtrip: Results[0] contains all combined flights
  List<FlightResult> get roundtripFlights => 
    results.isNotEmpty ? results[0] : [];
  
  // For multi-city: Results[0] contains all flights
  List<FlightResult> get multiCityFlights => 
    results.isNotEmpty ? results[0] : [];
}
```

### 2. API Service

```dart
class FlightService {
  final String baseUrl;
  
  Future<FlightSearchResponse> searchFlights({
    required String journeyType,  // "1", "2", or "3"
    String? origin,
    String? destination,
    String? preferredDepartureTime,
    String? returnPreferredDepartureTime,
    List<FlightSegment>? segments,  // For multi-city
    required String adultCount,
    String childCount = "0",
    String infantCount = "0",
    String flightCabinClass = "1",
  }) async {
    final requestBody = <String, dynamic>{
      "JourneyType": journeyType,
      "AdultCount": adultCount,
      "ChildCount": childCount,
      "InfantCount": infantCount,
      "FlightCabinClass": flightCabinClass,
    };
    
    // Add fields based on journey type
    if (journeyType == "1" || journeyType == "2") {
      // One-way or Roundtrip
      requestBody["Origin"] = origin;
      requestBody["Destination"] = destination;
      requestBody["PreferredDepartureTime"] = preferredDepartureTime;
      
      if (journeyType == "2") {
        requestBody["ReturnPreferredDepartureTime"] = returnPreferredDepartureTime;
      }
    } else if (journeyType == "3") {
      // Multi-city
      requestBody["Segments"] = segments?.map((s) => {
        "Origin": s.origin,
        "Destination": s.destination,
        "PreferredDepartureTime": s.preferredDepartureTime,
      }).toList();
    }
    
    final response = await http.post(
      Uri.parse("$baseUrl/api/travel/flights/search"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode(requestBody),
    );
    
    if (response.statusCode == 200) {
      return FlightSearchResponse.fromJson(jsonDecode(response.body));
    } else {
      throw Exception("Flight search failed: ${response.statusCode}");
    }
  }
}
```

### 3. Display Logic for Roundtrip

```dart
Widget buildRoundtripFlightCard(FlightResult flight) {
  // Verify it's a roundtrip flight
  if (!flight.isRoundtrip) {
    return SizedBox.shrink();
  }
  
  final outbound = flight.outboundSegments?.firstOrNull;
  final returnFlight = flight.returnSegments?.firstOrNull;
  
  if (outbound == null || returnFlight == null) {
    return SizedBox.shrink();
  }
  
  return Card(
    child: Column(
      children: [
        // Outbound Flight
        _buildFlightSegment(
          title: "Outbound",
          origin: outbound.origin.airport.airportCode,
          destination: outbound.destination.airport.airportCode,
          departureTime: outbound.depTime,
          arrivalTime: outbound.arrTime,
          airline: flight.airlineCode,
        ),
        
        Divider(),
        
        // Return Flight
        _buildFlightSegment(
          title: "Return",
          origin: returnFlight.origin.airport.airportCode,
          destination: returnFlight.destination.airport.airportCode,
          departureTime: returnFlight.depTime,
          arrivalTime: returnFlight.arrTime,
          airline: flight.airlineCode,
        ),
        
        Divider(),
        
        // Combined Price
        Text(
          "Total: ${formatPrice(flight.fare?.netPayable ?? 0)}",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        // API Source Badge
        Chip(
          label: Text(flight.apiSource ?? "Unknown"),
          backgroundColor: flight.isFromTbo 
            ? Colors.blue.withOpacity(0.2) 
            : Colors.green.withOpacity(0.2),
        ),
      ],
    ),
  );
}
```

### 4. Display Logic for Multi-City

```dart
Widget buildMultiCityFlightCard(FlightResult flight) {
  if (flight.segments.isEmpty) {
    return SizedBox.shrink();
  }
  
  // Build route string (DEL → BOM → BLR → HYD)
  final routeParts = <String>[];
  for (var segmentGroup in flight.segments) {
    if (segmentGroup.isNotEmpty) {
      final segment = segmentGroup.first;
      if (routeParts.isEmpty) {
        routeParts.add(segment.origin.airport.airportCode);
      }
      routeParts.add(segment.destination.airport.airportCode);
    }
  }
  final routeString = routeParts.join(" → ");
  
  return Card(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Route Header
        Text(
          routeString,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        SizedBox(height: 16),
        
        // All Segments
        ...flight.segments.asMap().entries.map((entry) {
          final index = entry.key;
          final segmentGroup = entry.value;
          
          if (segmentGroup.isEmpty) return SizedBox.shrink();
          
          final segment = segmentGroup.first;
          
          return Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: _buildFlightSegment(
              title: "Segment ${index + 1}",
              origin: segment.origin.airport.airportCode,
              destination: segment.destination.airport.airportCode,
              departureTime: segment.depTime,
              arrivalTime: segment.arrTime,
              airline: flight.airlineCode,
            ),
          );
        }).toList(),
        
        Divider(),
        
        // Total Price
        Text(
          "Total: ${formatPrice(flight.fare?.netPayable ?? 0)}",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        // TBO Badge (multi-city is always TBO)
        Chip(
          label: Text("TBO"),
          backgroundColor: Colors.blue.withOpacity(0.2),
        ),
      ],
    ),
  );
}
```

### 5. Filtering by API Source

```dart
// Filter flights by provider
List<FlightResult> filterByProvider(
  List<FlightResult> flights,
  String? apiSource,
) {
  if (apiSource == null) return flights;
  return flights.where((f) => f.apiSource == apiSource).toList();
}

// Get separate lists
extension FlightResultListExtension on List<FlightResult> {
  List<FlightResult> get tboFlights => 
    where((f) => f.isFromTbo).toList();
  
  List<FlightResult> get airiqFlights => 
    where((f) => f.isFromAiriq).toList();
}
```

---

## API Source Handling

### Why API Source Matters

1. **Booking Endpoint**: 
   - TBO flights → `/api/travel/book` (TBO booking endpoint)
   - AirIQ flights → `/api/travel/airiq/book` (AirIQ booking endpoint)

2. **Pricing Endpoint**:
   - TBO flights → `/api/travel/pricing` (TBO pricing endpoint)
   - AirIQ flights → `/api/travel/airiq/pricing` (AirIQ pricing endpoint)

3. **Fare Upsell**:
   - TBO flights → `/api/travel/fare-upsell` (TBO upsell endpoint)
   - AirIQ flights → Upsell may not be available

### Implementation Example

```dart
void handleFlightSelection(FlightResult flight) {
  // Store API source for booking
  selectedFlight = flight;
  selectedApiSource = flight.apiSource;
  
  // Navigate to booking page
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => BookingPage(
        flight: flight,
        apiSource: flight.apiSource,
      ),
    ),
  );
}

// In BookingPage
Future<void> bookFlight() async {
  String endpoint;
  
  if (apiSource == "TBO") {
    endpoint = "/api/travel/book";
  } else if (apiSource == "AIRiQ") {
    endpoint = "/api/travel/airiq/book";
  } else {
    throw Exception("Unknown API source: $apiSource");
  }
  
  // Proceed with booking using correct endpoint
  await bookingService.book(flight, endpoint);
}
```

---

## Display Logic Examples

### Roundtrip Flight List

```dart
class RoundtripFlightList extends StatelessWidget {
  final List<FlightResult> flights;
  
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: flights.length,
      itemBuilder: (context, index) {
        final flight = flights[index];
        
        return buildRoundtripFlightCard(flight);
      },
    );
  }
  
  Widget buildRoundtripFlightCard(FlightResult flight) {
    final outbound = flight.outboundSegments?.firstOrNull;
    final returnFlight = flight.returnSegments?.firstOrNull;
    
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ExpansionTile(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "${outbound?.origin.airport.airportCode ?? ""} → ${outbound?.destination.airport.airportCode ?? ""}",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            Text(
              formatPrice(flight.fare?.netPayable ?? 0),
              style: TextStyle(
                color: Colors.green,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        subtitle: Text("${outbound?.origin.airport.airportCode ?? ""} ↔ ${returnFlight?.destination.airport.airportCode ?? ""}"),
        children: [
          // Outbound details
          ListTile(
            leading: Icon(Icons.flight_takeoff),
            title: Text("Outbound"),
            subtitle: Text(
              "${formatTime(outbound?.depTime)} - ${formatTime(outbound?.arrTime)}",
            ),
          ),
          // Return details
          ListTile(
            leading: Icon(Icons.flight_land),
            title: Text("Return"),
            subtitle: Text(
              "${formatTime(returnFlight?.depTime)} - ${formatTime(returnFlight?.arrTime)}",
            ),
          ),
          // API Source badge
          Padding(
            padding: EdgeInsets.all(8),
            child: Align(
              alignment: Alignment.centerRight,
              child: Chip(
                label: Text(flight.apiSource ?? "Unknown"),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
```

### Multi-City Flight List

```dart
class MultiCityFlightList extends StatelessWidget {
  final List<FlightResult> flights;
  
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: flights.length,
      itemBuilder: (context, index) {
        final flight = flights[index];
        return buildMultiCityFlightCard(flight);
      },
    );
  }
  
  Widget buildMultiCityFlightCard(FlightResult flight) {
    // Build route summary
    final route = _buildRouteSummary(flight.segments);
    
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ExpansionTile(
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Text(
                route,
                style: TextStyle(fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Text(
              formatPrice(flight.fare?.netPayable ?? 0),
              style: TextStyle(
                color: Colors.green,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        subtitle: Text("${flight.segments.length} segments"),
        children: [
          // All segments
          ...flight.segments.asMap().entries.map((entry) {
            final index = entry.key;
            final segmentGroup = entry.value;
            
            if (segmentGroup.isEmpty) return SizedBox.shrink();
            
            final segment = segmentGroup.first;
            
            return ListTile(
              leading: CircleAvatar(
                child: Text("${index + 1}"),
              ),
              title: Text(
                "${segment.origin.airport.airportCode} → ${segment.destination.airport.airportCode}",
              ),
              subtitle: Text(
                "${formatTime(segment.depTime)} - ${formatTime(segment.arrTime)}",
              ),
            );
          }).toList(),
        ],
      ),
    );
  }
  
  String _buildRouteSummary(List<List<FlightSegmentDetail>> segments) {
    if (segments.isEmpty) return "";
    
    final routeParts = <String>[];
    
    // Add origin of first segment
    final firstSegment = segments.first.firstOrNull;
    if (firstSegment != null) {
      routeParts.add(firstSegment.origin.airport.airportCode);
    }
    
    // Add destination of each segment
    for (var segmentGroup in segments) {
      final segment = segmentGroup.firstOrNull;
      if (segment != null) {
        routeParts.add(segment.destination.airport.airportCode);
      }
    }
    
    return routeParts.join(" → ");
  }
}
```

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Mixing API Sources in Roundtrip

**Wrong:**
```dart
// DON'T: Try to combine TBO outbound with AirIQ return
final outbound = tboFlights.first;
final returnFlight = airiqFlights.first;
```

**Correct:**
```dart
// DO: Use pre-combined flights from response
final roundtripFlights = response.response.roundtripFlights;
// Each flight already has matching outbound + return from same provider
```

### ❌ Pitfall 2: Splitting Roundtrip Price

**Wrong:**
```dart
// DON'T: Display price per flight
final pricePerFlight = flight.fare.netPayable / 2;
Text("Outbound: $pricePerFlight, Return: $pricePerFlight");
```

**Correct:**
```dart
// DO: Display total combined price
Text("Total: ${formatPrice(flight.fare.netPayable)}");
```

### ❌ Pitfall 3: Wrong Endpoint for Booking

**Wrong:**
```dart
// DON'T: Always use TBO endpoint
await bookFlight(flight, "/api/travel/book");
```

**Correct:**
```dart
// DO: Check API source first
final endpoint = flight.isFromTbo 
  ? "/api/travel/book" 
  : "/api/travel/airiq/book";
await bookFlight(flight, endpoint);
```

### ❌ Pitfall 4: Not Handling Missing Segments

**Wrong:**
```dart
// DON'T: Assume segments always exist
final outbound = flight.segments[0][0];  // Crashes if empty
```

**Correct:**
```dart
// DO: Check and handle nulls
final outbound = flight.outboundSegments?.firstOrNull;
if (outbound == null) {
  return SizedBox.shrink();
}
```

### ❌ Pitfall 5: Ignoring ReturnResultIndex for Roundtrip

**Wrong:**
```dart
// DON'T: Only use ResultIndex for booking roundtrip
await bookFlight(flight.resultIndex);
```

**Correct:**
```dart
// DO: Include ReturnResultIndex for roundtrip
final bookingRequest = {
  "ResultIndex": flight.resultIndex,
  if (flight.returnResultIndex != null)
    "ReturnResultIndex": flight.returnResultIndex,
};
```

---

## Testing Checklist

### Roundtrip Testing

- [ ] Verify outbound and return flights are from same API source
- [ ] Display combined price correctly (not split)
- [ ] Show both outbound and return segments
- [ ] Handle missing return flights gracefully
- [ ] Use correct booking endpoint based on ApiSource
- [ ] Include ReturnResultIndex in booking request

### Multi-City Testing

- [ ] Verify all flights are from TBO (sources.airiq = false)
- [ ] Display all segments in order
- [ ] Show route summary correctly (A → B → C → D)
- [ ] Display total price for all segments
- [ ] Handle variable number of segments (2, 3, 4+)
- [ ] Use TBO booking endpoint only

### General Testing

- [ ] Handle empty results gracefully
- [ ] Display API source badge/chip
- [ ] Filter by provider correctly
- [ ] Handle network errors
- [ ] Validate TraceId is stored for booking
- [ ] Test with different passenger counts

---

## Summary

### Key Takeaways

1. **Roundtrip**: Results are pre-combined by the backend. Each result contains both outbound and return flights from the same API source. Display as a single combined flight with total price.

2. **Multi-City**: Only TBO results are returned. All segments are in a single flight object. Display all segments in order with total price.

3. **API Source**: Always check `ApiSource` field to determine booking endpoint. Never mix TBO and AirIQ flights.

4. **Price Display**: Always show the total combined price from `Fare.NetPayable`. Don't split or calculate per-segment prices.

5. **Segment Access**: Use array indices carefully - `Segments[0]` for outbound (roundtrip), `Segments[1]` for return (roundtrip), or all segments for multi-city.

---

## Support & Resources

- **Next.js API Documentation**: See `FLUTTER_FLIGHT_API_DOCUMENTATION.md`
- **Connection Plan**: See `FLUTTER_NEXTJS_API_CONNECTION_PLAN.md`
- **Backend Code**: `src/app/api/travel/flights/search/route.ts`
- **Frontend Implementation**: `src/app/(frontend)/travel-portal/components/FlightSearch.tsx`

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
