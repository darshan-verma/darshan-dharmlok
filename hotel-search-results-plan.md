now we have setted up the seach function for the hotel using our search indexing , no we have to search the hotel using the search hotel ui , for that it will use this endpoint :
https://affiliate.tektravels.com/HotelAPI/Search
and the request data  will be like this 
{
    "CheckIn": "2024-06-20",
    "CheckOut": "2024-06-22",
    "HotelCodes": "1279415",
    "GuestNationality": "IN",
    "PaxRooms": [
        {
            "Adults": 1,
            "Children": 0,
            "ChildrenAges": null
        }
 
    ],
    "ResponseTime": 23.0,
    "IsDetailedResponse": true,
    "Filters": {
        "Refundable": false,
        "NoOfRooms": 0, (O to get all the rooms available from supplier, if 1 or 2 is passed then only 1 or 2 rooms will be available from the supplier)
        "MealType": ,
        "StarRating": 
    }
}
and the response 
{
    "Status": {
        "Code": 200,
        "Description": "Successful"
    },
    "HotelResult": [
        {
            "HotelCode": "1279415",
            "Currency": "INR",
            "Rooms": [
                {
                    "Name": [
                        "Room, 1 King Bed (Palm),NonSmoking"
                    ],
                    "BookingCode": "1279415!TB!1!TB!824dfee5-fbbd-11ee-b528-966483a6018a!TB!AFF!",
                    "Inclusion": "Free valet parking,Free self parking",
                    "DayRates": [
                        [
                            {
                                "BasePrice": 534.24
                            },
                            {
                                "BasePrice": 534.24
                            }
                        ]
                    ],
                    "TotalFare": 1308.92,
                    "TotalTax": 240.44,
			"RoomID": [
                        "3326603",
                        "3326603"
                    ]
                    "RoomPromotion": [
                        "Free waterpark access for 2 per day"
                    ],
                    "CancelPolicies": [
                        {
                            "Index": "1",
                            "FromDate": "15-04-2024 00:00:00",
                            "ChargeType": "Percentage",
                            "CancellationCharge": 100
                        }
                    ],
                    "MealType": "Room_Only",
                    "IsRefundable": false,
                    "Supplements": [
                        [
                            {
                                "Index": 1,
                                "Type": "AtProperty",
                                "Description": "mandatory_tax",
                                "Price": 40,
                                "Currency": "AED"
                            }
                        ]
                    ],
                    "WithTransfers": false
                }
            ]
        }
    ]
}

and for Multiple Room Request

{
    "CheckIn": "2024-06-20",
    "CheckOut": "2024-06-22",
    "HotelCodes": "1279415",
    "GuestNationality": "IN",
    "PaxRooms": [
        {
            "Adults": 1,
            "Children": 0,
            "ChildrenAges": null
        },
        {
            "Adults": 1,
            "Children": 0,
            "ChildrenAges": null
        }
 
    ],
    "ResponseTime": 23.0,
    "IsDetailedResponse": true,
    "Filters": {
        "Refundable": false,
        "NoOfRooms": 0, (O to get all the rooms available from supplier, if 1 or 2 is passed then only 1 or 2 rooms will be available from the supplier)
        "MealType": ,
        "StarRating": 
    }
}

  
Multiple Room Response

{
    "Status": {
        "Code": 200,
        "Description": "Successful"
    },
    "HotelResult": [
        {
            "HotelCode": "1279415",
            "Currency": "INR",
            "Rooms": [
                {
                    "Name": [
                        "Room, 1 King Bed (Palm),NonSmoking",
                        "Room, 1 King Bed (Palm),NonSmoking"
                    ],
                    "BookingCode": "1279415!TB!1!TB!85d362b3-fbbf-11ee-b528-966483a6018a!TB!AFF!",
                    "Inclusion": "Free valet parking,Free self parking",
                    "DayRates": [
                        [
                            {
                                "BasePrice": 534.24
                            },
                            {
                                "BasePrice": 534.24
                            }
                        ],
                        [
                            {
                                "BasePrice": 534.24
                            },
                            {
                                "BasePrice": 534.24
                            }
                        ]
                    ],
                    "TotalFare": 2617.84,
                    "TotalTax": 480.88,
                    "RoomPromotion": [
                        "Free waterpark access for 2 per day",
                        "Free waterpark access for 2 per day"
                    ],
                    "CancelPolicies": [
                        {
                            "Index": "1",
                            "FromDate": "15-04-2024 00:00:00",
                            "ChargeType": "Percentage",
                            "CancellationCharge": 100
                        },
                        {
                            "Index": "2",
                            "FromDate": "15-04-2024 00:00:00",
                            "ChargeType": "Percentage",
                            "CancellationCharge": 100
                        }
                    ],
                    "MealType": "Room_Only",
                    "IsRefundable": false,
                    "Supplements": [
                        [
                            {
                                "Index": 1,
                                "Type": "AtProperty",
                                "Description": "mandatory_tax",
                                "Price": 40,
                                "Currency": "AED"
                            }
                        ],
                        [
                            {
                                "Index": 2,
                                "Type": "AtProperty",
                                "Description": "mandatory_tax",
                                "Price": 40,
                                "Currency": "AED"
                            }
                        ]
                    ],
                    "WithTransfers": false
                },
                {
                    "Name": [
                        "Room, 2 Queen Beds (Ocean),NonSmoking",
                        "Room, 2 Queen Beds (Ocean),NonSmoking"
                    ],
                    "BookingCode": "1279415!TB!2!TB!85d362b3-fbbf-11ee-b528-966483a6018a!TB!AFF!",
                    "Inclusion": "Free valet parking,Free self parking",
                    "DayRates": [
                        [
                            {
                                "BasePrice": 566.1
                            },
                            {
                                "BasePrice": 566.1
                            }
                        ],
                        [
                            {
                                "BasePrice": 566.1
                            },
                            {
                                "BasePrice": 566.1
                            }
                        ]
                    ],
                    "TotalFare": 2773.84,
                    "TotalTax": 509.44,
                    "RoomPromotion": [
                        "Free waterpark access for 2 per day",
                        "Free waterpark access for 2 per day"
                    ],
                    "CancelPolicies": [
                        {
                            "Index": "1",
                            "FromDate": "15-04-2024 00:00:00",
                            "ChargeType": "Percentage",
                            "CancellationCharge": 100
                        },
                        {
                            "Index": "2",
                            "FromDate": "15-04-2024 00:00:00",
                            "ChargeType": "Percentage",
                            "CancellationCharge": 100
                        }
                    ],
                    "MealType": "Room_Only",
                    "IsRefundable": false,
                    "Supplements": [
                        [
                            {
                                "Index": 1,
                                "Type": "AtProperty",
                                "Description": "mandatory_tax",
                                "Price": 40,
                                "Currency": "AED"
                            }
                        ],
                        [
                            {
                                "Index": 2,
                                "Type": "AtProperty",
                                "Description": "mandatory_tax",
                                "Price": 40,
                                "Currency": "AED"
                            }
                        ]
                    ],
                    "WithTransfers": false
                }
            ]
        }
    ]
}

and for making the filters in HotelSearch page use can use data from api response to make filter 

GetHotelResult Request

This method is used to request room availability. Some filters and special features can be applied before sending an availability request.

CheckIn

Format: String
Comments: Check-In date of the stay. Format: YYYY-MM-DD

CheckOut

Format: String
Comments: Check-Out date of the stay. Format YYYY-MM-DD

HotelCodes

Format: String
Comments: List of TBO codes of the requested hotels (comma separated list) Recommended Value; 100 hotel codes

GuestNationality

Format: String
Comments: Lead guest nationality (in ISO 3166-1 alpha-2 letter country codes) E.g., United Arab Emirates – AE, Turkey – TR (If Guest is resident of UAE and searching for UAE hotels then guest can send his nationality as AE)

