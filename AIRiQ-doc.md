For Login endpoint is - http://airiqnewapi.mywebcheck.in/TravelAPI.svc/Login
request data is - {
                    "AgentId": "AQAG060270",
                    "Username": "7506209217",
                    "Password": "7506209217"
                    }

response data is - {
    "AgentID": "AQAG060270",
    "Status": {
        "Error": "",
        "ResultCode": "1",
        "SequenceID": "10175622655412008"
    },
    "TerminalID": "AQAG06027001",
    "Token": "U09DT3NBeE5nYUpaSlpOYURWRWdwNDhKZzFQL2hyaWk3SU5EUkx1MUVwQnl3SmJjWE5Ea013a09VdmV1bHNNcTZaUUtRem81Z21TUlBqcDJmMlhTRHExSnA3SVZ3dktwY2Q3bS9ZTmdzMTFUU1VtR3BQbEZyRW9lTXhwcXlIa3JjSVEybk02UlFHRVRJOVVZd2NvV0NGRy80SExhU2hCMGk5SlpvRFptaHpuMHE5enQ1NjF6TWZuRC9BR0krLS9pV0ZTcXU5NGNlQzkyak5sV29GTlJCWkErQUQwQVBRLQ==",
    "UserName": "7506209217"
}

And for Avaliability endpoint is - http://airiqnewapi.mywebcheck.in/TravelAPI.svc/Availability

and req data is - {
"AgentInfo":{
"AgentId":"AQAG060270",
"UserName":"7506209217",
"AppType":"API",
"Version":2.0
},
"TripType":"O",
"AirlineID":"",
"AvailInfo":[
{
"DepartureStation":"IXB",
"ArrivalStation":"DEL",
"FlightDate":"20260114",
"FarecabinOption":"E",
"FareType":"N",
"OnlyDirectFlight":false
}
],
"PassengersInfo":{
"AdultCount":"1",
"ChildCount":"0",
"InfantCount":"0"
}
}

ignore the values we just need key of this json 

