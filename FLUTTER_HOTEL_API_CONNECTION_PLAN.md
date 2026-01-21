# Flutter App - Next.js Hotel API Connection Plan

## Overview

This document provides a comprehensive plan for connecting your Flutter mobile application to the Next.js Hotel Booking API. The Flutter app will route all hotel booking requests through your Next.js backend, ensuring centralized control, authentication, and data management. This plan includes integration with the search indexing system for cities and hotels.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Base Configuration](#base-configuration)
3. [API Endpoint Mapping](#api-endpoint-mapping)
4. [Request/Response Models](#requestresponse-models)
5. [Hybrid Search Pattern](#hybrid-search-pattern)
6. [Search Indexing Integration](#search-indexing-integration)
7. [Implementation Steps](#implementation-steps)
8. [Error Handling](#error-handling)
9. [Authentication & Security](#authentication--security)
10. [Complete API Reference](#complete-api-reference)
11. [Testing Checklist](#testing-checklist)

---

## Architecture Overview

### Current Flow (Direct Provider Connection)
```
Flutter App → TBO Hotel Provider APIs (Direct)
```

### Target Flow (Via Next.js Backend)
```
Flutter App → Next.js API → TBO Hotel Provider APIs
```

### Benefits
- ✅ Centralized authentication management
- ✅ Token caching on server (no wasted login attempts)
- ✅ Unified error handling
- ✅ Data logging and analytics
- ✅ Security: API credentials stay on server
- ✅ Fast autocomplete using local search index
- ✅ Easier updates: API changes in one place

### Hotel Search Flow
```
1. User types in search box
   ↓
2. Autocomplete Search (Local Index)
   GET /api/travel/hotel-search?q=query
   ↓
3. User selects result (country/city/hotel)
   ↓
4. Get Hotel Codes (if city/country selected)
   POST /api/travel/hotel/get-hotel-codes
   ↓
5. Search Hotel Availability
   POST /api/travel/hotel/search
   ↓
6. Get Hotel Details (optional)
   GET /api/travel/hotel/details?hotelCode=xxx
   ↓
7. Pre-book Hotel
   POST /api/travel/hotel/prebook
   ↓
8. Check Auth Status (optional)
   GET /api/travel/hotel/auth
```

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
  
  // Search debounce delay (for autocomplete)
  static const Duration searchDebounce = Duration(milliseconds: 300);
}
```

### 2. HTTP Client Setup

Create a base HTTP service (reuse from flight API if exists):

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

### Hotel Search Flow

```
1. Autocomplete Search
   GET /api/travel/hotel-search?q=query&limit=10&type=hotel
   ↓
2. Get Selection Details (optional)
   POST /api/travel/hotel-search
   ↓
3. Get Hotel Codes
   POST /api/travel/hotel/get-hotel-codes
   ↓
4. Search Hotel Availability
   POST /api/travel/hotel/search
   ↓
5. Get Hotel Details (optional)
   GET /api/travel/hotel/details?hotelCode=xxx
   ↓
6. Pre-book Hotel
   POST /api/travel/hotel/prebook
```

---

## Request/Response Models

### 1. Hotel Search Autocomplete Request

**Model: `lib/models/hotel_search_request.dart`**
```dart
class HotelSearchRequest {
  final String query;
  final int limit;
  final String? type; // 'country' | 'city' | 'hotel' | null (all)

  HotelSearchRequest({
    required this.query,
    this.limit = 10,
    this.type,
  });

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{
      'q': query,
      'limit': limit.toString(),
    };
    
    if (type != null) {
      params['type'] = type;
    }
    
    return params;
  }
}
```

### 2. Hotel Search Autocomplete Response

**Model: `lib/models/hotel_search_response.dart`**
```dart
class HotelSearchResponse {
  final bool success;
  final String query;
  final int count;
  final List<HotelSearchResult> results;
  final String? error;

  HotelSearchResponse({
    required this.success,
    required this.query,
    required this.count,
    required this.results,
    this.error,
  });

  factory HotelSearchResponse.fromJson(Map<String, dynamic> json) {
    return HotelSearchResponse(
      success: json['success'] ?? false,
      query: json['query'] ?? '',
      count: json['count'] ?? 0,
      results: json['results'] != null
          ? (json['results'] as List)
              .map((r) => HotelSearchResult.fromJson(r))
              .toList()
          : [],
      error: json['error'],
    );
  }
}

class HotelSearchResult {
  final String id;
  final String type; // 'country' | 'city' | 'hotel'
  final String name;
  final String countryCode;
  final String? cityCode;
  final String? hotelCode;

  HotelSearchResult({
    required this.id,
    required this.type,
    required this.name,
    required this.countryCode,
    this.cityCode,
    this.hotelCode,
  });

  factory HotelSearchResult.fromJson(Map<String, dynamic> json) {
    return HotelSearchResult(
      id: json['id'] ?? '',
      type: json['type'] ?? '',
      name: json['name'] ?? '',
      countryCode: json['countryCode'] ?? '',
      cityCode: json['cityCode'],
      hotelCode: json['hotelCode'],
    );
  }

  // Helper methods
  bool get isCountry => type == 'country';
  bool get isCity => type == 'city';
  bool get isHotel => type == 'hotel';
}
```

### 3. Get Hotel Codes Request

**Model: `lib/models/hotel_codes_request.dart`**
```dart
class HotelCodesRequest {
  final String type; // 'country' | 'city' | 'hotel'
  final String code; // countryCode, cityCode, or hotelCode
  final int? limit; // Max number of hotel codes to return

  HotelCodesRequest({
    required this.type,
    required this.code,
    this.limit,
  });

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{
      'type': type,
      'code': code,
    };
    
    if (limit != null) {
      json['limit'] = limit;
    }
    
    return json;
  }
}
```

### 4. Get Hotel Codes Response

**Model: `lib/models/hotel_codes_response.dart`**
```dart
class HotelCodesResponse {
  final bool success;
  final String type;
  final String code;
  final String hotelCodes; // Comma-separated string
  final int count;
  final String? error;

  HotelCodesResponse({
    required this.success,
    required this.type,
    required this.code,
    required this.hotelCodes,
    required this.count,
    this.error,
  });

  factory HotelCodesResponse.fromJson(Map<String, dynamic> json) {
    return HotelCodesResponse(
      success: json['success'] ?? false,
      type: json['type'] ?? '',
      code: json['code'] ?? '',
      hotelCodes: json['hotelCodes'] ?? '',
      count: json['count'] ?? 0,
      error: json['error'],
    );
  }

  // Helper: Get hotel codes as list
  List<String> get hotelCodesList {
    if (hotelCodes.isEmpty) return [];
    return hotelCodes.split(',').map((code) => code.trim()).toList();
  }
}
```

### 5. Hotel Availability Search Request

**Model: `lib/models/hotel_availability_request.dart`**
```dart
class HotelAvailabilityRequest {
  final String checkIn; // YYYY-MM-DD
  final String checkOut; // YYYY-MM-DD
  final String hotelCodes; // Comma-separated hotel codes
  final String? cityCode; // Optional
  final String? countryCode; // Optional
  final String guestNationality; // ISO country code (e.g., 'IN')
  final List<RoomConfig> rooms;
  final bool isDetailedResponse; // Get detailed hotel info
  final Map<String, dynamic>? filters; // Optional filters

  HotelAvailabilityRequest({
    required this.checkIn,
    required this.checkOut,
    required this.hotelCodes,
    this.cityCode,
    this.countryCode,
    required this.guestNationality,
    required this.rooms,
    this.isDetailedResponse = false,
    this.filters,
  });

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{
      'checkIn': checkIn,
      'checkOut': checkOut,
      'hotelCodes': hotelCodes,
      'guestNationality': guestNationality,
      'rooms': rooms.map((r) => r.toJson()).toList(),
      'isDetailedResponse': isDetailedResponse,
    };

    if (cityCode != null) {
      json['cityCode'] = cityCode;
    }

    if (countryCode != null) {
      json['countryCode'] = countryCode;
    }

    if (filters != null) {
      json['filters'] = filters;
    }

    return json;
  }
}

class RoomConfig {
  final int adults; // 1-8
  final int children; // 0-4
  final List<int> childrenAges; // Required if children > 0

  RoomConfig({
    required this.adults,
    this.children = 0,
    this.childrenAges = const [],
  }) {
    if (adults < 1 || adults > 8) {
      throw ArgumentError('Adults must be between 1 and 8');
    }
    if (children < 0 || children > 4) {
      throw ArgumentError('Children must be between 0 and 4');
    }
    if (children > 0 && childrenAges.length != children) {
      throw ArgumentError('childrenAges length must match children count');
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'adults': adults,
      'children': children,
      'childrenAges': childrenAges,
    };
  }
}
```

### 6. Hotel Availability Search Response

**Model: `lib/models/hotel_availability_response.dart`**
```dart
class HotelAvailabilityResponse {
  final bool success;
  final HotelSearchData? data;
  final HotelSearchParams? searchParams;
  final String? error;

  HotelAvailabilityResponse({
    required this.success,
    this.data,
    this.searchParams,
    this.error,
  });

  factory HotelAvailabilityResponse.fromJson(Map<String, dynamic> json) {
    return HotelAvailabilityResponse(
      success: json['success'] ?? false,
      data: json['data'] != null
          ? HotelSearchData.fromJson(json['data'])
          : null,
      searchParams: json['searchParams'] != null
          ? HotelSearchParams.fromJson(json['searchParams'])
          : null,
      error: json['error'],
    );
  }
}

class HotelSearchData {
  final List<HotelResult>? hotelResult;
  final Map<String, dynamic>? response; // Raw TBO response

  HotelSearchData({
    this.hotelResult,
    this.response,
  });

  factory HotelSearchData.fromJson(Map<String, dynamic> json) {
    return HotelSearchData(
      hotelResult: json['HotelResult'] != null
          ? (json['HotelResult'] as List)
              .map((h) => HotelResult.fromJson(h))
              .toList()
          : null,
      response: json,
    );
  }
}

class HotelResult {
  final String? hotelCode;
  final String? hotelName;
  final String? hotelRating;
  final String? hotelAddress;
  final String? hotelDescription;
  final List<String>? hotelImages;
  final List<String>? facilities;
  final String? cityCode;
  final String? cityName;
  final String? countryCode;
  final String? countryName;
  final double? latitude;
  final double? longitude;
  final List<RoomResult>? rooms;
  final Map<String, dynamic>? rawData; // Store original response

  HotelResult({
    this.hotelCode,
    this.hotelName,
    this.hotelRating,
    this.hotelAddress,
    this.hotelDescription,
    this.hotelImages,
    this.facilities,
    this.cityCode,
    this.cityName,
    this.countryCode,
    this.countryName,
    this.latitude,
    this.longitude,
    this.rooms,
    this.rawData,
  });

  factory HotelResult.fromJson(Map<String, dynamic> json) {
    return HotelResult(
      hotelCode: json['HotelCode']?.toString(),
      hotelName: json['HotelName'],
      hotelRating: json['HotelRating']?.toString(),
      hotelAddress: json['HotelAddress'],
      hotelDescription: json['HotelDescription'],
      hotelImages: json['HotelImages'] != null
          ? List<String>.from(json['HotelImages'])
          : null,
      facilities: json['Facilities'] != null
          ? List<String>.from(json['Facilities'])
          : null,
      cityCode: json['CityCode']?.toString(),
      cityName: json['CityName'],
      countryCode: json['CountryCode'],
      countryName: json['CountryName'],
      latitude: json['Latitude'] != null
          ? double.tryParse(json['Latitude'].toString())
          : null,
      longitude: json['Longitude'] != null
          ? double.tryParse(json['Longitude'].toString())
          : null,
      rooms: json['Rooms'] != null
          ? (json['Rooms'] as List)
              .map((r) => RoomResult.fromJson(r))
              .toList()
          : null,
      rawData: json,
    );
  }
}

class RoomResult {
  final String? roomTypeCode;
  final String? roomTypeName;
  final String? ratePlanCode;
  final String? ratePlanName;
  final double? totalFare;
  final String? currency;
  final String? cancellationPolicy;
  final Map<String, dynamic>? rawData;

  RoomResult({
    this.roomTypeCode,
    this.roomTypeName,
    this.ratePlanCode,
    this.ratePlanName,
    this.totalFare,
    this.currency,
    this.cancellationPolicy,
    this.rawData,
  });

  factory RoomResult.fromJson(Map<String, dynamic> json) {
    return RoomResult(
      roomTypeCode: json['RoomTypeCode']?.toString(),
      roomTypeName: json['RoomTypeName'],
      ratePlanCode: json['RatePlanCode']?.toString(),
      ratePlanName: json['RatePlanName'],
      totalFare: json['TotalFare'] != null
          ? double.tryParse(json['TotalFare'].toString())
          : null,
      currency: json['Currency'],
      cancellationPolicy: json['CancellationPolicy'],
      rawData: json,
    );
  }
}

class HotelSearchParams {
  final String? checkIn;
  final String? checkOut;
  final int? noOfRooms;
  final String? guestNationality;

  HotelSearchParams({
    this.checkIn,
    this.checkOut,
    this.noOfRooms,
    this.guestNationality,
  });

  factory HotelSearchParams.fromJson(Map<String, dynamic> json) {
    return HotelSearchParams(
      checkIn: json['checkIn'],
      checkOut: json['checkOut'],
      noOfRooms: json['noOfRooms'],
      guestNationality: json['guestNationality'],
    );
  }
}
```

### 7. Hotel Details Request/Response

**Model: `lib/models/hotel_details.dart`**
```dart
class HotelDetailsRequest {
  final String hotelCode;
  final String language; // Default: 'EN'
  final bool isRoomDetailRequired; // Default: false

  HotelDetailsRequest({
    required this.hotelCode,
    this.language = 'EN',
    this.isRoomDetailRequired = false,
  });

  Map<String, dynamic> toQueryParams() {
    return {
      'hotelCode': hotelCode,
      'language': language,
      'isRoomDetailRequired': isRoomDetailRequired.toString(),
    };
  }
}

class HotelDetailsResponse {
  final bool success;
  final HotelDetailsData? data;
  final String? error;

  HotelDetailsResponse({
    required this.success,
    this.data,
    this.error,
  });

  factory HotelDetailsResponse.fromJson(Map<String, dynamic> json) {
    return HotelDetailsResponse(
      success: json['success'] ?? false,
      data: json['data'] != null
          ? HotelDetailsData.fromJson(json['data'])
          : null,
      error: json['error'],
    );
  }
}

class HotelDetailsData {
  final Map<String, dynamic>? hotelDetails;
  final Map<String, dynamic>? rawData;

  HotelDetailsData({
    this.hotelDetails,
    this.rawData,
  });

  factory HotelDetailsData.fromJson(Map<String, dynamic> json) {
    return HotelDetailsData(
      hotelDetails: json['HotelDetails'],
      rawData: json,
    );
  }
}
```

---

## Hybrid Search Pattern

### Overview

The hotel search system uses a **hybrid search approach** that combines two different APIs to provide complete hotel information:

1. **Hotel Search API** (`POST /api/travel/hotel/search`) - Provides hotel codes and **pricing/availability**
2. **Hotel Details API** (`GET /api/travel/hotel/details`) - Provides **images, amenities, and room information**

### Why Hybrid Search?

- **Hotel Search API** (TBO Affiliate API) returns real-time pricing and availability but has limited hotel details
- **Hotel Details API** (TBO Static API) provides rich hotel information (images, amenities, descriptions) but no pricing
- Combining both gives you complete hotel listings with pricing and rich details

### Data Split

**Hotel Search API Returns:**
- ✅ Hotel codes
- ✅ Real-time pricing (TotalFare, TotalTax)
- ✅ Room availability
- ✅ Room types and rate plans
- ✅ Cancellation policies
- ✅ Basic hotel info (name, address, rating)
- ❌ No images
- ❌ Limited amenities
- ❌ No room descriptions

**Hotel Details API Returns:**
- ✅ Hotel images (array of URLs)
- ✅ Hotel amenities/facilities
- ✅ Room descriptions and amenities
- ✅ Hotel description
- ✅ Contact information
- ✅ Check-in/check-out times
- ✅ Attractions nearby
- ✅ Hotel rooms with detailed info
- ❌ No pricing
- ❌ No availability

### Implementation Pattern

**Step 1: Search for Availability**
```dart
// Get hotels with pricing
final availabilityResponse = await hotelApiService.searchAvailability(
  HotelAvailabilityRequest(
    checkIn: '2026-02-01',
    checkOut: '2026-02-03',
    hotelCodes: '1218373,1234567',
    guestNationality: 'IN',
    rooms: [RoomConfig(adults: 2)],
    isDetailedResponse: true,
  ),
);

final hotels = availabilityResponse.data?.hotelResult ?? [];
```

**Step 2: Fetch Details for Each Hotel (Batch)**
```dart
// Fetch hotel details in parallel batches
final hotelCodes = hotels.map((h) => h.hotelCode).toList();
final detailsMap = <String, HotelDetailsData>{};

// Process in batches of 5-10 to avoid rate limiting
const batchSize = 5;
for (int i = 0; i < hotelCodes.length; i += batchSize) {
  final batch = hotelCodes.sublist(
    i,
    i + batchSize > hotelCodes.length ? hotelCodes.length : i + batchSize,
  );
  
  // Fetch details in parallel
  final detailsFutures = batch.map((code) => 
    hotelApiService.getHotelDetails(hotelCode: code),
  );
  
  final detailsResults = await Future.wait(detailsFutures);
  
  // Combine results
  for (int j = 0; j < batch.length; j++) {
    if (detailsResults[j].success && detailsResults[j].data != null) {
      detailsMap[batch[j]] = detailsResults[j].data!;
    }
  }
  
  // Small delay between batches
  if (i + batchSize < hotelCodes.length) {
    await Future.delayed(Duration(milliseconds: 500));
  }
}
```

**Step 3: Combine Data for Display**
```dart
// Combine pricing from search with details from details API
final combinedHotels = hotels.map((hotel) {
  final details = detailsMap[hotel.hotelCode];
  
  return CombinedHotelData(
    // From Search API
    hotelCode: hotel.hotelCode,
    hotelName: hotel.hotelName,
    pricing: hotel.rooms?.first.totalFare,
    currency: hotel.rooms?.first.currency,
    availability: hotel.rooms,
    
    // From Details API
    images: details?.hotelDetails?['Images'] ?? [],
    amenities: details?.hotelDetails?['HotelFacilities'] ?? [],
    description: details?.hotelDetails?['Description'],
    roomTypes: details?.hotelDetails?['HotelRooms'] ?? [],
  );
}).toList();
```

### Best Practices

1. **Batch Processing**: Fetch hotel details in batches (5-10 hotels at a time) to avoid rate limiting
2. **Parallel Requests**: Use `Future.wait()` to fetch multiple hotel details simultaneously
3. **Error Handling**: Handle partial failures gracefully - show hotels even if some details fail to load
4. **Progressive Loading**: Show hotels with pricing first, then load images/details progressively
5. **Caching**: Cache hotel details to avoid repeated API calls for the same hotels
6. **Delay Between Batches**: Add 500ms delay between batches to respect rate limits

### Example: Complete Hybrid Search Implementation

```dart
class HybridHotelSearch {
  final HotelApiService _apiService = HotelApiService();
  
  Future<List<CombinedHotelData>> searchHotelsWithDetails({
    required String checkIn,
    required String checkOut,
    required String hotelCodes,
    required String guestNationality,
    required List<RoomConfig> rooms,
  }) async {
    // Step 1: Search for availability and pricing
    final searchResponse = await _apiService.searchAvailability(
      HotelAvailabilityRequest(
        checkIn: checkIn,
        checkOut: checkOut,
        hotelCodes: hotelCodes,
        guestNationality: guestNationality,
        rooms: rooms,
        isDetailedResponse: true,
      ),
    );
    
    if (!searchResponse.success || searchResponse.data?.hotelResult == null) {
      return [];
    }
    
    final hotels = searchResponse.data!.hotelResult!;
    
    // Step 2: Extract hotel codes
    final hotelCodesList = hotels
        .where((h) => h.hotelCode != null)
        .map((h) => h.hotelCode!)
        .toList();
    
    // Step 3: Fetch details in batches
    final detailsMap = await _fetchHotelDetailsBatch(hotelCodesList);
    
    // Step 4: Combine data
    return hotels.map((hotel) {
      final details = detailsMap[hotel.hotelCode ?? ''];
      
      return CombinedHotelData(
        // From Search API
        hotelCode: hotel.hotelCode ?? '',
        hotelName: hotel.hotelName ?? 'Unknown Hotel',
        location: '${hotel.cityName ?? ''}, ${hotel.countryName ?? ''}',
        starRating: hotel.hotelRating,
        rooms: hotel.rooms ?? [],
        pricing: hotel.rooms?.isNotEmpty == true
            ? hotel.rooms!.first.totalFare
            : null,
        currency: hotel.rooms?.isNotEmpty == true
            ? hotel.rooms!.first.currency
            : null,
        
        // From Details API
        images: _parseImages(details),
        amenities: _parseAmenities(details),
        description: details?.hotelDetails?['Description'],
        roomTypes: _parseRoomTypes(details),
      );
    }).toList();
  }
  
  Future<Map<String, HotelDetailsData>> _fetchHotelDetailsBatch(
    List<String> hotelCodes,
  ) async {
    final detailsMap = <String, HotelDetailsData>{};
    const batchSize = 5;
    
    for (int i = 0; i < hotelCodes.length; i += batchSize) {
      final batch = hotelCodes.sublist(
        i,
        i + batchSize > hotelCodes.length ? hotelCodes.length : i + batchSize,
      );
      
      // Fetch in parallel
      final futures = batch.map((code) async {
        try {
          final response = await _apiService.getHotelDetails(
            hotelCode: code,
            language: 'EN',
            isRoomDetailRequired: true,
          );
          return MapEntry(code, response);
        } catch (e) {
          print('Error fetching details for $code: $e');
          return MapEntry(code, HotelDetailsResponse(success: false));
        }
      });
      
      final results = await Future.wait(futures);
      
      // Store successful results
      for (final entry in results) {
        if (entry.value.success && entry.value.data != null) {
          detailsMap[entry.key] = entry.value.data!;
        }
      }
      
      // Delay between batches
      if (i + batchSize < hotelCodes.length) {
        await Future.delayed(Duration(milliseconds: 500));
      }
    }
    
    return detailsMap;
  }
  
  List<String> _parseImages(HotelDetailsData? details) {
    if (details?.hotelDetails == null) return [];
    
    final images = details.hotelDetails!['Images'];
    if (images == null) return [];
    
    if (images is List) {
      return images.map((img) => img.toString()).toList();
    }
    
    if (images is String) {
      try {
        final parsed = jsonDecode(images) as List;
        return parsed.map((img) => img.toString()).toList();
      } catch (e) {
        // If it's a single URL string
        if (images.startsWith('http')) {
          return [images];
        }
      }
    }
    
    return [];
  }
  
  List<String> _parseAmenities(HotelDetailsData? details) {
    if (details?.hotelDetails == null) return [];
    
    final facilities = details.hotelDetails!['HotelFacilities'];
    if (facilities == null) return [];
    
    if (facilities is List) {
      return facilities.map((f) => f.toString()).toList();
    }
    
    if (facilities is String) {
      try {
        final parsed = jsonDecode(facilities) as List;
        return parsed.map((f) => f.toString()).toList();
      } catch (e) {
        return facilities.split(',').map((f) => f.trim()).toList();
      }
    }
    
    return [];
  }
  
  List<Map<String, dynamic>> _parseRoomTypes(HotelDetailsData? details) {
    if (details?.hotelDetails == null) return [];
    
    final rooms = details.hotelDetails!['HotelRooms'];
    if (rooms == null) return [];
    
    if (rooms is List) {
      return rooms.map((r) => r as Map<String, dynamic>).toList();
    }
    
    return [];
  }
}

class CombinedHotelData {
  final String hotelCode;
  final String hotelName;
  final String location;
  final String? starRating;
  final List<RoomResult> rooms;
  final double? pricing;
  final String? currency;
  final List<String> images;
  final List<String> amenities;
  final String? description;
  final List<Map<String, dynamic>> roomTypes;
  
  CombinedHotelData({
    required this.hotelCode,
    required this.hotelName,
    required this.location,
    this.starRating,
    required this.rooms,
    this.pricing,
    this.currency,
    required this.images,
    required this.amenities,
    this.description,
    required this.roomTypes,
  });
}
```

### Performance Considerations

- **Initial Display**: Show hotels with pricing immediately (from Search API)
- **Progressive Enhancement**: Load images and details progressively
- **Caching**: Cache hotel details to avoid repeated calls
- **Rate Limiting**: Respect API rate limits with batch delays
- **Error Resilience**: Handle partial failures gracefully

---

## Search Indexing Integration

### Overview

The Next.js backend maintains a local search index (`TboSearchIndex`) that enables fast autocomplete searches for countries, cities, and hotels. This index is built from synced TBO static data and provides instant search results without calling external APIs.

### How It Works

1. **Data Sync**: Next.js periodically syncs countries, cities, and hotels from TBO Static APIs
2. **Index Building**: A unified search index is created with normalized search text
3. **Fast Search**: Autocomplete queries search the local index (instant results)
4. **Availability Search**: Only availability/pricing calls the TBO dynamic API

### Search Index Structure

The search index contains:
- **Countries**: `type: 'country'`, `priority: 1`
- **Cities**: `type: 'city'`, `priority: 2`
- **Hotels**: `type: 'hotel'`, `priority: 3`

Results are sorted by priority (hotels first, then cities, then countries).

### Flutter Integration

The Flutter app doesn't need to manage the index - it just queries the search endpoint:

```dart
// Search as user types
final results = await hotelApiService.searchHotels(
  query: 'delhi',
  limit: 10,
  type: 'hotel', // Optional: filter by type
);
```

### Index Maintenance

The search index is maintained server-side:
- **Initial Sync**: Run full sync to populate data
- **Periodic Updates**: Sync hotels weekly, rebuild index daily
- **No Flutter Action Required**: Index management is automatic

---

## Implementation Steps

### Step 1: Create API Service Layer

**`lib/services/hotel_api_service.dart`**
```dart
import 'package:dio/dio.dart';
import '../models/hotel_search_request.dart';
import '../models/hotel_search_response.dart';
import '../models/hotel_codes_request.dart';
import '../models/hotel_codes_response.dart';
import '../models/hotel_availability_request.dart';
import '../models/hotel_availability_response.dart';
import '../models/hotel_details.dart';
import 'api_service.dart';

class HotelApiService {
  final ApiService _apiService = ApiService();

  // 1. Autocomplete Search (uses local search index)
  Future<HotelSearchResponse> searchHotels({
    required String query,
    int limit = 10,
    String? type, // 'country' | 'city' | 'hotel'
  }) async {
    try {
      final request = HotelSearchRequest(
        query: query,
        limit: limit,
        type: type,
      );

      final response = await _apiService.dio.get(
        '/hotel-search',
        queryParameters: request.toQueryParams(),
      );

      return HotelSearchResponse.fromJson(response.data);
    } on DioException catch (e) {
      return HotelSearchResponse(
        success: false,
        query: query,
        count: 0,
        results: [],
        error: e.response?.data['error'] ?? e.message ?? 'Search failed',
      );
    }
  }

  // 2. Get Selection Details (optional)
  Future<Map<String, dynamic>> getSelectionDetails({
    required String type, // 'country' | 'city' | 'hotel'
    required String code,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/hotel-search',
        data: {
          'type': type,
          'code': code,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Failed to get details');
    }
  }

  // 3. Get Hotel Codes
  Future<HotelCodesResponse> getHotelCodes({
    required String type, // 'country' | 'city' | 'hotel'
    required String code,
    int? limit,
  }) async {
    try {
      final request = HotelCodesRequest(
        type: type,
        code: code,
        limit: limit,
      );

      final response = await _apiService.dio.post(
        '/hotel/get-hotel-codes',
        data: request.toJson(),
      );

      return HotelCodesResponse.fromJson(response.data);
    } on DioException catch (e) {
      return HotelCodesResponse(
        success: false,
        type: type,
        code: code,
        hotelCodes: '',
        count: 0,
        error: e.response?.data['error'] ?? e.message ?? 'Failed to get hotel codes',
      );
    }
  }

  // 4. Search Hotel Availability
  Future<HotelAvailabilityResponse> searchAvailability(
    HotelAvailabilityRequest request,
  ) async {
    try {
      final response = await _apiService.dio.post(
        '/hotel/search',
        data: request.toJson(),
      );

      return HotelAvailabilityResponse.fromJson(response.data);
    } on DioException catch (e) {
      return HotelAvailabilityResponse(
        success: false,
        error: e.response?.data['error'] ?? e.message ?? 'Availability search failed',
      );
    }
  }

  // 5. Get Hotel Details
  Future<HotelDetailsResponse> getHotelDetails({
    required String hotelCode,
    String language = 'EN',
    bool isRoomDetailRequired = false,
  }) async {
    try {
      final request = HotelDetailsRequest(
        hotelCode: hotelCode,
        language: language,
        isRoomDetailRequired: isRoomDetailRequired,
      );

      final response = await _apiService.dio.get(
        '/hotel/details',
        queryParameters: request.toQueryParams(),
      );

      return HotelDetailsResponse.fromJson(response.data);
    } on DioException catch (e) {
      return HotelDetailsResponse(
        success: false,
        error: e.response?.data['error'] ?? e.message ?? 'Failed to get hotel details',
      );
    }
  }

  // 6. Pre-book Hotel
  Future<Map<String, dynamic>> prebookHotel({
    required String bookingCode,
    String paymentMode = 'Limit',
    Map<String, dynamic>? hotelData,
  }) async {
    try {
      final response = await _apiService.dio.post(
        '/hotel/prebook',
        data: {
          'bookingCode': bookingCode,
          'paymentMode': paymentMode,
          if (hotelData != null) 'hotelData': hotelData,
        },
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Pre-booking failed');
    }
  }

  // 7. Check Hotel Auth Status
  Future<Map<String, dynamic>> checkHotelAuth({bool refresh = false}) async {
    try {
      final response = await _apiService.dio.get(
        '/hotel/auth',
        queryParameters: refresh ? {'refresh': 'true'} : null,
      );

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Auth check failed');
    }
  }

  // 8. Force Refresh Hotel Auth Token
  Future<Map<String, dynamic>> refreshHotelAuth() async {
    try {
      final response = await _apiService.dio.post('/hotel/auth');

      return response.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['error'] ?? e.message ?? 'Token refresh failed');
    }
  }
}
```

### Step 2: Create Search Widget with Debouncing

**`lib/widgets/hotel_search_field.dart`**
```dart
import 'package:flutter/material.dart';
import 'dart:async';
import '../models/hotel_search_response.dart';
import '../services/hotel_api_service.dart';
import '../config/api_config.dart';

class HotelSearchField extends StatefulWidget {
  final Function(HotelSearchResult) onSelection;
  final String? hintText;
  final String? typeFilter; // 'country' | 'city' | 'hotel'

  const HotelSearchField({
    Key? key,
    required this.onSelection,
    this.hintText,
    this.typeFilter,
  }) : super(key: key);

  @override
  _HotelSearchFieldState createState() => _HotelSearchFieldState();
}

class _HotelSearchFieldState extends State<HotelSearchField> {
  final TextEditingController _controller = TextEditingController();
  final HotelApiService _apiService = HotelApiService();
  Timer? _debounceTimer;
  List<HotelSearchResult> _results = [];
  bool _isLoading = false;
  bool _showResults = false;

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounceTimer != null) {
      _debounceTimer!.cancel();
    }

    if (query.trim().isEmpty) {
      setState(() {
        _results = [];
        _showResults = false;
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _showResults = true;
    });

    _debounceTimer = Timer(ApiConfig.searchDebounce, () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    try {
      final response = await _apiService.searchHotels(
        query: query,
        limit: 10,
        type: widget.typeFilter,
      );

      if (mounted) {
        setState(() {
          _results = response.results;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _results = [];
          _isLoading = false;
        });
      }
    }
  }

  void _onResultSelected(HotelSearchResult result) {
    _controller.text = result.name;
    setState(() {
      _showResults = false;
    });
    widget.onSelection(result);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: _controller,
          decoration: InputDecoration(
            hintText: widget.hintText ?? 'Search hotels, cities...',
            prefixIcon: Icon(Icons.search),
            suffixIcon: _isLoading
                ? Padding(
                    padding: EdgeInsets.all(12.0),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : null,
          ),
          onChanged: _onSearchChanged,
          onTap: () {
            if (_results.isNotEmpty) {
              setState(() => _showResults = true);
            }
          },
        ),
        if (_showResults && _results.isNotEmpty)
          Container(
            constraints: BoxConstraints(maxHeight: 300),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _results.length,
              itemBuilder: (context, index) {
                final result = _results[index];
                return ListTile(
                  leading: Icon(
                    result.isHotel
                        ? Icons.hotel
                        : result.isCity
                            ? Icons.location_city
                            : Icons.public,
                  ),
                  title: Text(result.name),
                  subtitle: result.isHotel && result.cityCode != null
                      ? Text('Hotel')
                      : null,
                  onTap: () => _onResultSelected(result),
                );
              },
            ),
          ),
      ],
    );
  }
}
```

### Step 3: Usage Example in Flutter

**Example: Hotel Search Screen**
```dart
import 'package:flutter/material.dart';
import '../services/hotel_api_service.dart';
import '../models/hotel_search_response.dart';
import '../models/hotel_availability_request.dart';
import '../widgets/hotel_search_field.dart';

class HotelSearchScreen extends StatefulWidget {
  @override
  _HotelSearchScreenState createState() => _HotelSearchScreenState();
}

class _HotelSearchScreenState extends State<HotelSearchScreen> {
  final HotelApiService _hotelApi = HotelApiService();
  HotelSearchResult? _selectedLocation;
  DateTime? _checkIn;
  DateTime? _checkOut;
  List<RoomConfig> _rooms = [RoomConfig(adults: 2)];
  bool _isSearching = false;
  HotelAvailabilityResponse? _searchResults;

  Future<void> _searchAvailability() async {
    if (_selectedLocation == null || _checkIn == null || _checkOut == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    setState(() => _isSearching = true);

    try {
      // Step 1: Get hotel codes
      final codesResponse = await _hotelApi.getHotelCodes(
        type: _selectedLocation!.type,
        code: _selectedLocation!.isHotel
            ? _selectedLocation!.hotelCode!
            : _selectedLocation!.isCity
                ? _selectedLocation!.cityCode!
                : _selectedLocation!.countryCode,
        limit: 50,
      );

      if (!codesResponse.success) {
        throw Exception(codesResponse.error ?? 'Failed to get hotel codes');
      }

      // Step 2: Search availability
      final availabilityRequest = HotelAvailabilityRequest(
        checkIn: _checkIn!.toIso8601String().split('T')[0],
        checkOut: _checkOut!.toIso8601String().split('T')[0],
        hotelCodes: codesResponse.hotelCodes,
        guestNationality: 'IN',
        rooms: _rooms,
        isDetailedResponse: true,
      );

      final results = await _hotelApi.searchAvailability(availabilityRequest);

      setState(() {
        _isSearching = false;
        _searchResults = results;
      });

      if (!results.success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(results.error ?? 'Search failed')),
        );
      }
    } catch (e) {
      setState(() => _isSearching = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Hotel Search')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Location Search
            HotelSearchField(
              hintText: 'Search hotels, cities...',
              onSelection: (result) {
                setState(() => _selectedLocation = result);
              },
            ),
            SizedBox(height: 16),

            // Check-in Date
            ElevatedButton(
              onPressed: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(Duration(days: 365)),
                );
                if (date != null) {
                  setState(() => _checkIn = date);
                }
              },
              child: Text(
                _checkIn == null
                    ? 'Select Check-in Date'
                    : 'Check-in: ${_checkIn!.toLocal().toString().split(' ')[0]}',
              ),
            ),
            SizedBox(height: 8),

            // Check-out Date
            ElevatedButton(
              onPressed: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _checkIn ?? DateTime.now(),
                  firstDate: _checkIn ?? DateTime.now(),
                  lastDate: DateTime.now().add(Duration(days: 365)),
                );
                if (date != null) {
                  setState(() => _checkOut = date);
                }
              },
              child: Text(
                _checkOut == null
                    ? 'Select Check-out Date'
                    : 'Check-out: ${_checkOut!.toLocal().toString().split(' ')[0]}',
              ),
            ),
            SizedBox(height: 16),

            // Search Button
            ElevatedButton(
              onPressed: _isSearching ? null : _searchAvailability,
              child: _isSearching
                  ? CircularProgressIndicator()
                  : Text('Search Hotels'),
            ),
            SizedBox(height: 24),

            // Results
            if (_searchResults != null && _searchResults!.success)
              _buildResults(),
          ],
        ),
      ),
    );
  }

  Widget _buildResults() {
    final hotels = _searchResults!.data?.hotelResult ?? [];
    
    if (hotels.isEmpty) {
      return Center(child: Text('No hotels found'));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Found ${hotels.length} hotels',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 16),
        ...hotels.map((hotel) => Card(
          child: ListTile(
            leading: hotel.hotelImages?.isNotEmpty == true
                ? Image.network(hotel.hotelImages!.first)
                : Icon(Icons.hotel),
            title: Text(hotel.hotelName ?? 'Unknown Hotel'),
            subtitle: Text(
              '${hotel.cityName ?? ''}, ${hotel.countryName ?? ''}',
            ),
            trailing: hotel.rooms?.isNotEmpty == true
                ? Text(
                    '${hotel.rooms!.first.currency ?? ''} ${hotel.rooms!.first.totalFare?.toStringAsFixed(2) ?? ''}',
                  )
                : null,
            onTap: () {
              // Navigate to hotel details
            },
          ),
        )),
      ],
    );
  }
}
```

---

## Complete API Reference

### 1. Autocomplete Search
**Endpoint:** `GET /api/travel/hotel-search`

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Max results (default: 10)
- `type` (optional): Filter by type (`country`, `city`, `hotel`)

**Example Request:**
```bash
GET /api/travel/hotel-search?q=delhi&limit=10&type=hotel
```

**Example Response:**
```json
{
  "success": true,
  "query": "delhi",
  "count": 10,
  "results": [
    {
      "id": "...",
      "type": "hotel",
      "name": "Taj Palace New Delhi",
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

### 2. Get Selection Details
**Endpoint:** `POST /api/travel/hotel-search`

**Request Body:**
```json
{
  "type": "city",
  "code": "130443"
}
```

**Response:** Returns detailed object with relations (cities for country, hotels for city, etc.)

### 3. Get Hotel Codes
**Endpoint:** `POST /api/travel/hotel/get-hotel-codes`

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

### 4. Search Hotel Availability
**Endpoint:** `POST /api/travel/hotel/search`

**Request Body:**
```json
{
  "checkIn": "2026-02-01",
  "checkOut": "2026-02-03",
  "hotelCodes": "1218373,1234567",
  "cityCode": "130443",
  "countryCode": "IN",
  "guestNationality": "IN",
  "rooms": [
    {
      "adults": 2,
      "children": 0,
      "childrenAges": []
    }
  ],
  "isDetailedResponse": true,
  "filters": {
    "refundable": false,
    "mealType": "All",
    "starRating": [4, 5],
    "minPrice": 1000,
    "maxPrice": 10000
  }
}
```

**Note:** `cityCode`, `countryCode`, and `filters` are optional parameters.

**Response:**
```json
{
  "success": true,
  "data": {
    "HotelResult": [
      {
        "HotelCode": "1218373",
        "HotelName": "Taj Palace New Delhi",
        "HotelRating": "5",
        "HotelAddress": "...",
        "CityCode": "130443",
        "CityName": "New Delhi",
        "CountryCode": "IN",
        "CountryName": "India",
        "Rooms": [
          {
            "RoomTypeCode": "123",
            "RoomTypeName": "Deluxe Room",
            "TotalFare": 5000.00,
            "Currency": "INR"
          }
        ]
      }
    ]
  },
  "searchParams": {
    "checkIn": "2026-02-01",
    "checkOut": "2026-02-03",
    "noOfRooms": 1,
    "guestNationality": "IN"
  }
}
```

### 5. Get Hotel Details
**Endpoint:** `GET /api/travel/hotel/details`

**Query Parameters:**
- `hotelCode` (required): Hotel code
- `language` (optional): Language code (default: 'EN')
- `isRoomDetailRequired` (optional): Include room details (default: false)

**Example Request:**
```bash
GET /api/travel/hotel/details?hotelCode=1218373&language=EN&isRoomDetailRequired=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "HotelDetails": {
      "HotelCode": "1218373",
      "HotelName": "Taj Palace New Delhi",
      "Description": "...",
      "Images": [...],
      "Facilities": [...],
      "Rooms": [...]
    }
  }
}
```

### 6. Pre-book Hotel
**Endpoint:** `POST /api/travel/hotel/prebook`

**Request Body:**
```json
{
  "bookingCode": "BOOK123",
  "paymentMode": "Limit",
  "hotelData": {
    "hotelCode": "1218373",
    "hotelName": "Taj Palace New Delhi",
    "city": "New Delhi",
    "country": "India",
    "roomData": {
      "checkIn": "2026-02-01",
      "checkOut": "2026-02-03",
      "totalFare": 5000.00,
      "totalTax": 900.00,
      "rooms": [...]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "Status": {
      "Code": 1,
      "Description": "Success"
    }
  }
}
```

### 7. Check Hotel Auth Status
**Endpoint:** `GET /api/travel/hotel/auth`

**Query Parameters:**
- `refresh` (optional): Set to 'true' to refresh token

**Example Request:**
```bash
GET /api/travel/hotel/auth?refresh=true
```

**Response:**
```json
{
  "success": true,
  "hasValidToken": true,
  "token": "abc123...",
  "tokenLength": 100,
  "expiresAt": "2025-01-15T23:59:59.000Z",
  "message": "Token retrieved successfully"
}
```

### 8. Force Refresh Hotel Auth Token
**Endpoint:** `POST /api/travel/hotel/auth`

**Response:**
```json
{
  "success": true,
  "message": "Token force refreshed successfully",
  "hasValidToken": true,
  "tokenLength": 100,
  "expiresAt": "2025-01-15T23:59:59.000Z"
}
```

---

## Error Handling

### Error Response Format

**Standard Error:**
```json
{
  "success": false,
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

### Error Handling in Flutter

**`lib/utils/api_error_handler.dart`** (reuse from flight API or extend)
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
- ✅ **Server-side authentication**: TBO credentials are stored in Next.js environment variables
- ✅ **Token caching**: Tokens are cached server-side, no need to handle in Flutter
- ✅ **No API keys in Flutter**: All sensitive credentials stay on the server
- ✅ **Search index on server**: Fast autocomplete without exposing database

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

### 1. Autocomplete Search
- [ ] Search for hotels
- [ ] Search for cities
- [ ] Search for countries
- [ ] Filter by type (hotel/city/country)
- [ ] Empty query handling
- [ ] Special characters in query
- [ ] Debouncing works correctly

### 2. Get Hotel Codes
- [ ] Get codes for a city
- [ ] Get codes for a country
- [ ] Get code for a single hotel
- [ ] Limit parameter works
- [ ] Error handling for invalid codes

### 3. Hotel Availability Search
- [ ] Search with hotel codes
- [ ] Search with city code
- [ ] Search with country code
- [ ] Multiple rooms
- [ ] Children with ages
- [ ] Date validation
- [ ] Guest nationality validation
- [ ] Detailed response flag

### 4. Hotel Details
- [ ] Get details for valid hotel code
- [ ] Invalid hotel code handling
- [ ] Language parameter
- [ ] Room details flag

### 5. Pre-book Hotel
- [ ] Pre-book with valid booking code
- [ ] Payment mode parameter
- [ ] Hotel data logging
- [ ] Error handling for invalid booking code

### 6. Hotel Auth
- [ ] Check auth status
- [ ] Refresh token
- [ ] Force refresh token

### 7. Error Scenarios
- [ ] Network timeout handling
- [ ] Server error (500) handling
- [ ] Invalid request (400) handling
- [ ] No results found
- [ ] Empty search results

### 6. Search Indexing
- [ ] Search returns hotels first (priority)
- [ ] Search returns cities second
- [ ] Search returns countries last
- [ ] Search works with partial matches
- [ ] Search is case-insensitive
- [ ] Search handles multiple words

---

## Key Implementation Notes

### 1. Search Indexing
- **Autocomplete is instant** - Uses local database index
- **No external API calls** - For autocomplete/search suggestions
- **Availability is real-time** - Only availability/pricing calls TBO
- **Priority ordering** - Hotels appear first, then cities, then countries

### 2. Date Formats
- Use ISO 8601 date format: `YYYY-MM-DD`
- Example: `"2026-02-01"`
- In Dart: `dateTime.toIso8601String().split('T')[0]`

### 3. Hotel Codes
- **Comma-separated string** - TBO API expects comma-separated hotel codes
- **Limit per search** - TBO has limits (typically 50-100 hotels per search)
- **Get codes first** - Always get hotel codes before availability search

### 4. Room Configuration
- **Adults**: 1-8 per room
- **Children**: 0-4 per room
- **Children Ages**: Required array if children > 0
- **Multiple Rooms**: Array of room configurations

### 5. Guest Nationality
- Use ISO country code (e.g., 'IN' for India)
- Required for availability search
- Affects pricing and availability

### 6. Search Flow Best Practices
1. **Always use autocomplete** - Don't let users type hotel codes manually
2. **Get hotel codes** - Convert city/country selection to hotel codes
3. **Limit hotel codes** - Don't search more than 50-100 hotels at once
4. **Cache popular searches** - Cache hotel codes for popular cities
5. **Show loading states** - Availability search can take time

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

3. **Services**: Implement `HotelApiService` with all methods

4. **UI**: Build Flutter screens for:
   - Hotel search with autocomplete
   - Date pickers for check-in/check-out
   - Room configuration
   - Hotel results list
   - Hotel details page
   - Booking flow

5. **Testing**: Test each endpoint individually before integrating into UI

6. **Error Handling**: Implement comprehensive error handling and user feedback

7. **Search Indexing**: Verify search indexing is working on Next.js backend

---

## Search Indexing Setup (Next.js Backend)

Before using the hotel search in Flutter, ensure the search index is set up on the Next.js backend:

### 1. Check Index Status
```bash
curl http://localhost:3000/api/travel/tbo-sync/status
```

### 2. Run Initial Sync (if needed)
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

### 3. Rebuild Index (if needed)
```bash
curl -X POST http://localhost:3000/api/travel/tbo-sync/search-index
```

---

## Support

For issues or questions:
1. Check Next.js server logs for detailed error messages
2. Verify environment variables are set correctly on the server
3. Ensure search index is built and populated
4. Verify hotel codes are valid
5. Check API response structure matches expected models
6. Ensure dates are not in the past
7. Verify guest nationality is a valid ISO country code

---

**Last Updated:** 2025-01-15  
**Version:** 1.0  
**Next.js API Version:** Based on current implementation