NoOfRooms

Format: Integer
Comments: Filter for the maximum number of rooms the client wants to receive in the response.

PaxRooms

Format: Array
Comments: Contains an array of occupancy for each room

Adults

Format: Integer
Comments: Number of Adult guests (1-8) per room

Children

Format: Integer
Comments: Number of Child guests (1-4) per room

ChildrenAges

Format: Integer (Array)
Comments: List of children ages (0-18 years). The length of array is equal to the number of children in the room. E.g.: [2, 8] if request contains 2 children.

ResponseTime

Format: Integer
Comments: Expected response time (seconds)

IsDetailedResponse

Format: Boolean
Comments: To get additional details in the search response like the day-wise break-up and detailed cancel policies. Default Value; False

Filters

Format: Object
Comments: Refine the search response

Refundable

Format: Boolean
Comments: Set it True in case only Refundable rooms are required. Default Value; False

MealType

Format: Enumeration
Comments: Filter response based on available meals. Possible Values. All, WithMeal and RoomOnly

GetHotelResult Response
Status

Format: Object

Code

Format: Integer
Description: Internal code to denote response status.

Description

Format: String
Description: Descriptive message.

HotelResult

Format: Array
Description: Information regarding the hotels

HotelCode

Format: String
Description: TBOH hotel code

Currency

Format: String
Description: Configured currency in the API profile of the client.

Room(s)

Format: Array
Description: Contains a list of bookable rooms

Name

Format: Array of String
Description: Contain the list of room name. In case of multiple rooms first element represents the first room and so on.

BookingCode

Format: String
Description: Unique Identifier for each bookable unit.

Inclusion

Format: String
Description: Inclusion associated with rooms if any

DayRates

Format: List of Array
Description: Displays price breakdown per each day of the hotel stay.

BasePrice

Format: Decimal
Description: BasePrice of the room.

TotalFare

Format: Decimal
Description: Total fare of the bookable unit without TDS/TCS

TotalTax

Format: Decimal
Description: Total tax of the bookable unit without TDS/TCS

RoomID

Format: Integer
Description: Used to map room details with Hotel Details method to map room details

ExtraGuestCharges

Format: Decimal
Description: Extra Guest charges of the bookable unit (if applicable)

RecommendedSellingRate

Format: String
Description: The minimum selling rate for the requested booking. The B2C client cannot sell the room at a rate lower than the RecommendedSellingRate returned in the response, if any.

RoomPromotion

Format: List of String Array
Description: List of promotions on the rate. In the case of multi-room, first element defines promotion for the first room, other respectively

CancelPolicies

Format: Array
Description: It contains the list of detailed cancel policies applicable on the bookable unit.

Index

Format: String
Description: Denotes the room index for which cancellation policies is applicable. If missing, policies are applicable for entire booking

FromDate

Format: String
Description: Cancel policy start date

ChargeType

Format: String
Description: Charge type for cancellation policies e.g., fixed amount, percentage value etc.

CancellationCharge

Format: Decimal
Description: Cancellation charges applicable on bookable unit.

MealType

Format: Enumeration
Description: This reflects the meal type for the rate. Possible Values: Breakfast_For_2, Breakfast_For_1, All_Inclusive_All_Meal

IsRefundable

Format: Boolean
Description: Defines refundable and non-refundable room.

WithTransfers

Format: Boolean
Description: Defines if transfers are included.

Supplements

Format: List of Object
Description: It contains list of supplements. Please ensure some are visible to end customer.

Index

Format: Integer
Description: Denotes the room index for which supplement is applicable.

Type

Format: String
Description: Supplement charge type Possible Values:

Included: price included in total

AtProperty: charges need to be paid at the hotel

Description

Format: String
Description: Supplement details

Price

Format: Decimal
Description: Supplement charges

Currency

Format: String
Description: The applicable currency for the supplement charges.