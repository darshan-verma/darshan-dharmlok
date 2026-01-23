{
                    "AgentId": "AQAG060270",
                    "Username": "7506209217",
                    "Password": "7506209217"
                    }

2. Access URL
Test URL :http://airiqnewapi.mywebcheck.in/TravelAPI.svc


Production URL : Will be provided by mail on successful completion of Test Cases


Methods	URL
Login	{URL}/Login
Availability	{URL}/Availability
Fare Rules	{URL}/GetFareRule
Pricing	{URL}/Pricing
Seat Map	{URL}/GetAvailSeatMap
Booking	{URL}/Book
Ticketing	{URL}/IssueTicket
Get Booking	{URL}/RetrieveBooking
Get Account Balance	{URL}/GetBalance
Booking Track Status	{URL}/TrackStatus
Cancel	{URL}/Cancel
Reschedule Avail	{URL}/RescheduleAvail
Reschedule	{URL}/Reschedule
GetSSR	{URL}/GetSSR
AddSSR	{URL}/AddSSR
HoldCancel	{URL}/HoldCancel
GetMultiClass	{URL}/GetMultiClass
GetMultiClassFare	{URL}/GetMultiClassFare
3.1 Login Method
Parameters	Value
AgentID	Your Agent ID
Username	Your Username ID
Password	Your Password ID
3.2. Description
The most straightforward method of identifying is HTTP Basic Authentication. In this method, the three credentials—Agent ID, Username, and Password—are combined into a single value and sent through a special HTTP header called Authorization, where they are Base64-encoded. The Token needs to be repeated back in each future request, and the login procedure will return it. When a token expires, the login function must be called once more, and each request after that must include the updated Token.

A maximum of 5 active logins is allowed per user account.
If the user tries to log in more than 5 times concurrently, the system block the new login attempt.
A created token is good through the end of the day.
3.3 Authentication
HTTP Basic Authentication
Step 1: Produce a Base64 string using the reasoning shown below. AgentID*Username:Password

Step 2: Use the Base64 string as described below in the request header section

Key : Authorization

Value : Base64 string (Example:QUdFTlRJRCpNT0JJTEVOTzpQQVNTV09SRA==)

3.4 Response
3.4.1 Success
Copy Code
                                                        {
                                                        "AgentID": "XXXXXXXXXXXX",
                                                        "UserName": "XXXXXXXXXXXX ",
                                                        "Token": "3HjkLnFINC1SU05LTDA0MDAxMDEwNytBSDQtOTcwK0FINC1kaGFuYWErQ=",
                                                        "Status": {
                                                        "ResultCode": "1",
                                                        "Error": "",
                                                        "SequenceID": "1221485289115"
                                                        }
​
                                                    
3.4.2 Failure
Copy Code
                                                        {
                                                        "AgentID": "",
                                                        "Status": {
                                                        "Error": "Invalid Credentials",
                                                        "ResultCode": "0",
                                                        "SequenceID": "13070550229411"},
                                                        "Token": "",
                                                        "UserName": ""
                                                        }
                                                    
3.4.3 Exception
Copy Code
                                                        {
                                                        "AgentID": "",
                                                        "Status": {
                                                        "Error": "EX-Unable to authenticate",
                                                        "ResultCode": "-1",
                                                        "SequenceID": "13070550069411"
                                                        },
                                                        "Token": "",
                                                        "UserName": ""
                                                        }
                                                    
4 Availability
4.1 Method: Availability
4.2 Description
The availability method offers the cheapest fare choices as well as information on the flights that are currently available. The example request contains one AvailInfo query for a one-way trip. The return flight query should be added with this field if the trip is roundtrip. Booking engines begin looking for the best option among all available options after the requested query has been parsed and validated. Flight information will be returned in the ItineraryFlightList object if the search is successful.

4.3 Data Format and Details
Field Name	Data Type	Description
AgentID	String	Your Agent ID
Username	String	Your Username
AppType	String	Default Value API
Version	String	API version
TripType	String	>Trip Type shows the type of booking. It may be an O-Oneway or R-Roundtrip or Y-Roundtrip Special.
AirlineID	String	Two-letter airline code; mandatory for Roundtrip Special. For other cases, if left blank, the system defaults to all airlines.
DepartureStation	String	3 Letter IATA Departure Airport code
ArrivalStation	String	3 Letter IATA Arrival Airport code
FlightDate	Date	Travel date should be in the following format (yyyymmdd)
FarecabinOption	String	Cabin Identification E- Economy, P- Premium Economy, B- Business and F- First
FareType	String	Fare type indicator – N: Normal Fare, C: Corporate Fare, R: Retail Fare; mandatory for Roundtrip Special. For other cases, if left blank, the system defaults to all fare types
OnlyDirectFlight	Boolean	True –System responds only direct flight. False – System responds all the flights.
AdultCount	Integer	Minimum of 1 and Maximum up to 9
ChildCount	Integer	Total no of Adults and child can be maximum 9
InfantCount	Integer	Minimum of 1 and Maximum up to 4. Infant alone not allowed to travel
RoundTrip Special

Domestic flights with code Y: For FSC flights, you will receive a combined airline response with a single price. For LCC flights, you will receive onward and return flights with segment‑wise price breakups.
International flights with code Y: Similarly, for FSC flights, you will get a combined airline response with a single price. For LCC flights, you will get onward and return flights with segment‑wise price breakups.

4.4 Request
Copy Code
                                                        {
                                                        "AgentInfo": {
                                                        "AgentId": "XXXXXXXXX",
                                                        "UserName": "XXXXXXXXX",
                                                        "AppType": "API",
                                                        "Version": 2.0
                                                        },
                                                        "TripType": "O",
                                                        "AirlineID": "",
                                                        "AvailInfo": [
                                                        {
                                                        "DepartureStation": "IXB",
                                                        "ArrivalStation": "DEL",
                                                        "FlightDate": "20231114",
                                                        "FarecabinOption": "E",
                                                        "FareType": "N",
                                                        "OnlyDirectFlight": false
                                                        }
                                                        ],
                                                        "PassengersInfo": {
                                                        "AdultCount": "1",
                                                        "ChildCount": "0",
                                                        "InfantCount": "0"
                                                        }
                                                        }
                                                    
4.5 Response
4.5.1 Success
Refer to the sample JSON request and response that is attached

4.5.2 Failure
Copy Code
                                                        {
                                                        "ItineraryFlightList": null,
                                                        "Status": {
                                                        "Error": "Request format is invalid",
                                                        "ResultCode": "0",
                                                        "SequenceID": "11413958113534"
                                                        },
                                                        "Trackid": null
                                                        }
                                                    
4.5.3 Exception
Copy Code
                                                        {
                                                        "ItineraryFlightList": null,
                                                        "Status": {
                                                        "Error": "Ex-Unable to fetch the flight results.",
                                                        "ResultCode": "-1",
                                                        "SequenceID": "1141345598894"
                                                        },
                                                        "Trackid": null
                                                        }
                                                    
5 Fare Rules
5.1 Method: GetFareRule
5.2 Description
GetFarerule To obtain the terms and conditions of a specific flight option's fare, use the GetFarerule method. It includes the fare base code as well as other pertinent information.

5.3 Data Format and Details
Field Name	Data Type	Description
AgentID	String	Your Agent ID
Username	String	Your Username
AppType	String	Default Value API
Version	String	API version
FlightID	String	Pass the same value from Availability response.
TrackId	String	Unique reference Id from Availability response.
5.4 Request
Copy Code
                                                        {
                                                        "AgentInfo": {
                                                        "AgentId": "XXXXXXXXXX",
                                                        "UserName": "XXXXXXXXXX",
                                                        "AppType": "API",
                                                        "Version": 2.0
                                                        },
                                                        "FlightsInfo": [
                                                        {
                                                        "FlightID": "7368"
                                                        },
                                                        {
                                                        "FlightID": "7369"
                                                        }
                                                        ],
                                                        "Trackid": "AQ130816280740263181308249563236LAHRK1IJE3F"
                                                        }
                                                    
5.5 Response
5.5.1 Success
Refer to the sample JSON request and response that is attached

5.5.2 Failure
Copy Code
                                                        {
                                                        "FareRuleInfo": null,
                                                        "Status": {
                                                        "Error": "The requested token was timed out.",
                                                        "ResultCode": "0",
                                                        "SequenceID": "11112771818929"
                                                        }
                                                        }
                                                    
5.5.3 Exception
Copy Code
                                                        {
                                                        "FareRuleInfo": null,
                                                        "Status": {
                                                        "Error": "EX-Unable to get FareRule for the requested flight",
                                                        "ResultCode": "-1",
                                                        "SequenceID": "11205467465130"
                                                        }
                                                        }
                                                    
6 Pricing
6.1 Method: Pricing
6.2 Description
The chosen route must be re-priced using a pricing technique. If the selected fare is available, it will answer with a full fare breakdown, check-in baggage , mandatory booking details, and a list of any available SSRs, meal, baggage, and other services.

6.3 Data Format and Details
Field Name	Data Type	Description
AgentID	String	Your Agent ID
Username	String	Your Username
AppType	String	Default Value API
Version	String	API version
BaseOrigin	String	3 Letter IATA Departure Airport code.
BaseDestination	String	3 Letter IATA Arrival Airport code.
TripType	String	Trip Type shows the type of booking. It may be an O-Oneway or R-Roundtrip or Y-Roundtrip Special.
AdultCount	Integer	Minimum of 1 and Maximum up to 9
ChildCount	Integer	Total no of Adults and child can be maximum 9
InfantCount	Integer	Minimum of 1 and Maximum up to 4. Infant alone not allowed to travel
TrackId	String	Unique reference Id from Availability response.
FlightID	String	Pass the same value from Availability response.
FlightNumber	String	Booking Flight Number.
Origin	String	3 Letter IATA Departure Airport code.
Destination	String	3 Letter IATA Arrival Airport code.
DepartureDateTime	DateTime	Flight Departure Date and Time. [DD MMM YYYY HH:MM]
ArrivalDateTime	DateTime	Flight Arrival Date and Time. [DD MMM YYYY HH:MM]
BaseAmount	Decimal	Flight Basic Fare
GrossAmount	Decimal	Flight Gross fare
6.4 Request
Copy Code
                                                        {
                                                        "AgentInfo": {
                                                        "AgentId": "XXXXXXXX",
                                                        "UserName": "XXXXXXXXX",
                                                        "AppType": "API",
                                                        "Version": 2.0
                                                        },
                                                        "SegmentInfo": {
                                                        "BaseOrigin": "IXB",
                                                        "BaseDestination": "DEL",
                                                        "TripType": "O",
                                                        "AdultCount": "1",
                                                        "ChildCount": "0",
                                                        "InfantCount": "0"
                                                        },
                                                        "Trackid": "AQ130816280740263181308249563236LAHRK1IJE3F",
                                                        "ItineraryInfo": [
                                                        {
                                                        "FlightDetails": [
                                                        {
                                                        "FlightID": "7368",
                                                        "FlightNumber": "6E 292",
                                                        "Origin": "IXB",
                                                        "Destination": "CCU",
                                                        "DepartureDateTime": "14 Nov 2023 14:20",
                                                        "ArrivalDateTime": "14 Nov 2023 15:25"
                                                        },
                                                        {
                                                        "FlightID": "7369",
                                                        "FlightNumber": "6E 2516",
                                                        "Origin": "CCU",
                                                        "Destination": "DEL",
                                                        "DepartureDateTime": "14 Nov 2023 16:50",
                                                        "ArrivalDateTime": "14 Nov 2023 19:25"
                                                        }
                                                        ],
                                                        "BaseAmount": "15900.00",
                                                        "GrossAmount": "19873"
                                                        }
                                                        ]
                                                        }
                                                    
6.5 Response
6.5.1 Success
Refer to the sample JSON request and response that is attached

6.5.2 Failure
The seatmap for a certain flight option can be obtained using the GetAvailSeatMap function. It includes the seat information and other pertinent information related to it, such as seat restrictions and amount

Copy Code
                                                        {
                                                        "PriceItenaryInfo": null,
                                                        "ResponseStatus": {
                                                        "Error": "The requested token was timed out.",
                                                        "ResultCode": "0",
                                                        "SequenceID": "14571588578522"
                                                        }
                                                        }
                                                    
6.5.3 Exception
Copy Code
                                                        {
                                                        "PriceItenaryInfo": null,
                                                        "ResponseStatus": {
                                                        "Error": "EX-Unable to price the requested flights.",
                                                        "ResultCode": "-1",
                                                        "SequenceID": "14781588535522"
                                                        }
                                                        }
                                                    
7 Seat Map
7.1 Method: GetAvailSeatMap
7.2 Description
GetAvailSeatMap method is used to get the seatmap of a specific flight option. It contains the seat details and relevant details associated with it, such as seat restrictions and amount.

7.3 Data Format and Details
Field Name	Data Type	Description
AgentID	String	Your Agent ID
Username	String	Your Username
AppType	String	Default Value API
Version	String	API version
BaseOrigin	String	3 Letter IATA Departure Airport code.
BaseDestination	String	3 Letter IATA Arrival Airport code.
FlightID	String	Flight ID from from Pricing response.
FlightNumber	Integer	Flight Number from Pricing response.
Origin	Integer	3 Letter IATA Departure Airport code.
Destination	Integer	3 Letter IATA Arrival Airport code.
DepartureDateTime	DateTime	Flight Departure Date and Time. [DD MMM YYYY HH:MM]
ArrivalDateTime	DateTime	Flight Arrival Date and Time. [DD MMM YYYY HH:MM]
PaxRefNumber	Integer	Passenger wise unique serial reference number.
Title	String	Passenger Salutation / Title [Mr, Mrs, Miss, Ms, Mstr and Dr]
PaxType	String	Indicates booking passenger type (ADT/CHD/INF)
FirstName	String	First Name of the booking Passenger.
LastName	String	Last Name of the booking Passenger
TrackId	String	Unique reference Id from Pricing response.
7.4 Request
Copy Code
                                                        {
                                                        "AgentInfo": {
                                                        "AgentId": "XXXXXXX",
                                                        "UserName": "XXXXXXXXX",
                                                        "AppType": "API",
                                                        "Version": 2.0
                                                        },
                                                        "SegmentInfo": {
                                                        "BaseOrigin": "IXB",
                                                        "BaseDestination": "DEL",
                                                        "TripType": "O"
                                                        },
                                                        "FlightsInfo": [
                                                        {
                                                        "FlightID": "7368",
                                                        "FlightNumber": "6E 292",
                                                        "Origin": "IXB",
                                                        "Destination": "CCU",
                                                        "DepartureDateTime": "14 Nov 2023 14:20",
                                                        "ArrivalDateTime": "14 Nov 2023 15:25"
                                                        },
                                                        {
                                                        "FlightID": "7369",
                                                        "FlightNumber": "6E 2516",
                                                        "Origin": "CCU",
                                                        "Destination": "DEL",
                                                        "DepartureDateTime": "14 Nov 2023 16:50",
                                                        "ArrivalDateTime": "14 Nov 2023 19:25"
                                                        }
                                                        ],
                                                        "APIPaxDetails": [
                                                        {
                                                        "PaxRefNumber": "1",
                                                        "Title": "Mr",
                                                        "PaxType": "ADT",
                                                        "FirstName": "TESTA",
                                                        "LastName": "TEST"
                                                        }
                                                        ],
                                                        "TrackId": "AQ131620651068521731316232989362MDJAYW12CHN"
                                                        }
                                                    
7.5 Response
Field Name	Data Type	Description
Seat Group	String	If passenger selects any premium seat or window/aisle seat, then charges will be applied on the same and will be reflected in AssignSeats response. You can identify the seat charges as well as Seat Groupfrom the tag namely ‘SeatGroup’ in GetAvailSeatMap Response.
Seat Position	String	A seat position in an airline refers to the positioning of a seat on an aircraft. Ex :- A row seats are window seats, B row seats are middle seats, and C row seats are aisle seats.
Seat Status	String	The availability of a seat on an aircraft is referred to as seat status in the airline. A code, such as "true" for availability or "false" for lack of availability.
XAxis	String	X-axis" would represent the horizontal axis. It helps in identifying the location of seats from side to side within the aircraft.
YAxis	String	Y-axis" would represent the vertical axis, It helps in identifying the location of seats from side to side within the aircraft.
Copy Code
                                                        {
                                                        "FlightSeat": [
                                                        {
                                                        "SeatMap": [
                                                        {
                                                        "Destination": "CCU",
                                                        "ItinRef": "0",
                                                        "MaxHeight": "69",
                                                        "MaxWidth": "14",
                                                        "Origin": "IXB",
                                                        "SeatAmount": "0",
                                                        "SeatAvailability": "Closed",
                                                        "SeatCategory": "",
                                                        "SeatCharacterstic": "",
                                                        "SeatGroup": "98",
                                                        "SeatID": "AQ132051322175817861320538751323B63WSHXSZQY|1640",
                                                        "SeatMessage": "",
                                                        "SeatName": "1A",
                                                        "SeatPosition": "",
                                                        "SeatRef": "1A",
                                                        "SeatReferenceAPI": "",
                                                        "SeatStatus": "true",
                                                        "SeatType": "NS",
                                                        "Seatcharacteristics": null,
                                                        "SegRef": "1",
                                                        "WingSeat": "",
                                                        "XAxis": "1",
                                                        "YAxis": "6"
                                                        }
                                                        ]
                                                        }
                                                        ]
                                                        }
                                                    
7.5.1 Success
Refer to the sample JSON request and response that is attached

7.5.2 Failure
Copy Code
                                                        {
                                                        "FlightSeat": null,
                                                        "ResponseStatus": {
                                                        "Error": "The requested token was timed out.",
                                                        "ResultCode": "0",
                                                        "SequenceID": "85433868698134"
                                                        }
                                                        }
                                                    
7.5.3 Exception
Copy Code
                                                        {
                                                        "FlightSeat": null,
                                                        "ResponseStatus": {
                                                        "Error": "EX-Unable to fetch seat for the requested segments.",
                                                        "ResultCode": "-1",
                                                        "SequenceID": "174533868988134"
                                                        }
                                                        }
                                                    
8 Booking
8.1 Method: Booking
8.2 Description
Booking The booking technique is used to reserve seats, meals, luggage, and other ancillary services for one or more people together with route information (air itinerary), traveller’s information, and contact information for a specific itinerary based on the most recent price quote.

Note: In case of booking with GST need to provide the details in GSTInfo(For more details refer annexure 14.2)

8.3 Data Format and Details
Field Name	Data Type	Description
AgentID	String	Your Agent ID
Username	String	Your Username
AppType	String	Default Value API
Version	String	API version
AdultCount	Integer	Minimum of 1 and Maximum up to 9
ChildCount	Integer	Total no of Adults and child can be maximum 9
InfantCount	Integer	Minimum of 1 and Maximum up to 4. Infant alone not allowed to travel
ItineraryFlightsInfo
Token	String	Pricing reference value
FlightID	String	Pass the same value from Pricing response.
FlightNumber	String	Booking Flight Number.
Origin	String	3 Letter IATA Departure Airport code.
Destination	String	3 Letter IATA Arrival Airport code.
DepartureDateTime	DateTime	Flight Departure Date and Time. [DD MMM YYYY HH:MM]
ArrivalDateTime	DateTime	Flight Arrival Date and Time. [DD MMM YYYY HH:MM]
PaymentMode	String	Mode of Payment T- Agent Deposit
SeatID	String	Pass the same value from Seatmap response.
PaxRefNumber	Integer	Unique passenger reference ID starts with 1
BaggageID	String	Pass the same value from Pricing response.
PaxRefNumber	Integer	Unique passenger reference ID starts with 1
MealID	String	Pass the same value from Pricing response.
PaxRefNumber	Integer	Unique passenger reference ID starts with 1
OtherSSRID	String	Pass the same value from Pricing response.
PaxRefNumber	Integer	Unique passenger reference ID starts with 1
PaxDetailsInfo
PaxRefNumber	Integer	Passenger wise unique serial reference number.
Title	String	Passenger Salutation / Title [Mr, Mrs, Miss, Ms, Mstr and Dr]
FirstName	String	First Name of the booking Passenger
LastName	String	Last Name of the booking Passenger
DOB	Date	Date of Birth of the booking Passenger [DD/MM/YYYY]
Gender	String	Gender identification of the booking Passenger
PaxType	String	Indicates booking passenger type (ADT/CHD/INF)
PassportNo	String	Passport Number of the booking passenger
PassportExpiry	Date	Passport Expiry date of the booking passenger [DD/MM/YYYY]
PassportIssuedDate	Date	Passport Issued date of the booking passenger [DD/MM/YYYY]
PassportCountryCode	String	Passport Issued CountryCode [Eg:IN,US,CA]
InfantRef	String	Indicator to identify in case of travelling with Infant passenger
AddressDetails
CountryCode	String	Dialing country code of the booking passenger
ContactNumber	String	Contact Number of the booking passenger
EmailID	String	Email ID of the booking passenger
GSTInfo
GSTNumber	String	GST Number for the booking
GSTCompanyName	String	GST Company Name for the booking
GSTAddress	String	GST Address for the booking
GSTEmailID	String	GST EmailID for the booking
GSTMobileNumber	String	GST Mobile Number for the booking
TripType	String	Trip Type shows the type of booking. It may be an O-Oneway or R-Roundtrip or Y-Roundtrip Special.
BlockPNR	Boolean	Refer Pricing response “AllowBlockPNR = true” the flight is eligible to Block / Hold the booking. BlockPNR=False: Ticket get issued immediately. BlockPNR=True: Hold the booking.
BaseOrigin	String	3 Letter IATA Departure Airport code.
BaseDestination	String	3 Letter IATA Arrival Airport code.
TrackId	String	Unique reference Id from Pricing response.
8.4 Request
Copy Code
                                                        {
                                                        "AgentInfo": {
                                                        "AgentId": "XXXXXXX",
                                                        "UserName": "XXXXXXXXXX",
                                                        "AppType": "API",
                                                        "Version": 2.0
                                                        },
                                                        "AdultCount": 1,
                                                        "ChildCount": 0,
                                                        "InfantCount": 0,
                                                        "ItineraryFlightsInfo": [
                                                        {
                                                        "Token": "AQAG0D9569010007722",
                                                        "FlightsInfo": [
                                                        {
                                                        "FlightID": "7368",
                                                        "FlightNumber": "6E 292",
                                                        "Origin": "IXB",
                                                        "Destination": "CCU",
                                                        "DepartureDateTime": "14 Nov 2023 14:20",
                                                        "ArrivalDateTime": "14 Nov 2023 15:25"
                                                        },
                                                        {
                                                        "FlightID": "7369",
                                                        "FlightNumber": "6E 2516",
                                                        "Origin": "CCU",
                                                        "Destination": "DEL",
                                                        "DepartureDateTime": "14 Nov 2023 16:50",
                                                        "ArrivalDateTime": "14 Nov 2023 19:25"
                                                        }
                                                        ],
                                                        "PaymentMode": "T",
                                                        "SeatsSSRInfo": [
                                                        {
                                                        "PaxRefNumber": "1",
                                                        "SeatID": "AQ132051322175817861320538751323B63WSHXSZQY|1646"
                                                        }
                                                        ],
                                                        "BaggSSRInfo": [
                                                        {
                                                        "BaggageID": "6941",
                                                        "PaxRefNumber": "1"
                                                        }
                                                        ],
                                                        "MealsSSRInfo": [
                                                        {
                                                        "MealID": "8322",
                                                        "PaxRefNumber": "1"
                                                        }
                                                        ],
                                                        "OtherSSRInfo": [],
                                                        "PaymentInfo": [
                                                        {
                                                        "TotalAmount": "22598"
                                                        }
                                                        ]
                                                        }
                                                        ],
                                                        "PaxDetailsInfo": [
                                                        {
                                                        "PaxRefNumber": "1",
                                                        "Title": "MR",
                                                        "FirstName": "TESTA",
                                                        "LastName": "TEST",
                                                        "DOB": "11/05/1992",
                                                        "Gender": "Male",
                                                        "PaxType": "ADT",
                                                        "PassportNo": "",
                                                        "PassportExpiry": "",
                                                        "PassportIssuedDate": "",
                                                        "InfantRef": ""
                                                        }
                                                        ],
                                                        "AddressDetails": {
                                                        "CountryCode": "91",
                                                        "ContactNumber": "9876543210",
                                                        "EmailID": "test123@gmail.com"
                                                        },
                                                        "GSTInfo": {
                                                        "GSTNumber": "",
                                                        "GSTCompanyName": "",
                                                        "GSTAddress": "",
                                                        "GSTEmailID": "",
                                                        "GSTMobileNumber": ""
                                                        },
                                                        "FFNumberInfo": [
                                                        {
                                                        "SegRefNumber": "1",
                                                        "PaxRefNumber": "1",
                                                        "AirlineCode": "6E",
                                                        "FlyerNumber": "028504394",
                                                        "Itinref": "0"
                                                        }
                                                        ],
                                                        "TripType": "O",
                                                        "BlockPNR": false,
                                                        "BaseOrigin": "IXB",
                                                        "BaseDestination": "DEL",
                                                        "TrackId": "AQ131620651068521731316232989362MDJAYW12CHN"
                                                        }
                                                    
8.5 Response
8.5.1 Success
Refer to the sample JSON request and response that is attached

8.5.2 Pending
Copy Code
                                                        {
                                                        "TrackId": "AQRSNKL040010107415171120221517568383190023565",
                                                        "Bookingresponse": {
                                                        "ItinearyDetails": null
                                                        },
                                                        "Status": {
                                                        "Error": "The booking might be confirmed. Please check customer care.",
                                                        "ResultCode": "2",
                                                        "SequenceID": "15152533966567"
                                                        }
                                                        }
                                                    
8.5.3 Failure
Copy Code
                                                        {
                                                        "TrackId": "AQ1143196379622320221117114324",
                                                        "Bookingresponse": {
                                                        "ItinearyDetails": null
                                                        },
                                                        "Status": {
                                                        "Error": "The requested token was timed out. ",
                                                        "ResultCode": "0",
                                                        "SequenceID": "16295878029252"}
                                                        }
                                                    
8.5.4 Exception
Copy Code
                                                        {
                                                        "TrackId": "AQRSNKL040010107415171120221517568383190023565",
                                                        "Bookingresponse": {
                                                        "ItinearyDetails": null
                                                        },
                                                        "Status": {
                                                        "Error": "EX-Unable to book for the requested segments. ",
                                                        "ResultCode": "-1",
                                                        "SequenceID": "12355533746467"
                                                        }
                                                        }
                                                    
9 Ticketing
9.1 Method: IssueTicket
9.2 Description
This method is to be called to confirm the ticket for already blocked itinerary.

9.3 Data Format and Details
Field Name	Data Type	Description
AgentID	String	Your Agent ID
Username	String	Your Username
AppType	String	Default Value API
Version	String	API version
BookingTrackId	String	Unique reference Id from Booking response.
AirIqPNR	String	Airiq Booking reference number
AirlinePNR	String	Airline Booking reference number
BookingAmount	Decimal	Total Booking Amount
PaymentMode	String	Mode of Payment T- Agent Deposit
9.4 Request
Copy Code
                                                        {
                                                        "AgentInfo": {
                                                        "AgentId": "XXXXXXXXX",
                                                        "UserName": "XXXXX",
                                                        "AppType": "API",
                                                        "Version": 2.0
                                                        },
                                                        "BookingTrackId": "AQRSNKL040010107699181120220906471464990023574",
                                                        "AirIqPNR": "BX18DK0003",
                                                        "AirlinePNR": "UKS1QA",
                                                        "BookingAmount": "11262.00",
                                                        "PaymentMode": "T"
                                                        }
                                                    
9.5 Response
9.5.1 Success
Refer to the sample JSON request and response that is attached

9.5.2 Pending
Copy Code
                                                        {
                                                        "TrackId": "AQRSNKL040010107699181120220906471464990023574",
                                                        "Bookingresponse": {
                                                        "ItinearyDetails": null
                                                        },
                                                        "Status": {
                                                        "Error": "The booking might be confirmed. Please check customer care.",
                                                        "ResultCode": "2",
                                                        "SequenceID": "15155537725467"
                                                        }
                                                        }
                                                    
9.5.3 Failure
Copy Code
                                                        {
                                                        "TrackId": "AQRSNKL040010107699181120220906471464990023574",
                                                        "Bookingresponse":{
                                                        "ItinearyDetails": null
                                                        },
                                                        "Status":{                                                         
                                                        "Error": "The requested token was timed out. ",
                                                        "ResultCode": "0",
                                                        "SequenceID": "38291478098842"}
                                                        }
                                                        }
                                                    
