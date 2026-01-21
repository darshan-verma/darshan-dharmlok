# Flutter App - Next.js Flight API Connection Plan

## Overview

This document provides a comprehensive plan for connecting your Flutter mobile application to the Next.js Flight Booking API. Instead of connecting directly to provider APIs (TBO/AirIQ), the Flutter app will route all flight booking requests through your Next.js backend, ensuring centralized control, authentication, and data management.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Base Configuration](#base-configuration)
3. [API Endpoint Mapping](#api-endpoint-mapping)
4. [Request/Response Models](#requestresponse-models)
5. [Implementation Steps](#implementation-steps)
6. [Error Handling](#error-handling)
7. [Authentication & Security](#authentication--security)
8. [Complete API Reference](#complete-api-reference)
9. [Testing Checklist](#testing-checklist)

---

## Architecture Overview

### Current Flow (Direct Provider Connection)
```
Flutter App → TBO/AirIQ Provider APIs (Direct)
```

### Target Flow (Via Next.js Backend)
```
Flutter App → Next.js API → TBO/AirIQ Provider APIs
```

### Benefits
- ✅ Centralized authentication management
- ✅ Token caching on server (no wasted login attempts)
- ✅ Unified error handling
- ✅ Data logging and analytics
- ✅ Security: API credentials stay on server
- ✅ Easier updates: API changes in one place

---

## Base Configuration

### 1. Environment Setup

Create a configuration file for your Flutter app:

**`lib/config/api_config.dart`**
```dart
class ApiConfig {
  // Development
  static const String devBaseUrl = 'http://localhost:3000/api/travel';
  
  // Production
  static const String prodBaseUrl = 'https://your-domain.com/api/travel';
  
  // Use this to switch between environments
  static String get baseUrl => kDebugMode ? devBaseUrl : prodBaseUrl;
  
  // Timeout duration
  static const Duration timeout = Duration(seconds: 30);
}
```

### 2. HTTP Client Setup

Create a base HTTP service:

**`lib/services/api_service.dart`**
```dart
import 'package:dio/dio.dart';
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late Dio _dio;

  void init() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.timeout,
      receiveTimeout: ApiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors for logging, error handling, etc.
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  Dio get dio => _dio;
}
```

---

## API Endpoint Mapping

### Flight Search Flow

```
1. Search Flights
   POST /api/travel/flights/search
   ↓
2. Get Fare Quote (TBO) / Pricing (AirIQ)
   POST /api/travel/fare-quote (TBO)
   POST /api/travel/airiq/pricing (AirIQ)
   ↓
3. Get Fare Rules
   POST /api/travel/fare-rules (TBO)
   POST /api/travel/airiq/fare-rules (AirIQ)
   ↓
4. Get SSR Options (Seats, Meals, Baggage)
   POST /api/travel/ssr (TBO)
   (AirIQ SSR comes with Pricing response)
   ↓
5. Get Seat Map (AirIQ only)
   POST /api/travel/airiq/seat-map
   ↓
6. Book Flight
   POST /api/travel/airiq/book (AirIQ)
   (TBO booking endpoint if available)
```

---

## Request/Response Models

### 1. Flight Search Request

**Model: `lib/models/flight_search_request.dart`**
```dart
class FlightSearchRequest {
  final String origin;
  final String destination;
  final DateTime preferredDepartureTime;
  final DateTime? returnPreferredDepartureTime;
  final String journeyType; // "1" = One-way, "2" = Round-trip, "3" = Multi-city
  final String adultCount;
  final String childCount;
  final String infantCount;
  final String flightCabinClass; // "1" = Economy, "4" = Business, "6" = First
  final List<String>? preferredAirlines;
  final List<FlightSegment>? segments; // For multi-city

  FlightSearchRequest({
    required this.origin,
    required this.destination,
    required this.preferredDepartureTime,
    this.returnPreferredDepartureTime,
    required this.journeyType,
    required this.adultCount,
    required this.childCount,
    required this.infantCount,
    required this.flightCabinClass,
    this.preferredAirlines,
    this.segments,
  });

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> json = {
      'Origin': origin,
      'Destination': destination,
      'PreferredDepartureTime': preferredDepartureTime.toIso8601String(),
      'JourneyType': journeyType,
      'AdultCount': adultCount,
      'ChildCount': childCount,
      'InfantCount': infantCount,
      'FlightCabinClass': flightCabinClass,
    };

    if (returnPreferredDepartureTime != null) {
      json['ReturnPreferredDepartureTime'] = returnPreferredDepartureTime!.toIso8601String();
    }

    if (preferredAirlines != null && preferredAirlines!.isNotEmpty) {
      json['PreferredAirlines'] = preferredAirlines;
    }

    if (segments != null && segments!.isNotEmpty) {
      json['Segments'] = segments!.map((s) => s.toJson()).toList();
    }

    return json;
  }
}

class FlightSegment {
  final String origin;
  final String destination;
  final DateTime preferredDepartureTime;

  FlightSegment({
    required this.origin,
    required this.destination,
    required this.preferredDepartureTime,
  });

  Map<String, dynamic> toJson() => {
    'Origin': origin,
    'Destination': destination,
    'PreferredDepartureTime': preferredDepartureTime.toIso8601String(),
  };
}
```

### 2. Flight Search Response

**Model: `lib/models/flight_search_response.dart`**
```dart
class FlightSearchResponse {
  final bool success;
  final FlightSearchData? data;
  final Map<String, bool>? sources;
  final FlightStats? stats;
  final String? error;

  FlightSearchResponse({
    required this.success,
    this.data,
    this.sources,
    this.stats,
    this.error,
  });

  factory FlightSearchResponse.fromJson(Map<String, dynamic> json) {
    return FlightSearchResponse(
      success: json['success'] ?? false,
      data: json['data'] != null ? FlightSearchData.fromJson(json['data']) : null,
      sources: json['sources'] != null ? Map<String, bool>.from(json['sources']) : null,
      stats: json['stats'] != null ? FlightStats.fromJson(json['stats']) : null,
      error: json['error'],
    );
  }
}

class FlightSearchData {
  final Response? response;

  FlightSearchData({this.response});

  factory FlightSearchData.fromJson(Map<String, dynamic> json) {
    return FlightSearchData(
      response: json['Response'] != null ? Response.fromJson(json['Response']) : null,
    );
  }
}

class Response {
  final String? traceId;
  final List<List<FlightResult>>? results;
  final List<FlightResult>? tboResults;
  final List<FlightResult>? airiqResults;

  Response({
    this.traceId,
    this.results,
    this.tboResults,
    this.airiqResults,
  });

  factory Response.fromJson(Map<String, dynamic> json) {
    return Response(
      traceId: json['TraceId'],
      results: json['Results'] != null
          ? (json['Results'] as List)
              .map((item) => (item as List)
                  .map((r) => FlightResult.fromJson(r))
                  .toList())
              .toList()
          : null,
      tboResults: json['TboResults'] != null
          ? (json['TboResults'] as List).map((r) => FlightResult.fromJson(r)).toList()
          : null,
      airiqResults: json['AiriqResults'] != null
          ? (json['AiriqResults'] as List).map((r) => FlightResult.fromJson(r)).toList()
          : null,
    );
  }
}

class FlightResult {
  final String? resultIndex;
  final int? source;
  final bool? isLCC;
  final bool? isRefundable;
  final String? airlineCode;
  final String? validatingAirlineCode;
  final String? apiSource; // "TBO" or "AIRiQ" - indicates which provider the flight is from
  final List<List<Segment>>? segments;
  final Fare? fare;
  final List<FareBreakdown>? fareBreakdown;
  final Map<String, dynamic>? airiqOriginal; // Store original AirIQ data

  FlightResult({
    this.resultIndex,
    this.source,
    this.isLCC,
    this.isRefundable,
    this.airlineCode,
    this.validatingAirlineCode,
    this.apiSource,
    this.segments,
    this.fare,
    this.fareBreakdown,
    this.airiqOriginal,
  });

  // Helper methods to check API source
  bool get isFromTbo => apiSource == "TBO";
  bool get isFromAiriq => apiSource == "AIRiQ";

  factory FlightResult.fromJson(Map<String, dynamic> json) {
    return FlightResult(
      resultIndex: json['ResultIndex'],
      source: json['Source'],
      isLCC: json['IsLCC'],
      isRefundable: json['IsRefundable'],
      airlineCode: json['AirlineCode'],
      validatingAirlineCode: json['ValidatingAirlineCode'],
      apiSource: json['ApiSource'], // "TBO" or "AIRiQ"
      segments: json['Segments'] != null
          ? (json['Segments'] as List)
              .map((segmentGroup) => (segmentGroup as List)
                  .map((s) => Segment.fromJson(s))
                  .toList())
              .toList()
          : null,
      fare: json['Fare'] != null ? Fare.fromJson(json['Fare']) : null,
      fareBreakdown: json['FareBreakdown'] != null
          ? (json['FareBreakdown'] as List).map((f) => FareBreakdown.fromJson(f)).toList()
          : null,
      airiqOriginal: json['_airiqOriginal'],
    );
  }
}

class Segment {
  final Airline? airline;
  final AirportInfo? origin;
  final AirportInfo? destination;
  final int? duration;
  final int? groundTime;
  final bool? stopOver;
  final String? baggage;
  final String? cabinBaggage;

  Segment({
    this.airline,
    this.origin,
    this.destination,
    this.duration,
    this.groundTime,
    this.stopOver,
    this.baggage,
    this.cabinBaggage,
  });

  factory Segment.fromJson(Map<String, dynamic> json) {
    return Segment(
      airline: json['Airline'] != null ? Airline.fromJson(json['Airline']) : null,
      origin: json['Origin'] != null ? AirportInfo.fromJson(json['Origin']) : null,
      destination: json['Destination'] != null ? AirportInfo.fromJson(json['Destination']) : null,
      duration: json['Duration'],
      groundTime: json['GroundTime'],
      stopOver: json['StopOver'],
      baggage: json['Baggage'],
      cabinBaggage: json['CabinBaggage'],
    );
  }
}

class Airline {
  final String? airlineCode;
  final String? airlineName;
  final String? flightNumber;
  final String? fareClass;

  Airline({this.airlineCode, this.airlineName, this.flightNumber, this.fareClass});

  factory Airline.fromJson(Map<String, dynamic> json) {
    return Airline(
      airlineCode: json['AirlineCode'],
      airlineName: json['AirlineName'],
      flightNumber: json['FlightNumber'],
      fareClass: json['FareClass'],
    );
  }
}

class AirportInfo {
  final Airport? airport;
  final String? depTime;
  final String? arrTime;

  AirportInfo({this.airport, this.depTime, this.arrTime});

  factory AirportInfo.fromJson(Map<String, dynamic> json) {
    return AirportInfo(
      airport: json['Airport'] != null ? Airport.fromJson(json['Airport']) : null,
      depTime: json['DepTime'],
      arrTime: json['ArrTime'],
    );
  }
}

class Airport {
  final String? airportCode;
  final String? airportName;
  final String? terminal;
  final String? cityCode;
  final String? cityName;
  final String? countryCode;
  final String? countryName;

  Airport({
    this.airportCode,
    this.airportName,
    this.terminal,
    this.cityCode,
    this.cityName,
    this.countryCode,
    this.countryName,
  });

  factory Airport.fromJson(Map<String, dynamic> json) {
    return Airport(
      airportCode: json['AirportCode'],
      airportName: json['AirportName'],
      terminal: json['Terminal'],
      cityCode: json['CityCode'],
      cityName: json['CityName'],
      countryCode: json['CountryCode'],
      countryName: json['CountryName'],
    );
  }
}

class Fare {
  final String? currency;
  final double? baseFare;
  final double? tax;
  final double? publishedFare;
  final double? offeredFare;
  final double? netPayable;
  final List<TaxBreakup>? taxBreakup;

  Fare({
    this.currency,
    this.baseFare,
    this.tax,
    this.publishedFare,
    this.offeredFare,
    this.netPayable,
    this.taxBreakup,
  });

  factory Fare.fromJson(Map<String, dynamic> json) {
    return Fare(
      currency: json['Currency'],
      baseFare: json['BaseFare']?.toDouble(),
      tax: json['Tax']?.toDouble(),
      publishedFare: json['PublishedFare']?.toDouble(),
      offeredFare: json['OfferedFare']?.toDouble(),
      netPayable: json['NetPayable']?.toDouble(),
      taxBreakup: json['TaxBreakup'] != null
          ? (json['TaxBreakup'] as List).map((t) => TaxBreakup.fromJson(t)).toList()
          : null,
    );
  }
}

class TaxBreakup {
  final String? key;
  final double? value;

  TaxBreakup({this.key, this.value});

  factory TaxBreakup.fromJson(Map<String, dynamic> json) {
    return TaxBreakup(
      key: json['key'],
      value: json['value']?.toDouble(),
    );
  }
}

class FareBreakdown {
  final int? passengerType;
  final int? passengerCount;
  final double? baseFare;
  final double? tax;

  FareBreakdown({
    this.passengerType,
    this.passengerCount,
    this.baseFare,
    this.tax,
  });

  factory FareBreakdown.fromJson(Map<String, dynamic> json) {
    return FareBreakdown(
      passengerType: json['PassengerType'],
      passengerCount: json['PassengerCount'],
      baseFare: json['BaseFare']?.toDouble(),
      tax: json['Tax']?.toDouble(),
    );
  }
}

class FlightStats {
  final int? tboFlightCount;
  final int? airiqFlightCount;
  final int? totalFlightCount;

  FlightStats({
    this.tboFlightCount,
    this.airiqFlightCount,
    this.totalFlightCount,
  });

  factory FlightStats.fromJson(Map<String, dynamic> json) {
    return FlightStats(
      tboFlightCount: json['tboFlightCount'],
      airiqFlightCount: json['airiqFlightCount'],
      totalFlightCount: json['totalFlightCount'],
    );
  }
}
```

---

## Implementation Steps

### Step 1: Create API Service Layer

**`lib/services/flight_api_service.dart`**
```dart
import 'package:dio/dio.dart';
import '../models/flight_search_request.dart';
import '../models/flight_search_response.dart';
import 'api_service.dart';

class FlightApiService {
  final ApiService _apiService = ApiService();

  // 1. Search Flights
  Future<FlightSearchResponse> searchFlights(FlightSearchRequest request) async {
    try {
      final response = await _apiService.dio.post(
        '/flights/search',
        data: request.toJson(),
      );

      return FlightSearchResponse.fromJson(response.data);
    } on DioException catch (e) {
      return FlightSearchResponse(
        success: false,
        error: e.response?.data['error'] ?? e.message ?? 'Search failed',
      );
    }
  }

  // 2. Get TBO Fare Quote
  Future<Map<String, dynamic>> getFareQuote({
    required String traceId,
    required String resultIndex,
    String? endUserIp,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/fare-quote',
        data: {
          'TraceId': traceId,
          'ResultIndex': resultIndex,
          'EndUserIp': endUserIp ?? '192.168.1.1',
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Fare quote failed');
    }
  }

  // 3. Get AirIQ Pricing
  Future<Map<String, dynamic>> getAiriqPricing({
    required String traceId,
    required String resultIndex,
    required Map<String, dynamic> flight,
    Map<String, dynamic>? returnFlight,
    required int adultCount,
    required int childCount,
    required int infantCount,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/airiq/pricing',
        data: {
          'traceId': traceId,
          'resultIndex': resultIndex,
          'flight': flight,
          'returnFlight': returnFlight,
          'adultCount': adultCount,
          'childCount': childCount,
          'infantCount': infantCount,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Pricing failed');
    }
  }

  // 4. Get TBO Fare Rules
  Future<Map<String, dynamic>> getTboFareRules({
    required String traceId,
    required String resultIndex,
    String? endUserIp,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/fare-rules',
        data: {
          'TraceId': traceId,
          'ResultIndex': resultIndex,
          'EndUserIp': endUserIp ?? '192.168.1.1',
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Fare rules failed');
    }
  }

  // 5. Get AirIQ Fare Rules
  Future<Map<String, dynamic>> getAiriqFareRules({
    required String traceId,
    required String resultIndex,
    required Map<String, dynamic> flight,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/airiq/fare-rules',
        data: {
          'traceId': traceId,
          'resultIndex': resultIndex,
          'flight': flight,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Fare rules failed');
    }
  }

  // 6. Get TBO SSR Options
  Future<Map<String, dynamic>> getTboSSR({
    required String traceId,
    required String resultIndex,
    String? endUserIp,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/ssr',
        data: {
          'TraceId': traceId,
          'ResultIndex': resultIndex,
          'EndUserIp': endUserIp ?? '192.168.1.1',
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'SSR request failed');
    }
  }

  // 7. Get AirIQ Seat Map
  Future<Map<String, dynamic>> getAiriqSeatMap({
    required String traceId,
    required String resultIndex,
    required Map<String, dynamic> flight,
    required List<Map<String, dynamic>> passengers,
    required Map<String, dynamic> pricingData,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/airiq/seat-map',
        data: {
          'traceId': traceId,
          'resultIndex': resultIndex,
          'flight': flight,
          'passengers': passengers,
          'pricingData': pricingData,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Seat map failed');
    }
  }

  // 8. Book Flight (AirIQ)
  Future<Map<String, dynamic>> bookAiriqFlight({
    required String traceId,
    required String resultIndex,
    required List<Map<String, dynamic>> passengers,
    required Map<String, dynamic> ssrData,
    required Map<String, dynamic> flightData,
    required int adultCount,
    required int childCount,
    required int infantCount,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/airiq/book',
        data: {
          'traceId': traceId,
          'resultIndex': resultIndex,
          'passengers': passengers,
          'ssrData': ssrData,
          'flightData': flightData,
          'adultCount': adultCount,
          'childCount': childCount,
          'infantCount': infantCount,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Booking failed');
    }
  }

  // 9. Get TBO Fare Upsell
  Future<Map<String, dynamic>> getFareUpsell({
    required String traceId,
    required String resultIndex,
    String? returnResultIndex,
    String? endUserIp,
    int? adultCount,
    int? childCount,
    int? infantCount,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/fare-upsell',
        data: {
          'TraceId': traceId,
          'ResultIndex': resultIndex,
          'EndUserIp': endUserIp ?? '192.168.1.1',
          if (returnResultIndex != null) 'ReturnResultIndex': returnResultIndex,
          if (adultCount != null) 'AdultCount': adultCount,
          if (childCount != null) 'ChildCount': childCount,
          if (infantCount != null) 'InfantCount': infantCount,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Fare upsell failed');
    }
  }

  // 10. Get Post-Booking SSR (AirIQ)
  Future<Map<String, dynamic>> getPostBookingSSR({
    required String airiqPNR,
    required String airlinePNR,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/airiq/ssr',
        data: {
          'airiqPNR': airiqPNR,
          'airlinePNR': airlinePNR,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Post-booking SSR failed');
    }
  }

  // 11. Check TBO Auth Status
  Future<Map<String, dynamic>> checkTboAuth() async {
    try {
      final response = await _apiService.dio.get('/auth');
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Auth check failed');
    }
  }

  // 12. Refresh TBO Token
  Future<Map<String, dynamic>> refreshTboToken() async {
    try {
      final response = await _apiService.dio.post('/auth');
      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Token refresh failed');
    }
  }
}
```

### Step 2: Usage Example in Flutter

**Example: Search Flights**
```dart
import 'package:flutter/material.dart';
import '../services/flight_api_service.dart';
import '../models/flight_search_request.dart';

class FlightSearchScreen extends StatefulWidget {
  @override
  _FlightSearchScreenState createState() => _FlightSearchScreenState();
}

class _FlightSearchScreenState extends State<FlightSearchScreen> {
  final FlightApiService _flightApi = FlightApiService();
  bool _isLoading = false;
  FlightSearchResponse? _searchResults;

  Future<void> _searchFlights() async {
    setState(() => _isLoading = true);

    final request = FlightSearchRequest(
      origin: 'DEL',
      destination: 'BOM',
      preferredDepartureTime: DateTime(2025, 2, 15),
      journeyType: '1', // One-way
      adultCount: '1',
      childCount: '0',
      infantCount: '0',
      flightCabinClass: '1', // Economy
    );

    final result = await _flightApi.searchFlights(request);

    setState(() {
      _isLoading = false;
      _searchResults = result;
    });

    if (!result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.error ?? 'Search failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Flight Search')),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _searchResults != null
              ? _buildResults()
              : Center(child: ElevatedButton(
                  onPressed: _searchFlights,
                  child: Text('Search Flights'),
                )),
    );
  }

  Widget _buildResults() {
    // Build UI to display flight results
    return ListView(
      children: [
        // Display flights from _searchResults.data.response.results
      ],
    );
  }
}
```

---

## Complete API Reference

### 1. Flight Search
**Endpoint:** `POST /api/travel/flights/search`

**Request:**
```json
{
  "Origin": "DEL",
  "Destination": "BOM",
  "PreferredDepartureTime": "2025-01-15T00:00:00",
  "JourneyType": "1",
  "AdultCount": "1",
  "ChildCount": "0",
  "InfantCount": "0",
  "FlightCabinClass": "1",
  "PreferredAirlines": ["AI", "6E"] // Optional
}
```

**Response:** See `FlightSearchResponse` model above.

**Important:** Each flight result includes an `ApiSource` field that indicates which provider the flight comes from:
- `"TBO"` - Flight from TBO provider
- `"AIRiQ"` - Flight from AirIQ provider

Additionally, the response includes separate arrays:
- `Response.TboResults` - Array of flights from TBO only
- `Response.AiriqResults` - Array of flights from AirIQ only
- `Response.Results` - Combined array with all flights (both TBO and AirIQ)

**Example Response:**
```json
{
  "success": true,
  "data": {
    "Response": {
      "TraceId": "trace-id-123",
      "Results": [
        [
          {
            "ResultIndex": "idx1",
            "ApiSource": "TBO",
            "AirlineCode": "AI",
            "Fare": {...},
            "Segments": [...]
          },
          {
            "ResultIndex": "idx2",
            "ApiSource": "AIRiQ",
            "AirlineCode": "6E",
            "Fare": {...},
            "Segments": [...],
            "_airiqOriginal": {...}
          }
        ]
      ],
      "TboResults": [...],  // Only TBO flights
      "AiriqResults": [...]  // Only AirIQ flights
    }
  },
  "sources": {
    "tbo": true,
    "airiq": true
  }
}
```

**Using ApiSource in Flutter:**

```dart
// Check if flight is from TBO or AirIQ
if (flight.apiSource == "TBO") {
  // Handle TBO-specific logic
  print("This is a TBO flight");
} else if (flight.apiSource == "AIRiQ") {
  // Handle AirIQ-specific logic
  print("This is an AirIQ flight");
  // Access original AirIQ data if needed
  final originalData = flight.airiqOriginal;
}

// Or use helper methods (if added to model)
if (flight.isFromTbo) {
  // TBO flight
} else if (flight.isFromAiriq) {
  // AirIQ flight
}

// Filter flights by source
final tboFlights = allFlights.where((f) => f.apiSource == "TBO").toList();
final airiqFlights = allFlights.where((f) => f.apiSource == "AIRiQ").toList();

// Display provider badge in UI
Widget buildProviderBadge(FlightResult flight) {
  if (flight.apiSource == "TBO") {
    return Chip(
      label: Text("TBO"),
      backgroundColor: Colors.blue,
    );
  } else if (flight.apiSource == "AIRiQ") {
    return Chip(
      label: Text("AirIQ"),
      backgroundColor: Colors.green,
    );
  }
  return SizedBox.shrink();
}
```

---

### 2. TBO Fare Quote
**Endpoint:** `POST /api/travel/fare-quote`

**Request:**
```json
{
  "TraceId": "trace-id-123",
  "ResultIndex": "result-index-1",
  "EndUserIp": "192.168.1.1"
}
```

---

### 3. AirIQ Pricing
**Endpoint:** `POST /api/travel/airiq/pricing`

**Request:**
```json
{
  "traceId": "trace-id-123",
  "resultIndex": "result-index-1",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiq-trackid",
      "FlightDetails": [...],
      "Fares": [...]
    },
    "Fare": {...}
  },
  "returnFlight": null,
  "adultCount": 1,
  "childCount": 0,
  "infantCount": 0
}
```

**⚠️ Important:** After Pricing API call, use the NEW `Trackid` and `FlightID` from the response for subsequent Seat Map and Booking calls.

---

### 4. TBO Fare Rules
**Endpoint:** `POST /api/travel/fare-rules`

**Request:**
```json
{
  "TraceId": "trace-id-123",
  "ResultIndex": "result-index-1",
  "EndUserIp": "192.168.1.1"
}
```

---

### 5. AirIQ Fare Rules
**Endpoint:** `POST /api/travel/airiq/fare-rules`

**Request:**
```json
{
  "traceId": "trace-id-123",
  "resultIndex": "result-index-1",
  "flight": {
    "_airiqOriginal": {
      "Trackid": "airiq-trackid",
      "FlightDetails": [...]
    }
  }
}
```

---

### 6. TBO SSR Options
**Endpoint:** `POST /api/travel/ssr`

**Request:**
```json
{
  "TraceId": "trace-id-123",
  "ResultIndex": "result-index-1",
  "EndUserIp": "192.168.1.1"
}
```

---

### 7. AirIQ Seat Map
**Endpoint:** `POST /api/travel/airiq/seat-map`

**Request:**
```json
{
  "traceId": "trace-id-123",
  "resultIndex": "result-index-1",
  "flight": {
    "_airiqOriginal": {...}
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
            "FlightID": "new-flight-id-from-pricing"
          }
        ]
      }
    ]
  }
}
```

**⚠️ Important:** Must call Pricing API first and use `pricingData` in the request.

---

### 8. AirIQ Book Flight
**Endpoint:** `POST /api/travel/airiq/book`

**Request:**
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

**Response:**
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

### 9. TBO Fare Upsell
**Endpoint:** `POST /api/travel/fare-upsell`

**Request:**
```json
{
  "TraceId": "trace-id-123",
  "ResultIndex": "result-index-1",
  "EndUserIp": "192.168.1.1",
  "ReturnResultIndex": "return-index-1", // Optional
  "AdultCount": 2, // Optional
  "ChildCount": 1, // Optional
  "InfantCount": 0 // Optional
}
```

---

### 10. Post-Booking SSR (AirIQ)
**Endpoint:** `POST /api/travel/airiq/ssr`

**Request:**
```json
{
  "airiqPNR": "ABC123",
  "airlinePNR": "XYZ789"
}
```

---

### 11. TBO Auth Status
**Endpoint:** `GET /api/travel/auth`

**Response:**
```json
{
  "success": true,
  "token": "abc123...",
  "expiresAt": "2025-01-15T23:59:59.000Z",
  "isCached": true
}
```

---

### 12. Refresh TBO Token
**Endpoint:** `POST /api/travel/auth`

**Response:**
```json
{
  "success": true,
  "token": "newtoken123...",
  "expiresAt": "2025-01-15T23:59:59.000Z",
  "message": "Token refreshed successfully"
}
```

---

## Error Handling

### Error Response Format

**Standard Error:**
```json
{
  "error": "Error message here"
}
```

**TBO Error:**
```json
{
  "Response": {
    "Error": {
      "ErrorCode": 1,
      "ErrorMessage": "Error message"
    }
  }
}
```

**AirIQ Error:**
```json
{
  "Status": {
    "ResultCode": "0",
    "Error": "Error message",
    "SequenceID": "12345"
  }
}
```

### Error Handling in Flutter

**`lib/utils/api_error_handler.dart`**
```dart
class ApiErrorHandler {
  static String getErrorMessage(dynamic error) {
    if (error is DioException) {
      if (error.response != null) {
        final data = error.response!.data;
        
        // Check for standard error format
        if (data is Map && data.containsKey('error')) {
          return data['error'];
        }
        
        // Check for TBO error format
        if (data is Map && 
            data['Response'] != null && 
            data['Response']['Error'] != null) {
          return data['Response']['Error']['ErrorMessage'] ?? 'Unknown error';
        }
        
        // Check for AirIQ error format
        if (data is Map && data['Status'] != null) {
          return data['Status']['Error'] ?? 'Unknown error';
        }
      }
      
      // Network errors
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Connection timeout. Please check your internet.';
        case DioExceptionType.badResponse:
          return 'Server error. Please try again later.';
        default:
          return error.message ?? 'An error occurred';
      }
    }
    
    return error.toString();
  }
}
```

---

## Authentication & Security

### Current Implementation
- ✅ **Server-side authentication**: TBO and AirIQ credentials are stored in Next.js environment variables
- ✅ **Token caching**: Tokens are cached server-side, no need to handle in Flutter
- ✅ **No API keys in Flutter**: All sensitive credentials stay on the server

### Optional: User Session Management

If your Next.js app uses authentication, you can pass session tokens:

**`lib/services/api_service.dart` (Extended)**
```dart
class ApiService {
  // ... existing code ...

  String? _authToken;

  void setAuthToken(String? token) {
    _authToken = token;
    _dio.options.headers['Authorization'] = token != null ? 'Bearer $token' : null;
  }

  void clearAuthToken() {
    _authToken = null;
    _dio.options.headers.remove('Authorization');
  }
}
```

---

## Testing Checklist

### 1. Flight Search
- [ ] One-way search (TBO)
- [ ] One-way search (AirIQ)
- [ ] Round-trip search
- [ ] Multi-city search
- [ ] Search with preferred airlines
- [ ] Search with different cabin classes
- [ ] Error handling for invalid dates
- [ ] Error handling for invalid airport codes

### 2. Fare Quote/Pricing
- [ ] TBO fare quote
- [ ] AirIQ pricing
- [ ] Verify Trackid/FlightID update after pricing

### 3. Fare Rules
- [ ] TBO fare rules
- [ ] AirIQ fare rules

### 4. SSR Options
- [ ] TBO SSR (seats, meals, baggage)
- [ ] AirIQ SSR (in pricing response)
- [ ] AirIQ seat map (after pricing)

### 5. Booking
- [ ] AirIQ booking with valid passengers
- [ ] Booking with SSR selections
- [ ] Booking confirmation (PNR retrieval)
- [ ] Post-booking SSR retrieval

### 6. Error Scenarios
- [ ] Network timeout handling
- [ ] Server error (500) handling
- [ ] Invalid request (400) handling
- [ ] Token expiration handling

---

## Key Implementation Notes

### 1. AirIQ Flow Requirements
- **Always call Pricing API before Seat Map**
- **Use new Trackid/FlightID from Pricing response** for subsequent calls
- **Preserve `_airiqOriginal` data** from search response for fare-rules and booking

### 2. Date Formats
- Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss`
- Example: `"2025-01-15T10:30:00"`
- In Dart: `dateTime.toIso8601String()`

### 3. Journey Type Values
- `"1"` = One-way
- `"2"` = Round-trip
- `"3"` = Multi-city

### 4. Cabin Class Values
- `"1"` = Economy
- `"4"` = Business
- `"6"` = First

### 5. Passenger Type Values
- `1` = Adult
- `2` = Child
- `3` = Infant

### 6. Gender Values
- `1` = Male
- `2` = Female

---

## Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.4.0  # HTTP client
  intl: ^0.19.0  # Date formatting
```

---

## Next Steps

1. **Setup**: Initialize `ApiService` in your `main.dart`
   ```dart
   void main() {
     ApiService().init();
     runApp(MyApp());
   }
   ```

2. **Models**: Create all model classes from the examples above

3. **Services**: Implement `FlightApiService` with all methods

4. **UI**: Build Flutter screens for:
   - Flight search form
   - Flight results list
   - Flight details
   - Passenger details form
   - Booking confirmation

5. **Testing**: Test each endpoint individually before integrating into UI

6. **Error Handling**: Implement comprehensive error handling and user feedback

---

## Support

For issues or questions:
1. Check Next.js server logs for detailed error messages
2. Verify environment variables are set correctly on the server
3. Ensure dates are not in the past
4. Verify airport codes are valid IATA codes
5. Check API response structure matches expected models

---

## Troubleshooting: Date Parsing Issues

### Problem: "Flight card skipped: invalid dates - departure: , arrival:"

This error occurs when the Flutter app is not correctly parsing date fields from the API response. The dates are nested in the `Origin` and `Destination` objects.

### Solution 1: Verify Response Structure

First, debug what you're actually receiving:

```dart
// In your FlightResult.fromJson or where you parse the response
factory FlightResult.fromJson(Map<String, dynamic> json) {
  // Debug: Print the entire segment structure
  print('DEBUG: Segment JSON: ${json['Segments']}');
  
  // If segments is nested, check the structure
  if (json['Segments'] != null) {
    final segments = json['Segments'] as List;
    if (segments.isNotEmpty) {
      final firstSegmentGroup = segments[0] as List;
      if (firstSegmentGroup.isNotEmpty) {
        final firstSegment = firstSegmentGroup[0] as Map<String, dynamic>;
        print('DEBUG: First Segment: $firstSegment');
        print('DEBUG: Origin: ${firstSegment['Origin']}');
        print('DEBUG: Destination: ${firstSegment['Destination']}');
      }
    }
  }
  
  return FlightResult(
    // ... rest of your code
  );
}
```

### Solution 2: Fix Date Parsing in Segment Model

The dates are in `Origin.DepTime` and `Destination.ArrTime`. Update your `Segment.fromJson`:

```dart
class Segment {
  final Airline? airline;
  final AirportInfo? origin;
  final AirportInfo? destination;
  final int? duration;
  final int? groundTime;
  final bool? stopOver;
  final String? baggage;
  final String? cabinBaggage;

  Segment({
    this.airline,
    this.origin,
    this.destination,
    this.duration,
    this.groundTime,
    this.stopOver,
    this.baggage,
    this.cabinBaggage,
  });

  factory Segment.fromJson(Map<String, dynamic> json) {
    // Debug: Print the json to see actual structure
    print('DEBUG Segment JSON: $json');
    
    // Parse Origin - dates are in Origin.DepTime
    AirportInfo? origin;
    if (json['Origin'] != null) {
      final originJson = json['Origin'] as Map<String, dynamic>;
      print('DEBUG Origin JSON: $originJson');
      
      origin = AirportInfo(
        airport: originJson['Airport'] != null 
            ? Airport.fromJson(originJson['Airport'] as Map<String, dynamic>) 
            : null,
        depTime: originJson['DepTime']?.toString(), // Key: 'DepTime' not 'depTime'
        arrTime: null, // Arrival is not in Origin
      );
      
      print('DEBUG Origin DepTime: ${origin.depTime}');
    }
    
    // Parse Destination - dates are in Destination.ArrTime
    AirportInfo? destination;
    if (json['Destination'] != null) {
      final destJson = json['Destination'] as Map<String, dynamic>;
      print('DEBUG Destination JSON: $destJson');
      
      destination = AirportInfo(
        airport: destJson['Airport'] != null 
            ? Airport.fromJson(destJson['Airport'] as Map<String, dynamic>) 
            : null,
        depTime: null, // Departure is not in Destination
        arrTime: destJson['ArrTime']?.toString(), // Key: 'ArrTime' not 'arrTime'
      );
      
      print('DEBUG Destination ArrTime: ${destination.arrTime}');
    }
    
    return Segment(
      airline: json['Airline'] != null ? Airline.fromJson(json['Airline']) : null,
      origin: origin,
      destination: destination,
      duration: json['Duration'],
      groundTime: json['GroundTime'],
      stopOver: json['StopOver'],
      baggage: json['Baggage']?.toString(),
      cabinBaggage: json['CabinBaggage']?.toString(),
    );
  }
}
```

### Solution 3: Handle Nullable Dates

The dates might be null or empty. Add validation:

```dart
class AirportInfo {
  final Airport? airport;
  final String? depTime;
  final String? arrTime;
  
  // Add helper methods to parse dates safely
  DateTime? get departureDateTime {
    if (depTime == null || depTime!.isEmpty) return null;
    try {
      return DateTime.parse(depTime!);
    } catch (e) {
      print('ERROR parsing departure time: $depTime - $e');
      return null;
    }
  }
  
  DateTime? get arrivalDateTime {
    if (arrTime == null || arrTime!.isEmpty) return null;
    try {
      return DateTime.parse(arrTime!);
    } catch (e) {
      print('ERROR parsing arrival time: $arrTime - $e');
      return null;
    }
  }

  AirportInfo({this.airport, this.depTime, this.arrTime});

  factory AirportInfo.fromJson(Map<String, dynamic> json) {
    // Handle both null and empty string
    String? parseDate(dynamic value) {
      if (value == null) return null;
      final str = value.toString().trim();
      return str.isEmpty ? null : str;
    }
    
    return AirportInfo(
      airport: json['Airport'] != null ? Airport.fromJson(json['Airport']) : null,
      depTime: parseDate(json['DepTime']), // Note: Capital 'D' and 'T'
      arrTime: parseDate(json['ArrTime']), // Note: Capital 'A' and 'T'
    );
  }
}
```

### Solution 4: Check Your Flight Card Widget

The error message suggests you're checking dates in a widget. Make sure you're accessing them correctly:

```dart
Widget buildFlightCard(FlightResult flight) {
  // Get the first segment group (for one-way) or first segment
  final segments = flight.segments;
  if (segments == null || segments.isEmpty) {
    return SizedBox.shrink(); // Skip if no segments
  }
  
  final firstSegmentGroup = segments[0]; // First segment group
  if (firstSegmentGroup == null || firstSegmentGroup.isEmpty) {
    return SizedBox.shrink(); // Skip if empty
  }
  
  final firstSegment = firstSegmentGroup[0]; // First segment in group
  if (firstSegment == null) {
    return SizedBox.shrink();
  }
  
  // Access dates from Origin and Destination
  final departureTime = firstSegment.origin?.depTime;
  final arrivalTime = firstSegment.destination?.arrTime;
  
  // Validate dates exist
  if (departureTime == null || 
      departureTime.isEmpty || 
      arrivalTime == null || 
      arrivalTime.isEmpty) {
    print('[FlightResults] Flight card skipped: invalid dates - departure: $departureTime, arrival: $arrivalTime');
    return SizedBox.shrink();
  }
  
  // Parse dates
  DateTime? depDateTime;
  DateTime? arrDateTime;
  
  try {
    depDateTime = DateTime.parse(departureTime);
    arrDateTime = DateTime.parse(arrivalTime);
  } catch (e) {
    print('[FlightResults] Flight card skipped: date parse error - $e');
    return SizedBox.shrink();
  }
  
  // Now use depDateTime and arrDateTime in your UI
  return Card(
    child: Column(
      children: [
        Text('Departure: ${depDateTime.toString()}'),
        Text('Arrival: ${arrDateTime.toString()}'),
        // ... rest of your UI
      ],
    ),
  );
}
```

### Solution 5: Common Issues Checklist

1. **Case Sensitivity**: API uses `DepTime` and `ArrTime` (capital letters), not `depTime` or `arrTime`
2. **Nested Structure**: Dates are in `Origin.DepTime` and `Destination.ArrTime`, not directly on segment
3. **Multiple Segments**: For multi-segment flights, check `segments[0][0]` (first group, first segment)
4. **Null Handling**: Dates might be null or empty strings - always validate before parsing
5. **Date Format**: Dates come as ISO 8601 strings: `"2025-01-15T10:30:00.000Z"`

### Quick Debug Helper

Add this method to print the full response structure:

```dart
void debugFlightResponse(dynamic response) {
  print('=== FLIGHT RESPONSE DEBUG ===');
  print(JsonEncoder.withIndent('  ').convert(response));
  print('=============================');
}

// Use it after receiving response:
final searchResponse = await _flightApi.searchFlights(request);
debugFlightResponse(searchResponse);
```

This will show you exactly what structure you're receiving, making it easier to fix the parsing.

---

## Troubleshooting: Fare Upsell API Connection Error

### Problem: "Backend API service not available. Please configure API_URL or ensure Next.js backend is running."

This error occurs when the Flutter app cannot reach the Next.js backend when trying to fetch fare upsell options.

### Solution 1: Verify API Base URL Configuration

Check your `ApiConfig` or base URL configuration:

```dart
// lib/config/api_config.dart
class ApiConfig {
  // For Android Emulator accessing localhost
  // Use: http://10.0.2.2:3000/api/travel
  // NOT: http://localhost:3000/api/travel
  
  // For iOS Simulator accessing localhost
  // Use: http://localhost:3000/api/travel
  
  // For Physical Device
  // Use your computer's IP address: http://192.168.x.x:3000/api/travel
  
  static const String devBaseUrl = 'http://10.0.2.2:3000/api/travel'; // Android Emulator
  // static const String devBaseUrl = 'http://localhost:3000/api/travel'; // iOS Simulator
  // static const String devBaseUrl = 'http://192.168.1.100:3000/api/travel'; // Physical device
  
  static const String prodBaseUrl = 'https://your-domain.com/api/travel';
  
  static String get baseUrl => kDebugMode ? devBaseUrl : prodBaseUrl;
}
```

### Solution 2: Verify Next.js Backend is Running

1. **Check if Next.js server is running:**
   ```bash
   # In your Next.js project directory
   npm run dev
   # Should see: "Ready on http://localhost:3000"
   ```

2. **Test the endpoint directly:**
   ```bash
   # Test fare upsell endpoint
   curl -X POST http://localhost:3000/api/travel/fare-upsell \
     -H "Content-Type: application/json" \
     -d '{
       "TraceId": "test-trace-id",
       "ResultIndex": "test-result-index",
       "EndUserIp": "192.168.1.1"
     }'
   ```

### Solution 3: Check Network Configuration

**For Android Emulator:**
- Use `http://10.0.2.2:3000` instead of `localhost`
- `10.0.2.2` is the special IP that Android emulator uses to access the host machine

**For iOS Simulator:**
- Use `http://localhost:3000` (should work fine)

**For Physical Device:**
- Use your computer's IP address (e.g., `http://192.168.1.100:3000`)
- Ensure both Flutter app and Next.js backend are on the same network
- Find your IP:
  - **macOS/Linux:** `ifconfig | grep "inet "`
  - **Windows:** `ipconfig`

### Solution 4: Verify Fare Upsell Endpoint Path

Make sure you're calling the correct endpoint:

```dart
// In FlightApiService
Future<Map<String, dynamic>> getFareUpsell({
  required String traceId,
  required String resultIndex,
  String? returnResultIndex,
  String? endUserIp,
  int? adultCount,
  int? childCount,
  int? infantCount,
}) async {
  try {
    final response = await _apiService.dio.post(
      '/fare-upsell', // Make sure this path is correct
      data: {
        'TraceId': traceId, // Note: Capital 'T' and 'I'
        'ResultIndex': resultIndex, // Note: Capital 'R' and 'I'
        'EndUserIp': endUserIp ?? '192.168.1.1',
        if (returnResultIndex != null) 'ReturnResultIndex': returnResultIndex,
        if (adultCount != null) 'AdultCount': adultCount,
        if (childCount != null) 'ChildCount': childCount,
        if (infantCount != null) 'InfantCount': infantCount,
      },
    );

    return response.data;
  } on DioException catch (e) {
    // Debug: Print the actual error
    print('Fare Upsell Error: ${e.message}');
    print('Response: ${e.response?.data}');
    print('Status Code: ${e.response?.statusCode}');
    
    throw Exception(e.response?.data['error'] ?? e.message ?? 'Fare upsell failed');
  }
}
```

### Solution 5: Add Error Handling with Better Messages

Update your error handling to show more details:

```dart
Future<Map<String, dynamic>> getFareUpsell({...}) async {
  try {
    print('Calling fare upsell endpoint: ${ApiConfig.baseUrl}/fare-upsell');
    print('Request data: ${{...}}');
    
    final response = await _apiService.dio.post(
      '/fare-upsell',
      data: {...},
    );

    print('Fare upsell response received');
    return response.data;
  } on DioException catch (e) {
    if (e.type == DioExceptionType.connectionTimeout) {
      throw Exception('Connection timeout. Please check if Next.js backend is running on ${ApiConfig.baseUrl}');
    } else if (e.type == DioExceptionType.connectionError) {
      throw Exception('Cannot connect to backend. Please ensure:\n1. Next.js server is running\n2. API_URL is correct: ${ApiConfig.baseUrl}');
    } else if (e.response == null) {
      throw Exception('No response from server. Please check your network connection and API_URL: ${ApiConfig.baseUrl}');
    }
    
    final errorMessage = e.response?.data['error'] ?? e.message ?? 'Unknown error';
    throw Exception(errorMessage);
  } catch (e) {
    throw Exception('Failed to fetch fare upsell: $e');
  }
}
```

### Solution 6: Environment-Specific Configuration

Create different configurations for different environments:

```dart
// lib/config/api_config.dart
import 'package:flutter/foundation.dart';

class ApiConfig {
  // Get the base URL based on environment
  static String get baseUrl {
    if (kDebugMode) {
      // Development
      return _getDevelopmentBaseUrl();
    } else {
      // Production
      return 'https://your-production-domain.com/api/travel';
    }
  }

  static String _getDevelopmentBaseUrl() {
    // You can check the platform or use an environment variable
    // For now, defaulting to Android emulator
    const androidEmulatorUrl = 'http://10.0.2.2:3000/api/travel';
    const iosSimulatorUrl = 'http://localhost:3000/api/travel';
    const physicalDeviceUrl = 'http://192.168.1.100:3000/api/travel'; // Update with your IP
    
    // Use a flag or environment variable to switch
    // For Android Emulator:
    return androidEmulatorUrl;
    
    // For iOS Simulator:
    // return iosSimulatorUrl;
    
    // For Physical Device:
    // return physicalDeviceUrl;
  }

  static const Duration timeout = Duration(seconds: 30);
}
```

### Solution 7: Test Connection Before Making Request

Add a simple connection test:

```dart
// Add this to your ApiService
Future<bool> testConnection() async {
  try {
    final response = await _dio.get('/test-connection', 
      options: Options(
        validateStatus: (status) => status! < 500,
      ),
    );
    return response.statusCode == 200;
  } catch (e) {
    return false;
  }
}

// Use it before making fare upsell request
Future<Map<String, dynamic>> getFareUpsell({...}) async {
  // Test connection first
  final isConnected = await _apiService.testConnection();
  if (!isConnected) {
    throw Exception('Cannot connect to backend. Please check API_URL: ${ApiConfig.baseUrl}');
  }

  // Proceed with request
  return await _apiService.dio.post('/fare-upsell', data: {...});
}
```

### Solution 8: Common Issues Checklist

1. ✅ **Next.js server is running** - Check terminal for "Ready on http://localhost:3000"
2. ✅ **Correct API_URL** - Android emulator needs `10.0.2.2`, not `localhost`
3. ✅ **Network connectivity** - Physical devices must be on same network
4. ✅ **Firewall** - Ensure firewall isn't blocking port 3000
5. ✅ **CORS** - Next.js should handle CORS for API routes automatically
6. ✅ **Endpoint path** - Use `/fare-upsell` (with hyphen, not underscore)
7. ✅ **Request format** - Use `TraceId` and `ResultIndex` (capital letters)

### Quick Debug Steps

1. **Print the full URL being called:**
   ```dart
   print('Full URL: ${ApiConfig.baseUrl}/fare-upsell');
   ```

2. **Test in browser or Postman:**
   ```
   POST http://localhost:3000/api/travel/fare-upsell
   Content-Type: application/json
   
   {
     "TraceId": "test",
     "ResultIndex": "test",
     "EndUserIp": "192.168.1.1"
   }
   ```

3. **Check Next.js server logs** - Look for the incoming request

4. **Enable network logging in Dio:**
   ```dart
   _dio.interceptors.add(LogInterceptor(
     requestBody: true,
     responseBody: true,
     error: true,
   ));
   ```

---

**Last Updated:** 2025-01-15  
**Version:** 1.2 (Added Fare Upsell Connection Troubleshooting)  
**Next.js API Version:** Based on current implementation