and this is the response of the avaliability - 
{
    "Trackid": "AQ10321701032828461639029269499982757",
    "ItineraryFlightList": [
        {
            "Items": [
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2081",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 9642",
                            "Origin": "IXB",
                            "Destination": "CCU",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "",
                            "DepartureDateTime": "14 Jan 2026 09:35",
                            "ArrivalDateTime": "14 Jan 2026 10:50",
                            "Class": "H",
                            "JourneyTime": "",
                            "ReferenceToken": "gkovdReZJGpmYooh9wrCK5hN7M0z5A71ERlTuD26OkgMKtPTv2kijjv/uFo0+Qt86lB2tqwwBXrNU2jBeq6p+SLi8O6VCde22QoQ+WglHOb5JvoNcPtl07xKY2EFLg0ABRP3gGOfJY1H4zqkvUuAqQNnzABHncjMpNoV4FSnTNiqCZDHJQlrqVv98Y1aLrV8FL/BC48JjZwtyvcRDtJumdxYX/qZGLFT2/NAOgsMmVzuxc613eoo/Py9eMtpblRZ",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_0",
                            "Cabin": "E",
                            "FareBasisCode": "HK1YXYII",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "Y",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "IX",
                            "SegmentDetails": "\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : \r\nBaggage : 15 KG",
                            "FlyingTime": "75",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2082",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 2770",
                            "Origin": "CCU",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "3",
                            "DepartureDateTime": "14 Jan 2026 12:40",
                            "ArrivalDateTime": "14 Jan 2026 15:15",
                            "Class": "V",
                            "JourneyTime": "340",
                            "ReferenceToken": "gkovdReZJGpmYooh9wrCK5hN7M0z5A71ERlTuD26OkgMKtPTv2kijjv/uFo0+Qt86lB2tqwwBXrNU2jBeq6p+SLi8O6VCde22QoQ+WglHOb5JvoNcPtl07xKY2EFLg0ABRP3gGOfJY1H4zqkvUuAqQNnzABHncjMpNoV4FSnTNiqCZDHJQlrqVv98Y1aLrV8FL/BC48JjZwtyvcRDtJumdxYX/qZGLFT2/NAOgsMmVzuxc613eoo/Py9eMtpblRZ",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_0",
                            "Cabin": "E",
                            "FareBasisCode": "VU1YXSII",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "N",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "AI",
                            "SegmentDetails": "\r\nJourney Time : 340\r\nStart Terminal : \r\nEndTerminal : 3\r\nBaggage : 15 KG",
                            "FlyingTime": "155",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "11520.00",
                                    "TotalTaxAmount": "2088",
                                    "GrossAmount": "13608",
                                    "NetAmount": "13608",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "0.00",
                                    "PLBAmount": "0.00",
                                    "SF": "0.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "576.00",
                                            "Code": "K3"
                                        },
                                        {
                                            "Amount": "236.00",
                                            "Code": "P2"
                                        },
                                        {
                                            "Amount": "330.00",
                                            "Code": "YR"
                                        },
                                        {
                                            "Amount": "946.00",
                                            "Code": "IN"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "AI_N_0"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2083",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 9644",
                            "Origin": "IXB",
                            "Destination": "CCU",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "",
                            "DepartureDateTime": "14 Jan 2026 12:00",
                            "ArrivalDateTime": "14 Jan 2026 13:15",
                            "Class": "H",
                            "JourneyTime": "",
                            "ReferenceToken": "XRNoQSq8c0sJmnuYjHNHOPZfQVB3TJ/eeVYMON3uzmjXtN3nluJVDOmLMdvNuUfbjovNb4BTumAm4of32fO1+bWc6i7X1vb+BpYPkAujxj5Ptue8IvnLDtkduJjmmOanPi1i0LK7ue6vCOp17KnZSCrvRbfYSJy/UYbUTB32eE5Qo/vwAQI2VZN018g3+zvx2swEv4bfgxgSJu6wBGt/VhG85o8kG0zojVltzmJNlN1YS5qxdoPGQTFayHBygFeF",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_1",
                            "Cabin": "E",
                            "FareBasisCode": "HK1YXYII",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "Y",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "IX",
                            "SegmentDetails": "\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : \r\nBaggage : 15 KG",
                            "FlyingTime": "75",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2084",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 2768",
                            "Origin": "CCU",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "3",
                            "DepartureDateTime": "14 Jan 2026 16:15",
                            "ArrivalDateTime": "14 Jan 2026 18:50",
                            "Class": "V",
                            "JourneyTime": "410",
                            "ReferenceToken": "XRNoQSq8c0sJmnuYjHNHOPZfQVB3TJ/eeVYMON3uzmjXtN3nluJVDOmLMdvNuUfbjovNb4BTumAm4of32fO1+bWc6i7X1vb+BpYPkAujxj5Ptue8IvnLDtkduJjmmOanPi1i0LK7ue6vCOp17KnZSCrvRbfYSJy/UYbUTB32eE5Qo/vwAQI2VZN018g3+zvx2swEv4bfgxgSJu6wBGt/VhG85o8kG0zojVltzmJNlN1YS5qxdoPGQTFayHBygFeF",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_1",
                            "Cabin": "E",
                            "FareBasisCode": "VU1YXSII",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "N",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "AI",
                            "SegmentDetails": "\r\nJourney Time : 410\r\nStart Terminal : \r\nEndTerminal : 3\r\nBaggage : 15 KG",
                            "FlyingTime": "155",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "11520.00",
                                    "TotalTaxAmount": "2088",
                                    "GrossAmount": "13608",
                                    "NetAmount": "13608",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "0.00",
                                    "PLBAmount": "0.00",
                                    "SF": "0.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "576.00",
                                            "Code": "K3"
                                        },
                                        {
                                            "Amount": "236.00",
                                            "Code": "P2"
                                        },
                                        {
                                            "Amount": "330.00",
                                            "Code": "YR"
                                        },
                                        {
                                            "Amount": "946.00",
                                            "Code": "IN"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "AI_N_1"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2085",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 9659",
                            "Origin": "IXB",
                            "Destination": "HYD",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "",
                            "DepartureDateTime": "14 Jan 2026 18:05",
                            "ArrivalDateTime": "14 Jan 2026 20:40",
                            "Class": "M",
                            "JourneyTime": "",
                            "ReferenceToken": "KW/A/s2SIA62JxJxyIANwNTrqbNej1eUM82NGrJ5b+E5fiCfY80v0IsVg42Ua0hFwfMB5XiqXATNdUGCvpGt6n67PKKjBj5Oiu40fK4u1Mj+fz+gps/YZWMXy1p2yKD6Vwo/xpo7SvJH3vchC0hICDHmNz7D2bs/NXfE71pbPzuCtrtvuif+ijgUOpmoJvLOsqxgtG8nTlnBd/Erve3GZPa9kGSufJOfUfKIrztINwveMSspNYN5OjL6d2KOWvNZ",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_2",
                            "Cabin": "E",
                            "FareBasisCode": "MK1YXYII",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "Y",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "IX",
                            "SegmentDetails": "\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : \r\nBaggage : 15 KG",
                            "FlyingTime": "155",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2086",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 2464",
                            "Origin": "HYD",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "3",
                            "DepartureDateTime": "14 Jan 2026 22:40",
                            "ArrivalDateTime": "15 Jan 2026 00:55",
                            "Class": "G",
                            "JourneyTime": "410",
                            "ReferenceToken": "KW/A/s2SIA62JxJxyIANwNTrqbNej1eUM82NGrJ5b+E5fiCfY80v0IsVg42Ua0hFwfMB5XiqXATNdUGCvpGt6n67PKKjBj5Oiu40fK4u1Mj+fz+gps/YZWMXy1p2yKD6Vwo/xpo7SvJH3vchC0hICDHmNz7D2bs/NXfE71pbPzuCtrtvuif+ijgUOpmoJvLOsqxgtG8nTlnBd/Erve3GZPa9kGSufJOfUfKIrztINwveMSspNYN5OjL6d2KOWvNZ",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_2",
                            "Cabin": "E",
                            "FareBasisCode": "GU1YXSII",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "N",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "AI",
                            "SegmentDetails": "\r\nJourney Time : 410\r\nStart Terminal : \r\nEndTerminal : 3\r\nBaggage : 15 KG",
                            "FlyingTime": "135",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "17781.00",
                                    "TotalTaxAmount": "2411",
                                    "GrossAmount": "20192",
                                    "NetAmount": "20192",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "0.00",
                                    "PLBAmount": "0.00",
                                    "SF": "0.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "889.00",
                                            "Code": "K3"
                                        },
                                        {
                                            "Amount": "236.00",
                                            "Code": "P2"
                                        },
                                        {
                                            "Amount": "340.00",
                                            "Code": "YR"
                                        },
                                        {
                                            "Amount": "946.00",
                                            "Code": "IN"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "AI_N_2"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2087",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 9644",
                            "Origin": "IXB",
                            "Destination": "CCU",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "",
                            "DepartureDateTime": "14 Jan 2026 12:00",
                            "ArrivalDateTime": "14 Jan 2026 13:15",
                            "Class": "H",
                            "JourneyTime": "",
                            "ReferenceToken": "XRNoQSq8c0sJmnuYjHNHOPZfQVB3TJ/eeVYMON3uzmjXtN3nluJVDOmLMdvNuUfbjovNb4BTumAm4of32fO1+QwV9Huw460WRMwmLPPB2HQ4szZS1+qTe7LWeUSjKvquf1FK1DLpXiP/ZN6gAEyxOQUghBhEfl6Sxdfxwt1YkF7JU6IweCFpSMwxKvxz6y6DOoM0PLIKkPcqy3LydaE6S+/WoNVadiY0jnBzevHI93tet4yWVV76cvx9WBd1rdqvJ+enaLTa1QbUfWNcVrcK5p6fKHrF8UjhPg1af0N3mFKAy/qi17wMHsaQK2nzQ+geOYhScCVgtrIr1pcHwxkD70+kFUs1Bk0ecvwxeveNCmQ=",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_3",
                            "Cabin": "E",
                            "FareBasisCode": "HK1YXYII",
                            "Stops": "2",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "Y",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "IX",
                            "SegmentDetails": "\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : \r\nBaggage : 15 KG",
                            "FlyingTime": "75",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2088",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 2472",
                            "Origin": "CCU",
                            "Destination": "BOM",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 15:10",
                            "ArrivalDateTime": "14 Jan 2026 18:10",
                            "Class": "V",
                            "JourneyTime": "",
                            "ReferenceToken": "XRNoQSq8c0sJmnuYjHNHOPZfQVB3TJ/eeVYMON3uzmjXtN3nluJVDOmLMdvNuUfbjovNb4BTumAm4of32fO1+QwV9Huw460WRMwmLPPB2HQ4szZS1+qTe7LWeUSjKvquf1FK1DLpXiP/ZN6gAEyxOQUghBhEfl6Sxdfxwt1YkF7JU6IweCFpSMwxKvxz6y6DOoM0PLIKkPcqy3LydaE6S+/WoNVadiY0jnBzevHI93tet4yWVV76cvx9WBd1rdqvJ+enaLTa1QbUfWNcVrcK5p6fKHrF8UjhPg1af0N3mFKAy/qi17wMHsaQK2nzQ+geOYhScCVgtrIr1pcHwxkD70+kFUs1Bk0ecvwxeveNCmQ=",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_3",
                            "Cabin": "E",
                            "FareBasisCode": "VU1YXSII",
                            "Stops": "2",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "Y",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "AI",
                            "SegmentDetails": "\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "180",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2089",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 2426",
                            "Origin": "BOM",
                            "Destination": "DEL",
                            "DepartureTerminal": "2",
                            "ArrivalTerminal": "3",
                            "DepartureDateTime": "14 Jan 2026 19:00",
                            "ArrivalDateTime": "14 Jan 2026 21:15",
                            "Class": "V",
                            "JourneyTime": "555",
                            "ReferenceToken": "XRNoQSq8c0sJmnuYjHNHOPZfQVB3TJ/eeVYMON3uzmjXtN3nluJVDOmLMdvNuUfbjovNb4BTumAm4of32fO1+QwV9Huw460WRMwmLPPB2HQ4szZS1+qTe7LWeUSjKvquf1FK1DLpXiP/ZN6gAEyxOQUghBhEfl6Sxdfxwt1YkF7JU6IweCFpSMwxKvxz6y6DOoM0PLIKkPcqy3LydaE6S+/WoNVadiY0jnBzevHI93tet4yWVV76cvx9WBd1rdqvJ+enaLTa1QbUfWNcVrcK5p6fKHrF8UjhPg1af0N3mFKAy/qi17wMHsaQK2nzQ+geOYhScCVgtrIr1pcHwxkD70+kFUs1Bk0ecvwxeveNCmQ=",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_3",
                            "Cabin": "E",
                            "FareBasisCode": "VU1YXSII",
                            "Stops": "2",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "N",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "AI",
                            "SegmentDetails": "\r\nJourney Time : 555\r\nStart Terminal : 2\r\nEndTerminal : 3\r\nBaggage : 15 KG",
                            "FlyingTime": "135",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "21517.00",
                                    "TotalTaxAmount": "2758",
                                    "GrossAmount": "24275",
                                    "NetAmount": "24275",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "0.00",
                                    "PLBAmount": "0.00",
                                    "SF": "0.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1076.00",
                                            "Code": "K3"
                                        },
                                        {
                                            "Amount": "236.00",
                                            "Code": "P2"
                                        },
                                        {
                                            "Amount": "500.00",
                                            "Code": "YR"
                                        },
                                        {
                                            "Amount": "946.00",
                                            "Code": "IN"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "AI_N_3"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2090",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 9632",
                            "Origin": "IXB",
                            "Destination": "BLR",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 14:40",
                            "ArrivalDateTime": "14 Jan 2026 17:40",
                            "Class": "H",
                            "JourneyTime": "",
                            "ReferenceToken": "472LBivOClNs566jn3F+NJnv1S8wkQ5WtidbMZJFQpbSi9FI1fHTxQ8zPceIcP3eLTeGYMgBSPwtiyKFbMcYkPCxsMnokcZdIxw8x7SrCyyYfHTuk0S5VHKRZz3ZsLT4ddE+4YUjM6/GElsjSTFFCprjmHhWjo0uIQarJIwkaWRi3DxdXQr6MzjNVdzasZJecAWxqTJ+lP+XZ9nMdCpFmq2sDdy9YRK+JbJIWf8/EBpzVqIGXF+GyOxZfmG3sW0iDcjvgyiSWUKPL3FtMJ7eqINkl5EwbOoUjE54ygeXEe2Y3ElASmZMYZVPNoABMh9GGJCWp1NqJHF2Af/jWcxIlZ52CxUiBAPPm2ooNotipXk=",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_4",
                            "Cabin": "E",
                            "FareBasisCode": "HK1YXYII",
                            "Stops": "2",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "Y",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "IX",
                            "SegmentDetails": "\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "180",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2091",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 2864",
                            "Origin": "BLR",
                            "Destination": "BOM",
                            "DepartureTerminal": "2",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 19:45",
                            "ArrivalDateTime": "14 Jan 2026 21:50",
                            "Class": "W",
                            "JourneyTime": "",
                            "ReferenceToken": "472LBivOClNs566jn3F+NJnv1S8wkQ5WtidbMZJFQpbSi9FI1fHTxQ8zPceIcP3eLTeGYMgBSPwtiyKFbMcYkPCxsMnokcZdIxw8x7SrCyyYfHTuk0S5VHKRZz3ZsLT4ddE+4YUjM6/GElsjSTFFCprjmHhWjo0uIQarJIwkaWRi3DxdXQr6MzjNVdzasZJecAWxqTJ+lP+XZ9nMdCpFmq2sDdy9YRK+JbJIWf8/EBpzVqIGXF+GyOxZfmG3sW0iDcjvgyiSWUKPL3FtMJ7eqINkl5EwbOoUjE54ygeXEe2Y3ElASmZMYZVPNoABMh9GGJCWp1NqJHF2Af/jWcxIlZ52CxUiBAPPm2ooNotipXk=",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_4",
                            "Cabin": "E",
                            "FareBasisCode": "WU1YXSII",
                            "Stops": "2",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "Y",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "AI",
                            "SegmentDetails": "\r\nJourney Time : \r\nStart Terminal : 2\r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "125",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2092",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 2988",
                            "Origin": "BOM",
                            "Destination": "DEL",
                            "DepartureTerminal": "2",
                            "ArrivalTerminal": "3",
                            "DepartureDateTime": "14 Jan 2026 22:55",
                            "ArrivalDateTime": "14 Jan 2026 23:10",
                            "Class": "V",
                            "JourneyTime": "510",
                            "ReferenceToken": "472LBivOClNs566jn3F+NJnv1S8wkQ5WtidbMZJFQpbSi9FI1fHTxQ8zPceIcP3eLTeGYMgBSPwtiyKFbMcYkPCxsMnokcZdIxw8x7SrCyyYfHTuk0S5VHKRZz3ZsLT4ddE+4YUjM6/GElsjSTFFCprjmHhWjo0uIQarJIwkaWRi3DxdXQr6MzjNVdzasZJecAWxqTJ+lP+XZ9nMdCpFmq2sDdy9YRK+JbJIWf8/EBpzVqIGXF+GyOxZfmG3sW0iDcjvgyiSWUKPL3FtMJ7eqINkl5EwbOoUjE54ygeXEe2Y3ElASmZMYZVPNoABMh9GGJCWp1NqJHF2Af/jWcxIlZ52CxUiBAPPm2ooNotipXk=",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_4",
                            "Cabin": "E",
                            "FareBasisCode": "VU1YXSII",
                            "Stops": "2",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "N",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "AI",
                            "SegmentDetails": "\r\nJourney Time : 510\r\nStart Terminal : 2\r\nEndTerminal : 3\r\nBaggage : 15 KG",
                            "FlyingTime": "15",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "27297.00",
                                    "TotalTaxAmount": "3057",
                                    "GrossAmount": "30354",
                                    "NetAmount": "30354",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "0.00",
                                    "PLBAmount": "0.00",
                                    "SF": "0.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1365.00",
                                            "Code": "K3"
                                        },
                                        {
                                            "Amount": "236.00",
                                            "Code": "P2"
                                        },
                                        {
                                            "Amount": "510.00",
                                            "Code": "YR"
                                        },
                                        {
                                            "Amount": "946.00",
                                            "Code": "IN"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "AI_N_4"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2093",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 9632",
                            "Origin": "IXB",
                            "Destination": "BLR",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 14:40",
                            "ArrivalDateTime": "14 Jan 2026 17:40",
                            "Class": "H",
                            "JourneyTime": "",
                            "ReferenceToken": "472LBivOClNs566jn3F+NJnv1S8wkQ5WtidbMZJFQpbSi9FI1fHTxQ8zPceIcP3eLTeGYMgBSPwtiyKFbMcYkPCxsMnokcZdIxw8x7SrCyzUBc9lTxR9sm2FfDgAY3CL8CtPhYlGgcWsJFtc6byKGpzVTU5RJR8W8yYo9cziPYd8fr4y0CcC0L/w0A+JA2k+GIA8vjwTnsRemPSPsQFPb+fMC/wNBGgixevD8VreVig2LD/hNXKXGgDJQMIZ44JgAI6J9EPkf0bnp79MZuO4J5YgUgL9aCwd4g3NseAqriZU1Dpv+p6HBkHEmPTr0GB3VSzN8p5v+7LVq6HsksCwImmFWrqVZt98OaFqvDWY6Lo=",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_5",
                            "Cabin": "E",
                            "FareBasisCode": "HK1YXYII",
                            "Stops": "2",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "Y",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "IX",
                            "SegmentDetails": "\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "180",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2094",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 2610",
                            "Origin": "BLR",
                            "Destination": "BOM",
                            "DepartureTerminal": "2",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 19:20",
                            "ArrivalDateTime": "14 Jan 2026 21:30",
                            "Class": "V",
                            "JourneyTime": "",
                            "ReferenceToken": "472LBivOClNs566jn3F+NJnv1S8wkQ5WtidbMZJFQpbSi9FI1fHTxQ8zPceIcP3eLTeGYMgBSPwtiyKFbMcYkPCxsMnokcZdIxw8x7SrCyzUBc9lTxR9sm2FfDgAY3CL8CtPhYlGgcWsJFtc6byKGpzVTU5RJR8W8yYo9cziPYd8fr4y0CcC0L/w0A+JA2k+GIA8vjwTnsRemPSPsQFPb+fMC/wNBGgixevD8VreVig2LD/hNXKXGgDJQMIZ44JgAI6J9EPkf0bnp79MZuO4J5YgUgL9aCwd4g3NseAqriZU1Dpv+p6HBkHEmPTr0GB3VSzN8p5v+7LVq6HsksCwImmFWrqVZt98OaFqvDWY6Lo=",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_5",
                            "Cabin": "E",
                            "FareBasisCode": "VU1YXSII",
                            "Stops": "2",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "Y",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "AI",
                            "SegmentDetails": "\r\nJourney Time : \r\nStart Terminal : 2\r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "130",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2095",
                            "AirlineDescription": "AI",
                            "FlightNumber": "AI 2988",
                            "Origin": "BOM",
                            "Destination": "DEL",
                            "DepartureTerminal": "2",
                            "ArrivalTerminal": "3",
                            "DepartureDateTime": "14 Jan 2026 22:55",
                            "ArrivalDateTime": "14 Jan 2026 23:10",
                            "Class": "V",
                            "JourneyTime": "510",
                            "ReferenceToken": "472LBivOClNs566jn3F+NJnv1S8wkQ5WtidbMZJFQpbSi9FI1fHTxQ8zPceIcP3eLTeGYMgBSPwtiyKFbMcYkPCxsMnokcZdIxw8x7SrCyzUBc9lTxR9sm2FfDgAY3CL8CtPhYlGgcWsJFtc6byKGpzVTU5RJR8W8yYo9cziPYd8fr4y0CcC0L/w0A+JA2k+GIA8vjwTnsRemPSPsQFPb+fMC/wNBGgixevD8VreVig2LD/hNXKXGgDJQMIZ44JgAI6J9EPkf0bnp79MZuO4J5YgUgL9aCwd4g3NseAqriZU1Dpv+p6HBkHEmPTr0GB3VSzN8p5v+7LVq6HsksCwImmFWrqVZt98OaFqvDWY6Lo=",
                            "SegRef": "0",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "AI_N_5",
                            "Cabin": "E",
                            "FareBasisCode": "VU1YXSII",
                            "Stops": "2",
                            "Via": "",
                            "AirlineCategory": "FSC",
                            "CNX": "N",
                            "PlatingCarrier": "AI",
                            "OperatingCarrier": "AI",
                            "SegmentDetails": "\r\nJourney Time : 510\r\nStart Terminal : 2\r\nEndTerminal : 3\r\nBaggage : 15 KG",
                            "FlyingTime": "15",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": true,
                            "AvailSeat": "",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "NDC Economy : Value",
                            "FareDescription": "NDC Economy : Value",
                            "FareRuleInfo": "",
                            "Refundable": "",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "27936.00",
                                    "TotalTaxAmount": "3089",
                                    "GrossAmount": "31025",
                                    "NetAmount": "31025",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "0.00",
                                    "PLBAmount": "0.00",
                                    "SF": "0.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1397.00",
                                            "Code": "K3"
                                        },
                                        {
                                            "Amount": "236.00",
                                            "Code": "P2"
                                        },
                                        {
                                            "Amount": "510.00",
                                            "Code": "YR"
                                        },
                                        {
                                            "Amount": "946.00",
                                            "Code": "IN"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "AI_N_5"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2096",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 2147",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 10:00",
                            "ArrivalDateTime": "14 Jan 2026 12:15",
                            "Class": "R",
                            "JourneyTime": "135",
                            "ReferenceToken": "uFFQehtcXsEMv8Vd60pqQfCcFw4+QPeg8wqW+tYHol+qb+j87kZCOI4/JST/7wtGcqoisS2xt9vOf07Q7ycE7zWPdhwB5tFQKzXou33ZBam9D7Ux/Gi8RbUHMHtF/IGxoz3U5QsQxz2xTWvzYNGR/rfseiJTixiXF5tqX/GCm19hrJreHdPHqD1ivk8BsGDm",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "6E_N_0",
                            "Cabin": "E",
                            "FareBasisCode": "R0IP",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A321\r\nJourney Time : 135\r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "135",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "18",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "3667",
                                    "TotalTaxAmount": "1909",
                                    "GrossAmount": "5576",
                                    "NetAmount": "5496",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "100.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1909",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "6E_N_0"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2097",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 2241",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 15:30",
                            "ArrivalDateTime": "14 Jan 2026 17:45",
                            "Class": "R",
                            "JourneyTime": "135",
                            "ReferenceToken": "uFFQehtcXsEMv8Vd60pqQfCcFw4+QPeg8wqW+tYHol9I7K0AfDnUH9admFDBbHX4e1gV3X2SCY/Xh9/9nwVayoLF2kibktvXfSQSUT1z4LE6ctD7hV0l72SZEKNkwXqru4moE12ybrogB91xIgLGTAYBAet+HFFEz9s9d+AypoqkrICTozLXXrYzTVJ9Gd2v",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "6E_N_1",
                            "Cabin": "E",
                            "FareBasisCode": "R0IP",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A321\r\nJourney Time : 135\r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "135",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "139",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "3667",
                                    "TotalTaxAmount": "1909",
                                    "GrossAmount": "5576",
                                    "NetAmount": "5496",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "100.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1909",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "6E_N_1"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2098",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 2604",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 16:55",
                            "ArrivalDateTime": "14 Jan 2026 19:10",
                            "Class": "R",
                            "JourneyTime": "135",
                            "ReferenceToken": "uFFQehtcXsEMv8Vd60pqQfCcFw4+QPeg8wqW+tYHol877pYe5t23rzET7ngDLNAo7mygo+d4SXyaQcV59jjSty/1ZW6o0ktAKNqapc8RzESqlJq/ws9kMhJd5Ie7QAxNXtm89gHOXb7RrSu/aMf+Kvv5gaBfvnf9wdLt5WvS93ZmnoJRrLtMoL6ysWEdRGe+",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "6E_N_2",
                            "Cabin": "E",
                            "FareBasisCode": "R0IP",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A321\r\nJourney Time : 135\r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "135",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "19",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "3667",
                                    "TotalTaxAmount": "1909",
                                    "GrossAmount": "5576",
                                    "NetAmount": "5496",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "100.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1909",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "6E_N_2"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2099",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 347",
                            "Origin": "IXB",
                            "Destination": "HYD",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "",
                            "DepartureDateTime": "14 Jan 2026 11:20",
                            "ArrivalDateTime": "14 Jan 2026 13:55",
                            "Class": "R",
                            "JourneyTime": "",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfub3nAkQVhQavH1ZeoQw+MZcldcH4XATBZXYBxOvAHVfaI75gJDI4tl0V3m6Isry6wEl4in8gvP9AGofh+qqdrPKU0LItnC8idoiM2glZPY3WKd+wLk4WJX3H756CHVGZAisF/wmtYsej26j3qhGFT8Vc9LFDgsrl1XFgkwuSqjhgu1VdAPsNfhI6pud4dpEhqxYDZtwxZO+0Ab/L3RACnCV6wVfkvUDsT6xM2/bRPt80=",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_3",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "Y",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A321\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : \r\nBaggage : 15 KG",
                            "FlyingTime": "155",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "81",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2100",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 2233",
                            "Origin": "HYD",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 20:00",
                            "ArrivalDateTime": "14 Jan 2026 22:20",
                            "Class": "R",
                            "JourneyTime": "660",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfub3nAkQVhQavH1ZeoQw+MZcldcH4XATBZXYBxOvAHVfaI75gJDI4tl0V3m6Isry6wEl4in8gvP9AGofh+qqdrPKU0LItnC8idoiM2glZPY3WKd+wLk4WJX3H756CHVGZAisF/wmtYsej26j3qhGFT8Vc9LFDgsrl1XFgkwuSqjhgu1VdAPsNfhI6pud4dpEhqxYDZtwxZO+0Ab/L3RACnCV6wVfkvUDsT6xM2/bRPt80=",
                            "SegRef": "2",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_3",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A321\r\nJourney Time : 660\r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "140",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "81",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "5688",
                                    "TotalTaxAmount": "2030",
                                    "GrossAmount": "7718",
                                    "NetAmount": "7638",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "100.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "2030",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "6E_N_3"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2101",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 619",
                            "Origin": "IXB",
                            "Destination": "HYD",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "",
                            "DepartureDateTime": "14 Jan 2026 13:10",
                            "ArrivalDateTime": "14 Jan 2026 15:45",
                            "Class": "R",
                            "JourneyTime": "",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfuXuXi/fgx6D1KePCQvJGK1TBE0l+O7CMuT0M3mpivs+enyiZ8KORhedAwjFRRfLgnvraQp3dYl7+FXTQm1OMKHLfbtQ7oNc3umgClGTZg6RIY4jYjftdKpiq6l8uAFfczrGggayopFZSXafK9kocHmOB4oAnFPVamnCdeZDxXftPQ5YavhSm2jq/6b5Rja7MB8kUtJms3pVzZB+Wtzy6ESJkmy/W2PEPAhpUwIQ/iu44=",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_4",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "Y",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A320\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : \r\nBaggage : 15 KG",
                            "FlyingTime": "155",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "81",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2102",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 2233",
                            "Origin": "HYD",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 20:00",
                            "ArrivalDateTime": "14 Jan 2026 22:20",
                            "Class": "R",
                            "JourneyTime": "550",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfuXuXi/fgx6D1KePCQvJGK1TBE0l+O7CMuT0M3mpivs+enyiZ8KORhedAwjFRRfLgnvraQp3dYl7+FXTQm1OMKHLfbtQ7oNc3umgClGTZg6RIY4jYjftdKpiq6l8uAFfczrGggayopFZSXafK9kocHmOB4oAnFPVamnCdeZDxXftPQ5YavhSm2jq/6b5Rja7MB8kUtJms3pVzZB+Wtzy6ESJkmy/W2PEPAhpUwIQ/iu44=",
                            "SegRef": "2",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_4",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A321\r\nJourney Time : 550\r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "140",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "81",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "5688",
                                    "TotalTaxAmount": "2030",
                                    "GrossAmount": "7718",
                                    "NetAmount": "7638",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "100.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "2030",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "6E_N_4"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2103",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 292",
                            "Origin": "IXB",
                            "Destination": "CCU",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "",
                            "DepartureDateTime": "14 Jan 2026 14:45",
                            "ArrivalDateTime": "14 Jan 2026 15:55",
                            "Class": "R",
                            "JourneyTime": "",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfu4SZgo0KR8aM0K3S8Imoyl/pfCaeOXm3EGVTn94ZR++N6dLJSRyTrnj3ZYdLr1r5B2muyGogmxkeTss98M0Wc7agFM+uXGDMx12XmyAFRrOvUGk19a9VCl+MGoUfGKVWo+oufDKYGib0jKDwv+sS3qGLcuZkgOImDZYJLdiT8+AaJgE1ECLb6TfgBvVseF/nBrk9c0jDLdizsLCgwPUrK5dTApY9+tE9CY8zkdtiLsyE=",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_5",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "Y",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A320\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : \r\nBaggage : 15 KG",
                            "FlyingTime": "70",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "16",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2104",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 2079",
                            "Origin": "CCU",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 20:45",
                            "ArrivalDateTime": "14 Jan 2026 23:15",
                            "Class": "R",
                            "JourneyTime": "510",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfu4SZgo0KR8aM0K3S8Imoyl/pfCaeOXm3EGVTn94ZR++N6dLJSRyTrnj3ZYdLr1r5B2muyGogmxkeTss98M0Wc7agFM+uXGDMx12XmyAFRrOvUGk19a9VCl+MGoUfGKVWo+oufDKYGib0jKDwv+sS3qGLcuZkgOImDZYJLdiT8+AaJgE1ECLb6TfgBvVseF/nBrk9c0jDLdizsLCgwPUrK5dTApY9+tE9CY8zkdtiLsyE=",
                            "SegRef": "2",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_5",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A321\r\nJourney Time : 510\r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "150",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "16",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "5688",
                                    "TotalTaxAmount": "2030",
                                    "GrossAmount": "7718",
                                    "NetAmount": "7638",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "100.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "2030",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "6E_N_5"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2105",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 292",
                            "Origin": "IXB",
                            "Destination": "CCU",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "",
                            "DepartureDateTime": "14 Jan 2026 14:45",
                            "ArrivalDateTime": "14 Jan 2026 15:55",
                            "Class": "R",
                            "JourneyTime": "",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfu4SZgo0KR8aM0K3S8Imoyl/pfCaeOXm3EGVTn94ZR++N6dLJSRyTrnj3ZYdLr1r5B2muyGogmxkeTss98M0Wc7dI0wuy7UEsyCuwVKajB81xUAr0UuGPwLPYswoMlNKTWiEAFoimgSVrecQoHE81UGewRSUI1T1gxwqdyKi+UnDCVqOdaWAtlvStaTl/JkcVT9aAN0SvSPVenA7/iSLeHr+aBQRkbsryhoXnCR2NXU50=",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_6",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "Y",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A320\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : \r\nBaggage : 15 KG",
                            "FlyingTime": "70",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "3",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2106",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 2415",
                            "Origin": "CCU",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 22:30",
                            "ArrivalDateTime": "15 Jan 2026 01:00",
                            "Class": "R",
                            "JourneyTime": "615",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfu4SZgo0KR8aM0K3S8Imoyl/pfCaeOXm3EGVTn94ZR++N6dLJSRyTrnj3ZYdLr1r5B2muyGogmxkeTss98M0Wc7dI0wuy7UEsyCuwVKajB81xUAr0UuGPwLPYswoMlNKTWiEAFoimgSVrecQoHE81UGewRSUI1T1gxwqdyKi+UnDCVqOdaWAtlvStaTl/JkcVT9aAN0SvSPVenA7/iSLeHr+aBQRkbsryhoXnCR2NXU50=",
                            "SegRef": "2",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_6",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A321\r\nJourney Time : 615\r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "150",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "3",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "5688",
                                    "TotalTaxAmount": "2030",
                                    "GrossAmount": "7718",
                                    "NetAmount": "7638",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "100.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "2030",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "6E_N_6"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2107",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 6135",
                            "Origin": "IXB",
                            "Destination": "CCU",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "",
                            "DepartureDateTime": "14 Jan 2026 19:45",
                            "ArrivalDateTime": "14 Jan 2026 20:55",
                            "Class": "R",
                            "JourneyTime": "",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfu4Lqb6sEjoVE2SAUbHms9Copx3iR8z6oKGVZYH3YysOMbM6wG54GJ25Sm0XHzc0UMLDxmhG9igqn3V16oyO78wks0Z/iUwwNcsWFfvGi2FExd+/bd6PDfoGCBD0hs8I9DcXMNrEdw88CWUoCvBJUvGTWmFAa8CchYHO1V4l38Qo5lbjNhHuhX2ITs7UR5wQZHSCcP33n+K7wW4zSKIyfDD5EmZ7z2GYwkyfIjdJFDqXI=",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_7",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "Y",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A320\r\nJourney Time : \r\nStart Terminal : \r\nEndTerminal : \r\nBaggage : 15 KG",
                            "FlyingTime": "70",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "3",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        },
                        {
                            "FlightID": "2108",
                            "AirlineDescription": "6E",
                            "FlightNumber": "6E 2415",
                            "Origin": "CCU",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "2",
                            "DepartureDateTime": "14 Jan 2026 22:30",
                            "ArrivalDateTime": "15 Jan 2026 01:00",
                            "Class": "R",
                            "JourneyTime": "315",
                            "ReferenceToken": "7jLLKtjKl+cW/8xa4Lj6P5CnaYndhx1JTi3KZtNKODamJDXvoHXIasRp1hexIxfu4Lqb6sEjoVE2SAUbHms9Copx3iR8z6oKGVZYH3YysOMbM6wG54GJ25Sm0XHzc0UMLDxmhG9igqn3V16oyO78wks0Z/iUwwNcsWFfvGi2FExd+/bd6PDfoGCBD0hs8I9DcXMNrEdw88CWUoCvBJUvGTWmFAa8CchYHO1V4l38Qo5lbjNhHuhX2ITs7UR5wQZHSCcP33n+K7wW4zSKIyfDD5EmZ7z2GYwkyfIjdJFDqXI=",
                            "SegRef": "2",
                            "ItinRef": "0",
                            "ConnectionFlag": "S",
                            "FareId": "6E_N_7",
                            "Cabin": "E",
                            "FareBasisCode": "RCIP",
                            "Stops": "1",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "6E",
                            "OperatingCarrier": "6E",
                            "SegmentDetails": "Airbus A321\r\nJourney Time : 315\r\nStart Terminal : \r\nEndTerminal : 2\r\nBaggage : 15 KG",
                            "FlyingTime": "150",
                            "OfflineIndicator": false,
                            "MultiClass": "0",
                            "AllowFQT": false,
                            "AvailSeat": "3",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15 KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "5688",
                                    "TotalTaxAmount": "2030",
                                    "GrossAmount": "7718",
                                    "NetAmount": "7638",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "100.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "2030",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "6E_N_7"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2109",
                            "AirlineDescription": "SG",
                            "FlightNumber": "SG 904",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "1D",
                            "DepartureDateTime": "14 Jan 2026 08:10",
                            "ArrivalDateTime": "14 Jan 2026 10:35",
                            "Class": "L",
                            "JourneyTime": "145",
                            "ReferenceToken": "49pbnGMFde0X3zY1uTstLuVQ4xR3Eq+tp9kzidPAx6TMWLVSYJSwnVRED/yhNz8CE1Fg16RcY+g1nPqcHJNjF7L5GeBqTZoMhJOisgJo37/H3etCqSLW70AonyC4viWv/DcBQPRTfLMfTMNM+PjNv2LEtJJz63b+lhZqDM98I7hMZTxB1Ouyj/gduUjsDbFA",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "SG_N_0",
                            "Cabin": "E",
                            "FareBasisCode": "LCPN",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "SG",
                            "OperatingCarrier": "SG",
                            "SegmentDetails": "Boeing 7M8\r\nJourney Time : 145\r\nStart Terminal : \r\nEndTerminal : 1D\r\nBaggage : 15KG",
                            "FlyingTime": "145",
                            "OfflineIndicator": false,
                            "MultiClass": "1",
                            "AllowFQT": false,
                            "AvailSeat": "1",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "S",
                            "FareDescription": "Special",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "6200",
                                    "TotalTaxAmount": "1363",
                                    "GrossAmount": "7563",
                                    "NetAmount": "7573",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "10.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1363",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "SG_N_0"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2110",
                            "AirlineDescription": "SG",
                            "FlightNumber": "SG 189",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "1D",
                            "DepartureDateTime": "14 Jan 2026 18:55",
                            "ArrivalDateTime": "14 Jan 2026 22:00",
                            "Class": "L",
                            "JourneyTime": "185",
                            "ReferenceToken": "49pbnGMFde0X3zY1uTstLuVQ4xR3Eq+tp9kzidPAx6SR03gbCcU4vTHovs2+UanUL+yeLOEEHztYU2FdiyKfzrbGPvv2h8I90M3XW7VJwJc+Ck4DDD3LINmHq9IDf7IKchd2Q1SXh52F/gN5wVugNlQ5CXhGE3AD4ae19E0PmNaaeohuelTTNiOtOwwrLE/i",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "SG_N_1",
                            "Cabin": "E",
                            "FareBasisCode": "LCPN",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "SG",
                            "OperatingCarrier": "SG",
                            "SegmentDetails": "Boeing 7M8\r\nJourney Time : 185\r\nStart Terminal : \r\nEndTerminal : 1D\r\nBaggage : 15KG",
                            "FlyingTime": "185",
                            "OfflineIndicator": false,
                            "MultiClass": "1",
                            "AllowFQT": false,
                            "AvailSeat": "1",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "S",
                            "FareDescription": "Special",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "6200",
                                    "TotalTaxAmount": "1363",
                                    "GrossAmount": "7563",
                                    "NetAmount": "7573",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "10.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1363",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "SG_N_1"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2111",
                            "AirlineDescription": "SG",
                            "FlightNumber": "SG 904",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "1D",
                            "DepartureDateTime": "14 Jan 2026 08:10",
                            "ArrivalDateTime": "14 Jan 2026 10:35",
                            "Class": "L",
                            "JourneyTime": "145",
                            "ReferenceToken": "CbM/IzCbZRjbKsZZV9vxRjyoaFGzFSZVQp5HGAYbX/gfpw4Sn2i2dvcFWvoSboGFVxg6SkjEvTCS2e0Kghrnzo9BkE3VabYvNbbzRI5PuPhGVNRqBPWVP5h/wxjbhcrTjqMg2GBI67PojKxRi04ZP3Kyh+1g2nMDDJLgBMkP7RcSAQm84kOFRQS0Et255wIl",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "SG_N_2",
                            "Cabin": "E",
                            "FareBasisCode": "LSAV",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "SG",
                            "OperatingCarrier": "SG",
                            "SegmentDetails": "Boeing 7M8\r\nJourney Time : 145\r\nStart Terminal : \r\nEndTerminal : 1D\r\nBaggage : 15KG",
                            "FlyingTime": "145",
                            "OfflineIndicator": false,
                            "MultiClass": "1",
                            "AllowFQT": false,
                            "AvailSeat": "1",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "6350",
                                    "TotalTaxAmount": "1363",
                                    "GrossAmount": "7713",
                                    "NetAmount": "7723",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "10.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1363",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "SG_N_2"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2112",
                            "AirlineDescription": "SG",
                            "FlightNumber": "SG 189",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "1D",
                            "DepartureDateTime": "14 Jan 2026 18:55",
                            "ArrivalDateTime": "14 Jan 2026 22:00",
                            "Class": "L",
                            "JourneyTime": "185",
                            "ReferenceToken": "CbM/IzCbZRjbKsZZV9vxRjyoaFGzFSZVQp5HGAYbX/hR9Wr5p3AtzQI+3za4VU5GJ6yJM6kF858H4aZVup80QzK1JbdXPV1xZJAqReb5MlP+OrunX+uZX9bwpY7FBwii164eS9gqnRU9kr7ILOaqu7OQYTWVlnmES12tIBzsDvMYJAKNOqOWRjKC+EN1lo8D",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "SG_N_3",
                            "Cabin": "E",
                            "FareBasisCode": "LSAV",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "SG",
                            "OperatingCarrier": "SG",
                            "SegmentDetails": "Boeing 7M8\r\nJourney Time : 185\r\nStart Terminal : \r\nEndTerminal : 1D\r\nBaggage : 15KG",
                            "FlyingTime": "185",
                            "OfflineIndicator": false,
                            "MultiClass": "1",
                            "AllowFQT": false,
                            "AvailSeat": "1",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "N",
                            "FareDescription": "Normal",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "6350",
                                    "TotalTaxAmount": "1363",
                                    "GrossAmount": "7713",
                                    "NetAmount": "7723",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "10.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1363",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "SG_N_3"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2113",
                            "AirlineDescription": "SG",
                            "FlightNumber": "SG 904",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "1D",
                            "DepartureDateTime": "14 Jan 2026 08:10",
                            "ArrivalDateTime": "14 Jan 2026 10:35",
                            "Class": "L",
                            "JourneyTime": "145",
                            "ReferenceToken": "yPqRYCYR8TP/eQsA3BgdD/Zo19t75aweAnPHR6csi1bp9NMaFIgDoA/gGeDD/fOZioW+qqyM9vCcz3+4UB5NZUMX7iq58BXi/f0a0qDpynKmsKNxxPRWSNckFV1qPBHnwrl4pqmmB7+W+Mt6CfK3GRAzoPWDiKNTXwSHnzG0mUOmH3lnFjY0zidhqQg94LMk",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "SG_N_4",
                            "Cabin": "E",
                            "FareBasisCode": "LSMX",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "SG",
                            "OperatingCarrier": "SG",
                            "SegmentDetails": "Boeing 7M8\r\nJourney Time : 145\r\nStart Terminal : \r\nEndTerminal : 1D\r\nBaggage : 15KG",
                            "FlyingTime": "145",
                            "OfflineIndicator": false,
                            "MultiClass": "1",
                            "AllowFQT": false,
                            "AvailSeat": "1",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "D",
                            "FareDescription": "SpiceMax",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "7249",
                                    "TotalTaxAmount": "1363",
                                    "GrossAmount": "8612",
                                    "NetAmount": "8622",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "10.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1363",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "SG_N_4"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2114",
                            "AirlineDescription": "SG",
                            "FlightNumber": "SG 189",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "1D",
                            "DepartureDateTime": "14 Jan 2026 18:55",
                            "ArrivalDateTime": "14 Jan 2026 22:00",
                            "Class": "L",
                            "JourneyTime": "185",
                            "ReferenceToken": "yPqRYCYR8TP/eQsA3BgdD/Zo19t75aweAnPHR6csi1YHU52QnGhbFDiQCTA+OzR+DN07jVs2sufz+hg4kzYAXKQan3iz4VoAnucAT1bGDWTmQzL+++M439LVcDA0QuGl6MLlCFuJZKpeHJBs+Tlp/AEwxOB5e8YUy3a3e1G/VM2L+6qpPDzFzG+F9a+V0N04",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "SG_N_5",
                            "Cabin": "E",
                            "FareBasisCode": "LSMX",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "SG",
                            "OperatingCarrier": "SG",
                            "SegmentDetails": "Boeing 7M8\r\nJourney Time : 185\r\nStart Terminal : \r\nEndTerminal : 1D\r\nBaggage : 15KG",
                            "FlyingTime": "185",
                            "OfflineIndicator": false,
                            "MultiClass": "1",
                            "AllowFQT": false,
                            "AvailSeat": "1",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "D",
                            "FareDescription": "SpiceMax",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "7249",
                                    "TotalTaxAmount": "1363",
                                    "GrossAmount": "8612",
                                    "NetAmount": "8622",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "10.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1363",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "SG_N_5"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2115",
                            "AirlineDescription": "SG",
                            "FlightNumber": "SG 904",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "1D",
                            "DepartureDateTime": "14 Jan 2026 08:10",
                            "ArrivalDateTime": "14 Jan 2026 10:35",
                            "Class": "L",
                            "JourneyTime": "145",
                            "ReferenceToken": "qbFuBsMGXs8X99sDPZ/6/I5yxxtqXZb8EE1rlXl+PuV2R5CNWGiwVGtohaRGvDsn+OTPQKAqu3aj68Xi7HVA0qulmYHn8/bkGD3Pqv9x/SH95/pghuSc5f/Y8+izrBF/43UCu4rZB6b898iwDWiPJ7Lp7mGmB9HTwgQU3+RV1xFaJnLJI9JLNFIin0eTB7Sm",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "SG_N_6",
                            "Cabin": "E",
                            "FareBasisCode": "LSMF",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "SG",
                            "OperatingCarrier": "SG",
                            "SegmentDetails": "Boeing 7M8\r\nJourney Time : 145\r\nStart Terminal : \r\nEndTerminal : 1D\r\nBaggage : 15KG",
                            "FlyingTime": "145",
                            "OfflineIndicator": false,
                            "MultiClass": "1",
                            "AllowFQT": false,
                            "AvailSeat": "1",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "F",
                            "FareDescription": "Flexi",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "9567",
                                    "TotalTaxAmount": "1363",
                                    "GrossAmount": "10930",
                                    "NetAmount": "10940",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "10.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1363",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "SG_N_6"
                        }
                    ]
                },
                {
                    "FlightDetails": [
                        {
                            "FlightID": "2116",
                            "AirlineDescription": "SG",
                            "FlightNumber": "SG 189",
                            "Origin": "IXB",
                            "Destination": "DEL",
                            "DepartureTerminal": "",
                            "ArrivalTerminal": "1D",
                            "DepartureDateTime": "14 Jan 2026 18:55",
                            "ArrivalDateTime": "14 Jan 2026 22:00",
                            "Class": "L",
                            "JourneyTime": "185",
                            "ReferenceToken": "qbFuBsMGXs8X99sDPZ/6/I5yxxtqXZb8EE1rlXl+PuXeuJxb5wUm9K5WqMzpJ+V4QS5mrv3pKmat9IY2/cO1PQBhDWDUaLUxJtKtaubuU7Bh4UmOPpyTJi4cMqB4ADLCbP4I0Kw/94+rBSqrfK1UnX/fq9sGoVdm3os8v7a7pIReeqfdNe/aTx28if3FRgTs",
                            "SegRef": "1",
                            "ItinRef": "0",
                            "ConnectionFlag": "N",
                            "FareId": "SG_N_7",
                            "Cabin": "E",
                            "FareBasisCode": "LSMF",
                            "Stops": "0",
                            "Via": "",
                            "AirlineCategory": "LCC",
                            "CNX": "N",
                            "PlatingCarrier": "SG",
                            "OperatingCarrier": "SG",
                            "SegmentDetails": "Boeing 7M8\r\nJourney Time : 185\r\nStart Terminal : \r\nEndTerminal : 1D\r\nBaggage : 15KG",
                            "FlyingTime": "185",
                            "OfflineIndicator": false,
                            "MultiClass": "1",
                            "AllowFQT": false,
                            "AvailSeat": "1",
                            "PromoCode": "",
                            "PromoCodeDesc": "",
                            "FareTypeDescription": "F",
                            "FareDescription": "Flexi",
                            "FareRuleInfo": "",
                            "Refundable": "True",
                            "Baggage": "15KG",
                            "CabinBaggage": "7 Kg|-|-"
                        }
                    ],
                    "Fares": [
                        {
                            "Currency": "INR",
                            "FareType": "N",
                            "Faredescription": [
                                {
                                    "Paxtype": "ADT",
                                    "BaseAmount": "9567",
                                    "TotalTaxAmount": "1363",
                                    "GrossAmount": "10930",
                                    "NetAmount": "10940",
                                    "Incentive": "0.00",
                                    "Servicecharge": "0.00",
                                    "TDS": "0.00",
                                    "Discount": "10.00",
                                    "PLBAmount": "0.00",
                                    "SF": "20.00",
                                    "SFGST": "0.00",
                                    "Taxes": [
                                        {
                                            "Amount": "1363",
                                            "Code": "TAX"
                                        }
                                    ]
                                }
                            ],
                            "FlightId": "SG_N_7"
                        }
                    ]
                }
            ]
        }
    ],
    "Status": {
        "Error": "",
        "ResultCode": "1",
        "SequenceID": "10321701032828461"
    }
}

