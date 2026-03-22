/**
 * Maps UI calculator choices to `/api/prokerala/numerology/{apiPathSegment}` and field requirements.
 * Must stay aligned with route handlers under `src/app/api/prokerala/numerology/`.
 */

export type NumerologySystem = "pythagorean" | "chaldean";

export type NumerologyCalculatorDef = {
	/** Stable id for form state (unique within system) */
	id: string;
	label: string;
	/** Appended to `/api/prokerala/numerology/` */
	apiPathSegment: string;
	requiresDatetime: boolean;
	requiresNames: boolean;
	requiresReferenceYear: boolean;
	supportsAdditionalVowel: boolean;
};

export const PYTHAGOREAN_CALCULATORS: NumerologyCalculatorDef[] = [
	{
		id: "attainment-number",
		label: "Attainment Number",
		apiPathSegment: "attainment-number",
		requiresDatetime: true,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "balance-number",
		label: "Balance Number",
		apiPathSegment: "balance-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "birth-month-number",
		label: "Birth Month Number",
		apiPathSegment: "birth-month-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "birthday-number",
		label: "Birthday Number",
		apiPathSegment: "birthday-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "bridge-number",
		label: "Bridge Number",
		apiPathSegment: "bridge-number",
		requiresDatetime: true,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "capstone-number",
		label: "Capstone Number",
		apiPathSegment: "capstone-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "challenge-number",
		label: "Challenge Number",
		apiPathSegment: "challenge-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "cornerstone-number",
		label: "Corner Stone Number",
		apiPathSegment: "cornerstone-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "destiny-number",
		label: "Destiny Number",
		apiPathSegment: "destiny-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "expression-number",
		label: "Expression Number",
		apiPathSegment: "expression-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "hidden-passion-number",
		label: "Hidden Passion Number",
		apiPathSegment: "hidden-passion-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "inner-dream-number",
		label: "Inner Dream Number",
		apiPathSegment: "inner-dream-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: true,
	},
	{
		id: "karmic-debt-number",
		label: "Karmic Debt Number",
		apiPathSegment: "karmic-debt-number",
		requiresDatetime: true,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "life-path-number",
		label: "Life Path Number",
		apiPathSegment: "life-path-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "maturity-number",
		label: "Maturity Number",
		apiPathSegment: "maturity-number",
		requiresDatetime: true,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "personal-day-number",
		label: "Personal Day Number",
		apiPathSegment: "personal-day-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: true,
		supportsAdditionalVowel: false,
	},
	{
		id: "personal-month-number",
		label: "Personal Month Number",
		apiPathSegment: "personal-month-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: true,
		supportsAdditionalVowel: false,
	},
	{
		id: "personal-year-number",
		label: "Personal Year Number",
		apiPathSegment: "personal-year-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: true,
		supportsAdditionalVowel: false,
	},
	{
		id: "personality-number",
		label: "Personality Number",
		apiPathSegment: "personality-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: true,
	},
	{
		id: "pinnacle-number",
		label: "Pinnacle Number",
		apiPathSegment: "pinnacle-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "rational-thought-number",
		label: "Rational Thought Number",
		apiPathSegment: "rational-thought-number",
		requiresDatetime: true,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "soul-urge-number",
		label: "Soul Urge Number",
		apiPathSegment: "soul-urge-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: true,
	},
	{
		id: "subconscious-self-number",
		label: "Subconscious Self Number",
		apiPathSegment: "subconscious-self-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "universal-day-number",
		label: "Universal Day Number",
		apiPathSegment: "universal-day-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "universal-month-number",
		label: "Universal Month Number",
		apiPathSegment: "universal-month-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "universal-year-number",
		label: "Universal Year Number",
		apiPathSegment: "universal-year-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
];

/** Order matches Chaldean UI: Birth Number default, then name-based, then life path, then whole name. */
export const CHALDEAN_CALCULATORS: NumerologyCalculatorDef[] = [
	{
		id: "chaldean-birth-number",
		label: "Birth Number",
		apiPathSegment: "chaldean/birth-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "chaldean-daily-name-number",
		label: "Daily Name Number",
		apiPathSegment: "chaldean/daily-name-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "chaldean-identity-initial-code-number",
		label: "Identity Initial Code Number",
		apiPathSegment: "chaldean/identity-inital-code-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "chaldean-life-path-number",
		label: "Life Path Number",
		apiPathSegment: "chaldean/lifepath-number",
		requiresDatetime: true,
		requiresNames: false,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
	{
		id: "chaldean-whole-name-number",
		label: "Whole Name Number",
		apiPathSegment: "chaldean/whole-name-number",
		requiresDatetime: false,
		requiresNames: true,
		requiresReferenceYear: false,
		supportsAdditionalVowel: false,
	},
];

export function getCalculatorsForSystem(system: NumerologySystem): NumerologyCalculatorDef[] {
	return system === "chaldean" ? CHALDEAN_CALCULATORS : PYTHAGOREAN_CALCULATORS;
}

export function findCalculator(
	system: NumerologySystem,
	id: string
): NumerologyCalculatorDef | undefined {
	return getCalculatorsForSystem(system).find((c) => c.id === id);
}