9.5.4 Exception
Copy Code
                                                        {
                                                        "TrackId": "AQRSNKL040010107699181120220906471464990023574",
                                                        "Bookingresponse": {
                                                        "ItinearyDetails": null
                                                        },
                                                        "Status":{
                                                        "Error": "EX-Unable to book for the requested segments. ",
                                                        "ResultCode": "-1",
                                                        "SequenceID": "15155533947484"
                                                        }
                                                        }
                                                    
10 Get Booking
10.1 Method: RetrieveBooking
10.2 Description
This method is to be called to confirm the ticket for already blocked itinerary.

10.3 Data Format and Details
Field Name	Data Type	Description
AgentID	String	Your Agent ID
Username	String	Your Username
AppType	String	Default Value API
Version	String	API version
AirIqPNR	String	Airiq Booking reference number
10.4 Request
Copy Code
                                                        {
                                                        "AgentInfo": {
                                                        "AgentId": "XXXXXXXXXXXXXXX",
                                                        "UserName": "XXXXXXXX ",
                                                        "AppType": "API",
                                                        "Version": 2.0
                                                        },
                                                        "Item": [
                                                        {
                                                        "AirIqPNR": "BX17DK0005"
                                                        }
                                                        ]
                                                        }
                                                    
10.5 Response
10.5.1 Success
Refer to the sample JSON request and response that is attached

10.5.2 Failure
Copy Code
                                                        {
                                                        "Retrieveresponse": null,
                                                        "Status": {
                                                        "Error": "The requested token was timed out.",
                                                        "ResultCode": "0",
                                                        "SequenceID": "18133268418217"
                                                        }
                                                        }
                                                    
10.5.3 Exception
Copy Code
                                                        {
                                                        "Retrieveresponse": null,
                                                        "Status":
                                                        {
                                                        "Error": "EX-Unable to get RetrivePnr for the requested segments.",
                                                        "ResultCode": "-1",
                                                        "SequenceID": "19822143798711"}
                                                        }
                                                    




