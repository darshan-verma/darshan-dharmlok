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
                                                    