and this is the doc from api - 
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
        {
"AgentID": "XXXXXXXXXXXX",
"UserName": "XXXXXXXXXXXX",
"Token": "3HjkLnFINC1SU05LTDA0MDAxMDEwNytBSDQtOTcwK0FINC1kaGFuYWErQ=",
"Status": {
"ResultCode": "1",
"Error": "",
"SequenceID": "1221485289115"
        }
        }

3.4.2 Failure
        {
"AgentID": "",
"Status": {
"Error": "InvalidCredentials",
"ResultCode": "0",
"SequenceID": "13070550229411"},
"Token": "",
"UserName": ""
}

3.4.3 Exception
    {
"AgentID": "",
"Status": {
"Error": "EX-Unabletoauthenticate",
"ResultCode": "-1",
"SequenceID": "13070550069411"
},
"Token": "",
"UserName": ""
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
                                                                                                        
                                                                                                 15 PostAncillary Avail
15.1 Data Format and Details
Field Name	Data Type	Description
AgentInfo.AgentId	String	Your Agent ID
AgentInfo.UserName	String	Your Username
AgentInfo.AppType	String	Default Value: API
AgentInfo.Version	String	API version
Airiq PNR	String	Your Airiq PNR
Airline PNR	String	Your Airline PNR
15.2 Get Ssr Request
Copy Code
                                                            {
                                                            "AgentInfo": {
                                                            "AgentId": "XXXXXXXX",
                                                            "UserName": "XXXXXXXXXXX",
                                                            "AppType": "API",
                                                            "Version": "XXX"
                                                            },
                                                            "AirIqPNR": "AF23HC0015",
                                                            "AirlinePNR" :"BEK4PX"
                                                            }
                                                        
15.3 Get Ssr Responces
Copy Code
                                                            {
                                                            "TrackId": "AQ143613790123208541436182601064CGDVYIH6EK0",
                                                            "SsrDetails": {
                                                            "Baggages": [
                                                            {
                                                            "Amount": "4500",
                                                            "Code": "ExcessBaggage 10KG|EB10",
                                                            "Description": "ExcessBaggage 10KG",
                                                            "Destination": "DEL",
                                                            "Id": "9735",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "0"
                                                            },
                                                            {
                                                            "Amount": "2250",
                                                            "Code": "ExcessBaggage 05KG|EB05",
                                                            "Description": "ExcessBaggage 05KG",
                                                            "Destination": "DEL",
                                                            "Id": "9736",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "0"
                                                            }
                                                            ],
                                                            "Meals": [
                                                            {
                                                            "Amount": "300",
                                                            "Code": "Vegetables in Red Thai Curry with Steamed Rice|VCC2",
                                                            "Description": "Vegetables in Red Thai Curry with Steamed Rice",
                                                            "Destination": "DEL",
                                                            "Id": "6785",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1"
                                                            },
                                                            {
                                                            "Amount": "300",
                                                            "Code": "Chicken in Red Thai Curry with Steamed Rice|NCC2",
                                                            "Description": "Chicken in Red Thai Curry with Steamed Rice",
                                                            "Destination": "DEL",
                                                            "Id": "6786",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1"
                                                            },
                                                            {
                                                            "Amount": "300",
                                                            "Code": "Grilled Chicken Breast with Mushroom Sauce, Yellow Rice, SautÃ© Carrot and Beans Baton|NCC1",
                                                            "Description": "Grilled Chicken Breast with Mushroom Sauce, Yellow Rice, SautÃ© Carrot and Beans Baton",
                                                            "Destination": "DEL",
                                                            "Id": "6787",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1"
                                                            },
                                                            {
                                                            "Amount": "0",
                                                            "Code": "Kids Meal|CHML",
                                                            "Description": "Kids Meal",
                                                            "Destination": "DEL",
                                                            "Id": "6788",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1"
                                                            }
                                                            ],
                                                            "OtherSSR": [
                                                            {
                                                            "Amount": "59",
                                                            "Code": "Pre-book SpiceAssurance|SASR",
                                                            "Description": "Pre-book SpiceAssurance",
                                                            "Destination": "DEL",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1",
                                                            "category": "ASSURANCE",
                                                            "id": "2142"
                                                            },
                                                            {
                                                            "Amount": "300",
                                                            "Code": "Priority check-in|PRCP",
                                                            "Description": "Priority check-in",
                                                            "Destination": "DEL",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1",
                                                            "category": "PRIORITY_CHECK_IN",
                                                            "id": "2143"
                                                            },
                                                            {
                                                            "Amount": "149",
                                                            "Code": "Priority check-in + Bag out first|PCBF",
                                                            "Description": "Priority check-in + Bag out first",
                                                            "Destination": "DEL",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1",
                                                            "category": "BAGOUT+PRIORITY_CHECK_IN",
                                                            "id": "2144"
                                                            },
                                                            {
                                                            "Amount": "550",
                                                            "Code": "Carry More On board|EXCB",
                                                            "Description": "Carry More On board",
                                                            "Destination": "DEL",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1",
                                                            "category": "BAGGAGE",
                                                            "id": "2145"
                                                            },
                                                            {
                                                            "Amount": "300",
                                                            "Code": "Bag out first  with 3 bags|BOF3",
                                                            "Description": "Bag out first  with 3 bags",
                                                            "Destination": "DEL",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1",
                                                            "category": "BAGOUT",
                                                            "id": "2146"
                                                            },
                                                            {
                                                            "Amount": "200",
                                                            "Code": "Bag out first  with 2 bags|BOF2",
                                                            "Description": "Bag out first  with 2 bags",
                                                            "Destination": "DEL",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1",
                                                            "category": "BAGOUT",
                                                            "id": "2147"
                                                            },
                                                            {
                                                            "Amount": "100",
                                                            "Code": "Bag out first  with 1 bag|BOF1",
                                                            "Description": "Bag out first  with 1 bag",
                                                            "Destination": "DEL",
                                                            "ItinRef": "0",
                                                            "Orgin": "BOM",
                                                            "SegRef": "1",
                                                            "category": "BAGOUT",
                                                            "id": "2148"
                                                            }
                                                            ],
                                                            "Seats": [
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6457",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "1",
                                                            "SeatName": "1A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "5"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6458",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "1",
                                                            "SeatName": "1B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "5"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6459",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "1",
                                                            "SeatName": "1C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "5"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6460",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "1",
                                                            "SeatName": "1D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "5"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6461",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "1",
                                                            "SeatName": "1E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "5"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6462",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "1",
                                                            "SeatName": "1F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "5"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6463",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "2A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "8"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6464",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "2B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "8"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6465",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "2C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "8"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6466",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "2D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "8"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6467",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "2E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "8"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6468",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "2F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "8"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6469",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "3A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "11"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6470",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "3B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "11"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6471",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "3C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "11"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6472",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "3D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "11"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6473",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "3E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "11"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6474",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "3F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "11"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6475",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "4A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "14"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6476",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "4B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "14"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6477",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "4C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "14"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6478",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "4D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "14"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6479",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "4E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "14"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6480",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "4",
                                                            "SeatName": "4F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "14"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6481",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "5D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "16"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6482",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "5E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "16"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6483",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "5F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "16"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6484",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "6A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "18"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6485",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "6B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "18"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6486",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "6C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "18"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6487",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "6D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "18"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6488",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "6E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "18"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6489",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "6F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "18"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6490",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "7A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "20"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6491",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "7B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "20"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6492",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "7C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "20"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6493",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Closed",
                                                            "SeatGroup": "3",
                                                            "SeatName": "7D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "20"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6494",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "7E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "20"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6495",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "7F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "20"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6496",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "8A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "22"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6497",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "8B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "22"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6498",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "8C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "22"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6499",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "8D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "22"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6500",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "8E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "22"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6501",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "8F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "22"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6502",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "9A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "24"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6503",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "9B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "24"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6504",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "9C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "24"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6505",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "9D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "24"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6506",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "9E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "24"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6507",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "9F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "24"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6508",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "10A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "26"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6509",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "10B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "26"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6510",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "10C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "26"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6511",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "10D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "26"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6512",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "10E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "26"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6513",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "10F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "26"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6514",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "11A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "28"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6515",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "11B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "28"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6516",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "11C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "28"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6517",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "11D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "28"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6518",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "11E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "28"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6519",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "11F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "28"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6520",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "12A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "30"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6521",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "12B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "30"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6522",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "12C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "30"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6523",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "12D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "30"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6524",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "12E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "30"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6525",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "12F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "30"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6526",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "13A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "32"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6527",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "13B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "32"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6528",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "13C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "32"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6529",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "13D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "32"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6530",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "6",
                                                            "SeatName": "13E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "32"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6531",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "300",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "3",
                                                            "SeatName": "13F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "32"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6532",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "19",
                                                            "SeatName": "14A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "34"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6533",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "20",
                                                            "SeatName": "14B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "34"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6534",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "19",
                                                            "SeatName": "14C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "34"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6535",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "19",
                                                            "SeatName": "14D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "34"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6536",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "99",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "20",
                                                            "SeatName": "14E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "34"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6537",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "19",
                                                            "SeatName": "14F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "34"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6538",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "5",
                                                            "SeatName": "15A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "37"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6539",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "5",
                                                            "SeatName": "15B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "37"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6540",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "5",
                                                            "SeatName": "15C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "37"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6541",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "5",
                                                            "SeatName": "15D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "37"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6542",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "5",
                                                            "SeatName": "15E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "37"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6543",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "5",
                                                            "SeatName": "15F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "37"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6544",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "9",
                                                            "SeatName": "16A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "40"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6545",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "9",
                                                            "SeatName": "16B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "40"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6546",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "9",
                                                            "SeatName": "16C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "40"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6547",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "9",
                                                            "SeatName": "16D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "40"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6548",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "9",
                                                            "SeatName": "16E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "40"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6549",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "799",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "9",
                                                            "SeatName": "16F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "40"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6550",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "17A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "42"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6551",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "17B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "42"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6552",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "17C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "42"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6553",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "17D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "42"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6554",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "17E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "42"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6555",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "17F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "42"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6556",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "18A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "44"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6557",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "18B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "44"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6558",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "18C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "44"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6559",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "18D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "44"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6560",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "18E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "44"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6561",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "18F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "44"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6562",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "19A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "46"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6563",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "19B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "46"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6564",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "19C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "46"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6565",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "19D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "46"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6566",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "19E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "46"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6567",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "19F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "46"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6568",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "20A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "48"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6569",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "20B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "48"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6570",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "20C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "48"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6571",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "20D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "48"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6572",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "20E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "48"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6573",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "20F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "48"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6574",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "21A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "50"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6575",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "21B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "50"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6576",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "21C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "50"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6577",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "21D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "50"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6578",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "21E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "50"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6579",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "21F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "50"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6580",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "22A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "52"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6581",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "22B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "52"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6582",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "22C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "52"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6583",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "22D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "52"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6584",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "22E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "52"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6585",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "22F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "52"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6586",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "23A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "54"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6587",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "23B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "54"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6588",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "23C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "54"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6589",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "23D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "54"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6590",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "23E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "54"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6591",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "23F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "54"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6592",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "24A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "56"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6593",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "24B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "56"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6594",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "24C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "56"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6595",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "24D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "56"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6596",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "24E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "56"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6597",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "24F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "56"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6598",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "25A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "58"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6599",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "25B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "58"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6600",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "25C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "58"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6601",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "25D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "58"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6602",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "25E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "58"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6603",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "25F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "58"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6604",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "26A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "60"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6605",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "26B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "60"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6606",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "26C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "60"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6607",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "26D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "60"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6608",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "49",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "15",
                                                            "SeatName": "26E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "60"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6609",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "26F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "60"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6610",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "27A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "62"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6611",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "27B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "62"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6612",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "27C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "62"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6613",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "27D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "62"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6614",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "27E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "62"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6615",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "27F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "62"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6616",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "28A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "64"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6617",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "28B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "64"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6618",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "28C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "64"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6619",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "28D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "64"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6620",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "28E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "64"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6621",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "28F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "64"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6622",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "29A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "66"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6623",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "29B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "66"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6624",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "29C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "66"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6625",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "29D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "66"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6626",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "29E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "66"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6627",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "29F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "66"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6628",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "30A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "68"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6629",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "30B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "68"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6630",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "30C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "68"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6631",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "30D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "68"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6632",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "30E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "68"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6633",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "30F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "68"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6634",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "31A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "70"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6635",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "31B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "70"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6636",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "31C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "70"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6637",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "31D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "70"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6638",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "8",
                                                            "SeatName": "31E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "70"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6639",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Open",
                                                            "SeatGroup": "7",
                                                            "SeatName": "31F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "70"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6640",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Closed",
                                                            "SeatGroup": "7",
                                                            "SeatName": "32A",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "1",
                                                            "YAxis": "72"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6641",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Closed",
                                                            "SeatGroup": "8",
                                                            "SeatName": "32B",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "3",
                                                            "YAxis": "72"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6642",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Closed",
                                                            "SeatGroup": "7",
                                                            "SeatName": "32C",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "5",
                                                            "YAxis": "72"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6643",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Closed",
                                                            "SeatGroup": "7",
                                                            "SeatName": "32D",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "9",
                                                            "YAxis": "72"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6644",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "0",
                                                            "SeatAvailability": "Closed",
                                                            "SeatGroup": "8",
                                                            "SeatName": "32E",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "11",
                                                            "YAxis": "72"
                                                            },
                                                            {
                                                            "Destination": "DEL",
                                                            "EXITROW": "",
                                                            "Id": "6645",
                                                            "InfantRow": null,
                                                            "ItinRef": "0",
                                                            "MaxHeight": "16",
                                                            "MaxWidth": "78",
                                                            "Origin": "BOM",
                                                            "SeatAmount": "250",
                                                            "SeatAvailability": "Closed",
                                                            "SeatGroup": "7",
                                                            "SeatName": "32F",
                                                            "SeatStatus": true,
                                                            "SeatType": "NS",
                                                            "SegRef": "1",
                                                            "XAxis": "13",
                                                            "YAxis": "72"
                                                            }
                                                            ]
                                                            },
                                                            "Status": {
                                                            "Error": "",
                                                            "ResultCode": "1",
                                                            "SequenceID": "14361379012320854"
                                                            }
                                                            }
                                                        
