#!/usr/bin/env bash

set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_BASE="${BASE_URL%/}/api/prokerala/western-astrology"

# You can override these via env vars while running the script.
PROFILE="${PROFILE:-{\"datetime\":\"1990-01-01T10:30:00+05:30\",\"coordinates\":\"12.9716,77.5946\"}}"
PRIMARY_PROFILE="${PRIMARY_PROFILE:-{\"datetime\":\"1990-01-01T10:30:00+05:30\",\"coordinates\":\"12.9716,77.5946\"}}"
SECONDARY_PROFILE="${SECONDARY_PROFILE:-{\"datetime\":\"1992-01-01T08:45:00+05:30\",\"coordinates\":\"28.6139,77.2090\"}}"

HOUSE_SYSTEM="${HOUSE_SYSTEM:-placidus}"
ORB="${ORB:-default}"
CHART_TYPE="${CHART_TYPE:-zodiac-contact-chart}"
TRANSIT_DATETIME="${TRANSIT_DATETIME:-2026-03-19T12:00:00+05:30}"
CURRENT_COORDINATES="${CURRENT_COORDINATES:-19.0760,72.8777}"
PROGRESSION_YEAR="${PROGRESSION_YEAR:-2026}"
SOLAR_RETURN_YEAR="${SOLAR_RETURN_YEAR:-2026}"

PASS_COUNT=0
FAIL_COUNT=0

print_header() {
  echo
  echo "== $1 =="
}

run_expect_2xx() {
  local name="$1"
  shift
  local url="$1"
  shift

  local body_file
  body_file="$(mktemp)"
  local status
  status="$(curl -sS -o "$body_file" -w "%{http_code}" --get "$url" "$@")"

  if [[ "$status" =~ ^2 ]]; then
    echo "[PASS] $name -> HTTP $status"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "[FAIL] $name -> HTTP $status"
    echo "Response:"
    sed -n '1,25p' "$body_file"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  rm -f "$body_file"
}

run_expect_400() {
  local name="$1"
  shift
  local url="$1"
  shift

  local body_file
  body_file="$(mktemp)"
  local status
  status="$(curl -sS -o "$body_file" -w "%{http_code}" --get "$url" "$@")"

  if [[ "$status" == "400" ]]; then
    echo "[PASS] $name -> expected HTTP 400"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "[FAIL] $name -> expected HTTP 400, got HTTP $status"
    echo "Response:"
    sed -n '1,25p' "$body_file"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  rm -f "$body_file"
}

print_header "Western Astrology Success Cases"

# Natal
run_expect_2xx "natal-chart" "${API_BASE}/natal-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "natal-aspect-chart" "${API_BASE}/natal-aspect-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "natal-planet-position" "${API_BASE}/natal-planet-position" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

# Transit
run_expect_2xx "transit-chart" "${API_BASE}/transit-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "transit_datetime=${TRANSIT_DATETIME}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "transit-aspect-chart" "${API_BASE}/transit-aspect-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "transit_datetime=${TRANSIT_DATETIME}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "transit-planet-position" "${API_BASE}/transit-planet-position" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "transit_datetime=${TRANSIT_DATETIME}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

# Progression
run_expect_2xx "progression-chart" "${API_BASE}/progression-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "progression_year=${PROGRESSION_YEAR}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "progression-aspect-chart" "${API_BASE}/progression-aspect-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "progression_year=${PROGRESSION_YEAR}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "progression-planet-position" "${API_BASE}/progression-planet-position" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "progression_year=${PROGRESSION_YEAR}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

# Solar Return
run_expect_2xx "solar-return-chart" "${API_BASE}/solar-return-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "solar_return_year=${SOLAR_RETURN_YEAR}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "solar-return-aspect-chart" "${API_BASE}/solar-return-aspect-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "solar_return_year=${SOLAR_RETURN_YEAR}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "solar-return-planet-position" "${API_BASE}/solar-return-planet-position" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "solar_return_year=${SOLAR_RETURN_YEAR}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "orb=${ORB}"

# Synastry
run_expect_2xx "synastry-chart" "${API_BASE}/synastry-chart" \
  --data-urlencode "primary_profile=${PRIMARY_PROFILE}" \
  --data-urlencode "secondary_profile=${SECONDARY_PROFILE}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "chart_type=${CHART_TYPE}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "synastry-planet-aspect" "${API_BASE}/synastry-planet-aspect" \
  --data-urlencode "primary_profile=${PRIMARY_PROFILE}" \
  --data-urlencode "secondary_profile=${SECONDARY_PROFILE}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "chart_type=${CHART_TYPE}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "synastry-aspect-chart" "${API_BASE}/synastry-aspect-chart" \
  --data-urlencode "primary_profile=${PRIMARY_PROFILE}" \
  --data-urlencode "secondary_profile=${SECONDARY_PROFILE}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "chart_type=${CHART_TYPE}" \
  --data-urlencode "orb=${ORB}"

# Composite
run_expect_2xx "composite-chart" "${API_BASE}/composite-chart" \
  --data-urlencode "primary_profile=${PRIMARY_PROFILE}" \
  --data-urlencode "secondary_profile=${SECONDARY_PROFILE}" \
  --data-urlencode "transit_datetime=${TRANSIT_DATETIME}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "chart_type=${CHART_TYPE}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "composite-aspect-chart" "${API_BASE}/composite-aspect-chart" \
  --data-urlencode "primary_profile=${PRIMARY_PROFILE}" \
  --data-urlencode "secondary_profile=${SECONDARY_PROFILE}" \
  --data-urlencode "transit_datetime=${TRANSIT_DATETIME}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "chart_type=${CHART_TYPE}" \
  --data-urlencode "orb=${ORB}"

run_expect_2xx "composite-planet-aspect" "${API_BASE}/composite-planet-aspect" \
  --data-urlencode "primary_profile=${PRIMARY_PROFILE}" \
  --data-urlencode "secondary_profile=${SECONDARY_PROFILE}" \
  --data-urlencode "transit_datetime=${TRANSIT_DATETIME}" \
  --data-urlencode "current_coordinates=${CURRENT_COORDINATES}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "chart_type=${CHART_TYPE}" \
  --data-urlencode "orb=${ORB}"

print_header "Validation Failure Cases (Expected 400)"

run_expect_400 "missing orb (natal-chart)" "${API_BASE}/natal-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}"

run_expect_400 "invalid house_system (natal-chart)" "${API_BASE}/natal-chart" \
  --data-urlencode "profile=${PROFILE}" \
  --data-urlencode "house_system=invalid_house" \
  --data-urlencode "orb=${ORB}"

run_expect_400 "missing secondary_profile (synastry-chart)" "${API_BASE}/synastry-chart" \
  --data-urlencode "primary_profile=${PRIMARY_PROFILE}" \
  --data-urlencode "house_system=${HOUSE_SYSTEM}" \
  --data-urlencode "chart_type=${CHART_TYPE}" \
  --data-urlencode "orb=${ORB}"

echo
echo "Smoke test summary: PASS=${PASS_COUNT}, FAIL=${FAIL_COUNT}"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi

