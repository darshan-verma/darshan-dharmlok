#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TRIPJACK_API_URL:-}" ]]; then
  echo "Missing TRIPJACK_API_URL"
  exit 1
fi

if [[ -z "${TRIPJACK_API_KEY:-}" ]]; then
  echo "Missing TRIPJACK_API_KEY"
  exit 1
fi

BASE_URL="${TRIPJACK_API_URL%/}"
BOOKING_ID="${TRIPJACK_BOOKING_ID:-DUMMY_BOOKING_ID}"
BOOKING_IDS="${TRIPJACK_BOOKING_IDS:-${BOOKING_ID}}"
QUOTE_ID="${TRIPJACK_QUOTE_ID:-DUMMY_QUOTE_ID}"
QUOTE_CHILD_ID="${TRIPJACK_QUOTE_CHILD_ID:-DUMMY_QUOTE_CHILD_ID}"
SOURCE_BOOKING_ID="${TRIPJACK_SOURCE_BOOKING_ID:-DUMMY_SOURCE_BOOKING_ID}"

run_test() {
  local name="$1"
  local method="$2"
  local endpoint="$3"
  local payload="${4:-}"

  local body_file
  body_file="$(mktemp)"

  local status
  if [[ -n "${payload}" ]]; then
    status=$(curl -sS -o "${body_file}" -w "%{http_code}" -X "${method}" "${BASE_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -H "apikey: ${TRIPJACK_API_KEY}" \
      -d "${payload}")
  else
    status=$(curl -sS -o "${body_file}" -w "%{http_code}" -X "${method}" "${BASE_URL}${endpoint}" \
      -H "apikey: ${TRIPJACK_API_KEY}")
  fi

  local snippet
  snippet="$(head -c 120 "${body_file}" | tr '\n' ' ' | tr '\r' ' ')"
  printf "%-24s %-5s %-36s HTTP %s\n" "${name}" "${method}" "${endpoint}" "${status}"
  if [[ -n "${snippet}" ]]; then
    printf "  body: %s\n" "${snippet}"
  fi

  rm -f "${body_file}"
}

quote_payload='{"pickupDate":"2026-04-25 12:30","destination":{"type":"location","displayAddress":"CP, New Delhi, Delhi, India","lat":"28.6304203","long":"77.21772159999999","address":{"city":"New Delhi","country":"India","postalCode":"110001"}},"origin":{"type":"location","displayAddress":"IGI Airport Terminal 3 Metro Station, Delhi","lat":"28.5550838","long":"77.0844015","address":{"city":"Delhi Division","country":"India","postalCode":"110037"}},"journeyType":"airport_transfer","tripType":"oneway","passengers":1,"quoteFilter":{"paxCount":1}}'

booking_payload="{\"journeyInfo\":{\"journeyType\":\"AIRPORT_TRANSFER\",\"tripType\":\"ONEWAY\",\"pickupDateTime\":\"2026-04-25T12:30:00\",\"distance\":\"19 Km\",\"duration\":38},\"routeDetail\":{\"isDomestic\":true,\"origin\":{\"displayAddress\":\"IGI Airport Terminal 3 Metro Station, Delhi\",\"lat\":\"28.5550838\",\"type\":\"location\",\"long\":\"77.0844015\",\"address\":{\"city\":\"Delhi Division\",\"country\":\"India\",\"postalCode\":\"110037\"}},\"destination\":{\"displayAddress\":\"CP, New Delhi, Delhi, India\",\"lat\":\"28.6304203\",\"type\":\"location\",\"long\":\"77.21772159999999\",\"address\":{\"city\":\"New Delhi\",\"country\":\"India\",\"postalCode\":\"110001\"}}},\"addons\":[],\"quotationInfo\":{\"vehicleType\":\"Sedan\",\"vehicleCategory\":\"Standard\",\"quoteId\":\"${QUOTE_ID}\",\"childQuoteId\":\"${QUOTE_CHILD_ID}\",\"paxCount\":3,\"luggageCount\":3,\"vendorId\":1},\"pricingInfo\":{\"netAmount\":\"1463.00\",\"addonsPrice\":\"0.00\",\"agentMarkup\":0,\"agentMarkupSplitup\":{\"onwardJourneyMarkup\":0,\"returnJourneyMarkup\":0},\"grossAmount\":\"1496.00\"},\"passengerDetail\":{\"firstName\":\"Jack\",\"lastName\":\"Jerry\",\"email\":\"jack@example.com\",\"phone\":\"+919999999999\",\"flightDetails\":{\"number\":\"BA142\"}},\"serviceRequest\":\"AC mandatory in car\",\"consent\":\"yes\",\"agentEmail\":\"agent@example.com\",\"agentPhone\":\"+919888888888\",\"agentId\":617306,\"vendorId\":1}"

amendment_payload="{\"bookingId\":\"${BOOKING_ID}\",\"amendmentType\":\"CANCELLATION\"}"
payment_payload="{\"amount\":1496,\"payUserId\":\"617306\",\"paymentMedium\":\"CARD\",\"bookingId\":\"${BOOKING_ID}\",\"opType\":\"PAY\",\"product\":\"CAB\",\"transactionType\":\"ONLINE\"}"
embedded_payload="{\"sourceBookingId\":\"${SOURCE_BOOKING_ID}\",\"productType\":\"CAB\",\"bookingRequestList\":[${booking_payload}]}"

echo "TripJack Provider Matrix"
echo "Base URL: ${BASE_URL}"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

run_test "places" "POST" "/cabs/v1/google-places" '{"input":"igi"}'
run_test "latlong" "POST" "/cabs/v1/get-lat-long" '{"placeId":"ChIJ30iik5kbDTkRZ_0X9stU-Sg"}'
run_test "quotes" "POST" "/cabs/v2/quotes" "${quote_payload}"
run_test "booking" "POST" "/cabs/v2/booking" "${booking_payload}"
run_test "booking-details" "GET" "/cabs/v1/booking/details?bookingIds=${BOOKING_IDS}"
run_test "amendment-charges" "GET" "/cabs/v1/amendment?bookingId=${BOOKING_ID}&type=CANCELLATION"
run_test "amendment" "POST" "/cabs/v1/amendment" "${amendment_payload}"
run_test "payment-create" "POST" "/cabs/v1/payment/create" "${payment_payload}"
run_test "embedded-booking" "POST" "/cabs/v2/embedded/booking" "${embedded_payload}"