15.4 Get Ssr Failure
Copy Code
                                                            {
                                                            "Status": {
                                                            "ResultCode": "0",
                                                            "Error": "Unable to process your SSR request. Kindly reach out to customer support.",
                                                            "SequenceID": "15021663533508147"
                                                            }
                                                            }
                                                        
15.6 Data Format and Details
Field Name	Data Type	Description
AgentInfo.AgentId	String	Your Agent ID
AgentInfo.UserName	String	Your Username
AgentInfo.AppType	String	Default Value: API
AgentInfo.Version	String	API version
Trackid	String	Tracking ID for the request
Airiq PNR	String	Your Airiq PNR
Airline PNR	String	Your Airline PNR
MealsSSR	String	Pass the same value from GetSSR response.
PaxRefNumber	Integer	Unique passenger reference ID starts with 1
BaggageID	String	Pass the same value from GetSSR response.
OtherSSRID	String	Pass the same value from GetSSR response.
SeatID	String	Pass the same value from GetSSR response.
SegmentNo	String	Pass the same value from GetSSR response.
PaymentMode	String	Mode of Payment T- Agent Deposit
Remarks	String	Remarks for the request
15.7 Add Ssr Request
Copy Code
                                                            {
                                                            "AgentInfo": {
                                                            "AgentId": "XXXXXX",
                                                            "UserName": "XXXXXXXXX",
                                                            "AppType": "API",
                                                            "Version": "XXX"
                                                            },
                                                            "Remarks": "Testtt",
                                                            "TracKID": "AQ143613790123208541436182601064CGDVYIH6EK0",
                                                            "AirIqPNR": "AF23HC0015",
                                                            "AirlinePNR": "BEK4PX",
                                                            "MealsSSR": [
                                                            {
                                                            "PaxRefId": "1",
                                                            "SegmentNo": "1",
                                                            "MealId": "6785"
                                                            }
                                                            ],
                                                            "BaggSSR": [
                                                            {
                                                            "PaxRefId": "1",
                                                            "BaggId": "9735"
                                                            }
                                                            ],
                                                            "SeatsSSR": [
                                                            {
                                                            "PaxRefId": "1",
                                                            "SeatId": "6600"
                                                            }
                                                            ],
                                                            "OtherSSR": [
                                                            {
                                                            "OtherSSRId": "2142",
                                                            "PaxRefId": "1"
                                                            }
                                                            ],
                                                            "Payment": [
                                                            {
                                                            "PaymentMode": "T",
                                                            "Amount": "5109"
                                                            }
                                                            ]
                                                            }
                                                        
