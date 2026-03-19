#!/usr/bin/env bash

set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_BASE="${BASE_URL%/}/api/prokerala/report"

PERSONAL_ENDPOINT="${API_BASE}/personal-reading/instant"
COMPAT_ENDPOINT="${API_BASE}/compatibility-reading/instant"

PASS_COUNT=0
FAIL_COUNT=0

print_header() {
  echo
  echo "== $1 =="
}

run_post_expect_status() {
  local name="$1"
  local url="$2"
  local expected="$3"
  local payload="$4"

  local body_file
  body_file="$(mktemp)"
  local status
  status="$(curl -sS -o "$body_file" -w "%{http_code}" \
    -X POST "$url" \
    -H "Content-Type: application/json" \
    --data "$payload")"

  if [[ "$status" == "$expected" ]]; then
    echo "[PASS] $name -> expected HTTP $expected"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "[FAIL] $name -> expected HTTP $expected, got HTTP $status"
    echo "Response:"
    sed -n '1,40p' "$body_file"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  rm -f "$body_file"
}

PERSONAL_PAYLOAD='{
  "input": {
    "datetime": "1990-01-01T10:30:00+05:30",
    "coordinates": "12.9716,77.5946",
    "ayanamsa": 1
  },
  "options": {
    "report": {
      "la": "en",
      "modules": [
        {"code": "birth-details"},
        {"code": "chart", "options": {"chart_style": "north-indian"}},
        {"code": "dasa-periods", "options": {"antardasha": "all", "pratyantardasha": "none", "year_length": 1}},
        {"code": "basic-natal-report", "options": {"house_system": 0}}
      ]
    },
    "template": {
      "style": "basic",
      "footer": "prokerala.com | support@example.com"
    }
  }
}'

COMPAT_PAYLOAD='{
  "input": {
    "primary_profile": {
      "datetime": "1990-01-01T10:30:00+05:30",
      "coordinates": "12.9716,77.5946"
    },
    "secondary_profile": {
      "datetime": "1992-01-01T08:45:00+05:30",
      "coordinates": "28.6139,77.2090"
    },
    "ayanamsa": 1
  },
  "options": {
    "report": {
      "la": "en",
      "modules": [
        {"code": "kundli-matching"},
        {"code": "synastry-report", "options": {"house_system": 0, "chart_type": "zodiac"}},
        {"code": "porutham-report", "options": {"compatibility_system": "kerala", "chart_style": "south-indian"}}
      ]
    },
    "template": {
      "style": "basic"
    }
  }
}'

INVALID_PERSONAL_MODULE_PAYLOAD='{
  "input": {"datetime": "1990-01-01T10:30:00+05:30", "coordinates": "12.9716,77.5946"},
  "options": {"report": {"modules": [{"code": "synastry-report"}]}}
}'

INVALID_OPTION_PAYLOAD='{
  "input": {"datetime": "1990-01-01T10:30:00+05:30", "coordinates": "12.9716,77.5946"},
  "options": {"report": {"modules": [{"code": "chart", "options": {"chart_style": "invalid-style"}}]}}
}'

INVALID_BODY_PAYLOAD='{"input": {"datetime": "1990-01-01T10:30:00+05:30"}}'

print_header "PDF Report Success Cases"
run_post_expect_status "personal-reading/instant valid payload" "$PERSONAL_ENDPOINT" "200" "$PERSONAL_PAYLOAD"
run_post_expect_status "compatibility-reading/instant valid payload" "$COMPAT_ENDPOINT" "200" "$COMPAT_PAYLOAD"

print_header "PDF Report Validation Cases (Expected 400)"
run_post_expect_status "personal endpoint rejects compatibility-only module" "$PERSONAL_ENDPOINT" "400" "$INVALID_PERSONAL_MODULE_PAYLOAD"
run_post_expect_status "invalid chart_style in module options" "$PERSONAL_ENDPOINT" "400" "$INVALID_OPTION_PAYLOAD"
run_post_expect_status "missing options object" "$PERSONAL_ENDPOINT" "400" "$INVALID_BODY_PAYLOAD"

echo
echo "Smoke test summary: PASS=${PASS_COUNT}, FAIL=${FAIL_COUNT}"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi

