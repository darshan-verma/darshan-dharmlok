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
ACTION="${1:-places}"

request() {
  local method="$1"
  local endpoint="$2"
  local payload="${3:-}"

  echo ""
  echo "==> ${method} ${BASE_URL}${endpoint}"

  if [[ -n "${payload}" ]]; then
    curl -sS -i -X "${method}" "${BASE_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -H "apikey: ${TRIPJACK_API_KEY}" \
      -d "${payload}"
  else
    curl -sS -i -X "${method}" "${BASE_URL}${endpoint}" \
      -H "apikey: ${TRIPJACK_API_KEY}"
  fi
}

case "${ACTION}" in
  places)
    request "POST" "/cabs/v1/google-places" '{"input":"igi"}'
    ;;
  latlong)
    request "POST" "/cabs/v1/get-lat-long" '{"placeId":"ChIJ30iik5kbDTkRZ_0X9stU-Sg"}'
    ;;
  quotes)
    request "POST" "/cabs/v2/quotes" '{"pickupDate":"2026-04-25 12:30","destination":{"type":"location","displayAddress":"CP, New Delhi, Delhi, India","lat":"28.6304203","long":"77.21772159999999","address":{"city":"New Delhi","country":"India","postalCode":"110001"}},"origin":{"type":"location","displayAddress":"IGI Airport Terminal 3 Metro Station, Delhi","lat":"28.5550838","long":"77.0844015","address":{"city":"Delhi Division","country":"India","postalCode":"110037"}},"journeyType":"airport_transfer","tripType":"oneway","passengers":1,"quoteFilter":{"paxCount":1}}'
    ;;
  booking-details)
    if [[ -z "${2:-}" ]]; then
      echo "Usage: $0 booking-details <bookingIds>"
      exit 1
    fi
    request "GET" "/cabs/v1/booking/details?bookingIds=${2}"
    ;;
  amendment-charges)
    if [[ -z "${2:-}" ]]; then
      echo "Usage: $0 amendment-charges <bookingId>"
      exit 1
    fi
    request "GET" "/cabs/v1/amendment?bookingId=${2}&type=CANCELLATION"
    ;;
  *)
    echo "Usage: $0 {places|latlong|quotes|booking-details <bookingIds>|amendment-charges <bookingId>}"
    exit 1
    ;;
esac

echo ""