15.8 Add Ssr Responces
Copy Code
                                                            {
                                                            "Retrieveresponse": {
                                                            "ItinearyDetails": [
                                                            {
                                                            "AdultCount": "1",
                                                            "ChildCount": "0",
                                                            "InfantCount": "0",
                                                            "IssuedDate": "23/08/2025 14:35:53",
                                                            "Item": [
                                                            {
                                                            "TicketStatus": "CONFIRMED",
                                                            "Resultcode": "1",
                                                            "BookingTrackId": "AQAG0D956901185230820251335517786980020899",
                                                            "AirIqPNR": "AF23HC0015",
                                                            "CRSPNR": "N/A",
                                                            "BaseOrigin": "BOM",
                                                            "BaseDestination": "DEL",
                                                            "GST_Number": "",
                                                            "TicketingTimeLimit": "",
                                                            "PromoCode": "",
                                                            "Class": "P1",
                                                            "PrintTicket": "",
                                                            "SegmentType": "D",
                                                            "Special": "N",
                                                            "Stock": "SG",
                                                            "TripType": "O",
                                                            "PaymentDetails": {
                                                            "Item": [
                                                            {
                                                            "Amount": "8439.00",
                                                            "CurrencyCode": "INR"
                                                            }
                                                            ]
                                                            },
                                                            "TourCode": "",
                                                            "TravellerInfo": {
                                                            "Item": [
                                                            {
                                                            "Title": "MR",
                                                            "FirstName": "SARATHY",
                                                            "LastName": "PRIYANN",
                                                            "DateOfBirth": "17/12/1998",
                                                            "PaxType": "Adult",
                                                            "TicketNumber": "AF23HC00151-1",
                                                            "SegmentInformation": {
                                                            "Item": [
                                                            {
                                                            "ArrTerminal": null,
                                                            "DepTerminal": null,
                                                            "FareTypeDescription": null,
                                                            "PlatingCarrier": null,
                                                            "AirlinePNR": "BEK4PX",
                                                            "TicketNo": "AF23HC00151-1",
                                                            "FlightNumber": "252",
                                                            "Origin": "BOM",
                                                            "Destination": "DEL",
                                                            "DepartureDateTime": "23/09/2025 06:25",
                                                            "ArrivalDateTime": "23/09/2025 08:45",
                                                            "AirCraftType": "",
                                                            "CarrierCode": "SG",
                                                            "ClassCode": "P1",
                                                            "FareBasis": "P1SALE",
                                                            "FrequentFlyerNumber": "",
                                                            "SpRequest": "",
                                                            "MealsPreference": "VCC2",
                                                            "MealsAmount": "300.00",
                                                            "BaggagePreference": "15KG10KG ",
                                                            "BaggageAmount": "4500.00",
                                                            "SeatPreference": "25C",
                                                            "SeatAmount": "250.00"
                                                            }
                                                            ],
                                                            "MonetaryDetail": {
                                                            "BasicAmount": "1999.00",
                                                            "BasicCurrencyCode": "INR",
                                                            "CurrencyCode": "INR",
                                                            "GrossAmount": "8439.00",
                                                            "PLBAmount": "0.00",
                                                            "ServiceTax": "ServiceTax",
                                                            "ServiceTaxAmount": "0.00",
                                                            "TaxDetails": {
                                                            "item": [
                                                            {
                                                            "Amount": "76.00",
                                                            "CurrencyCode": "INR",
                                                            "TaxCode": "CGST27"
                                                            },
                                                            {
                                                            "Amount": "76.00",
                                                            "CurrencyCode": "INR",
                                                            "TaxCode": "SGST27"
                                                            },
                                                            {
                                                            "Amount": "66.00",
                                                            "CurrencyCode": "INR",
                                                            "TaxCode": "AAT"
                                                            },
                                                            {
                                                            "Amount": "80.00",
                                                            "CurrencyCode": "INR",
                                                            "TaxCode": "TRF"
                                                            },
                                                            {
                                                            "Amount": "142.00",
                                                            "CurrencyCode": "INR",
                                                            "TaxCode": "DF1"
                                                            },
                                                            {
                                                            "Amount": "900.00",
                                                            "CurrencyCode": "INR",
                                                            "TaxCode": "YQ"
                                                            },
                                                            {
                                                            "Amount": "50.00",
                                                            "CurrencyCode": "INR",
                                                            "TaxCode": "RCS"
                                                            }
                                                            ]
                                                            },
                                                            "TransactionFee": "TransactionFee",
                                                            "TransactionFeeAmount": "0.00"
                                                            }
                                                            }
                                                            }
                                                            ]
                                                            }
                                                            }
                                                            ],
                                                            "OtherCharges": "0.00",
                                                            "SegmentType": "D",
                                                            "TerminalContactDetails": {
                                                            "Address1": "chennai",
                                                            "Address2": "",
                                                            "City": "MAA",
                                                            "Country": "CX",
                                                            "Email": "sakthivelapi@gmail.com",
                                                            "Phone": "8855425745",
                                                            "State": "",
                                                            "TerminalName": "API Agent Testing"
                                                            },
                                                            "TotalAmount": "8439.00",
                                                            "TotalSegments": "1",
                                                            "TripType": "O"
                                                            }
                                                            ]
                                                            },
                                                            "Status": {
                                                            "Error": "",
                                                            "ResultCode": "1",
                                                            "SequenceID": "14371202877260315"
                                                            }
                                                            }
                                                        
15.9 Add Ssr Failure
Copy Code
                                                            {
                                                            "Status": {
                                                            "ResultCode": "0",
                                                            "Error": "Unable to process your SSR request. Kindly reach out to customer support.",
                                                            "SequenceID": "15021663533508147"
                                                            }
                                                            }
                                                               