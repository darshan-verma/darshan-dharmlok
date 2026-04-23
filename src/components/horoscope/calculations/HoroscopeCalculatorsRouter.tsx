"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AYANAMSA_OPTIONS, DAILY_PANCHANG_LANGUAGE_OPTIONS } from "@/data/daily-panchang";
import {
	ASHTAKAVARGA_LAYOUT_OPTIONS,
	BIRTH_CHART_TYPE_OPTIONS,
	CHART_STYLE_OPTIONS,
	isHoroscopeCalculatorSlug,
	PLANET_POSITION_LANG_OPTIONS,
	STANDARD_LANG_4,
	SUDHARSHANA_LANG_OPTIONS,
	WESTERN_HOUSE_SYSTEM_OPTIONS,
	WESTERN_ASPECT_FILTER_OPTIONS,
	WESTERN_LANGUAGE_OPTIONS,
	WESTERN_SYNASTRY_CHART_TYPE_OPTIONS,
	type HoroscopeCalculatorSlug,
} from "@/data/horoscope-calculations";
import { dateInputToIsoDatetime, datetimeLocalToIsoWithOffset } from "@/lib/datetime-local";
import type { ProkeralaAyanamsa } from "@/types/prokerala";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

import {
	CalculationShell,
	fetchProkeralaJson,
	fetchProkeralaSvg,
	geocodePlace,
	useHoroscopeCachedValue,
	HoroscopeJsonResult,
	HoroscopeSubmitButton,
	HoroscopeSvgResult,
} from "./shared-ui";
import {
	WesternAstrologyResultDisplay,
	type WesternResultData,
} from "./WesternAstrologyResultDisplay";

const rowClass =
	"grid gap-2 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center sm:gap-4";

const labelClass = "text-muted-foreground sm:text-right sm:pr-2";
const fieldInputClass =
	"max-w-md border-orange-200 bg-background dark:border-orange-800 focus-visible:ring-orange-500/40";
const fieldSelectTriggerClass =
	"w-full max-w-md border-orange-200 bg-background dark:border-orange-800 focus-visible:ring-orange-500/40";

const formClassName = "space-y-5 px-6 pb-6 pt-2 md:px-8 md:pb-8";
const pairGridClass = "grid gap-6 lg:grid-cols-2";
const partnerSectionClass = "space-y-4 rounded-lg border border-border/70 p-4 md:p-5";

const NAKSHATRA_OPTIONS = [
	"Ashwini",
	"Bharani",
	"Krittika",
	"Rohini",
	"Mrigashira",
	"Ardra",
	"Punarvasu",
	"Pushya",
	"Ashlesha",
	"Magha",
	"Purva Phalguni",
	"Uttara Phalguni",
	"Hasta",
	"Chitra",
	"Swati",
	"Vishakha",
	"Anuradha",
	"Jyeshtha",
	"Moola",
	"Purva Ashadha",
	"Uttara Ashadha",
	"Shravana",
	"Dhanishta",
	"Shatabhisha",
	"Purva Bhadrapada",
	"Uttara Bhadrapada",
	"Revati",
] as const;

const NAKSHATRA_PADA_OPTIONS = [
	{ value: "1", label: "1" },
	{ value: "2", label: "2" },
	{ value: "3", label: "3" },
	{ value: "4", label: "4" },
] as const;

type LangOption = { value: string; label: string };

function BirthFields({
	ayanamsa,
	setAyanamsa,
	birthDatetimeLocal,
	setBirthDatetimeLocal,
	birthPlace,
	setBirthPlace,
}: {
	ayanamsa: ProkeralaAyanamsa;
	setAyanamsa: (v: ProkeralaAyanamsa) => void;
	birthDatetimeLocal: string;
	setBirthDatetimeLocal: (v: string) => void;
	birthPlace: string;
	setBirthPlace: (v: string) => void;
}) {
	return (
		<>
			<div className={rowClass}>
				<Label className={labelClass}>Ayanamsa</Label>
				<Select
					value={String(ayanamsa)}
					onValueChange={(v) => setAyanamsa(Number(v) as ProkeralaAyanamsa)}
				>
					<SelectTrigger className={fieldSelectTriggerClass}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{AYANAMSA_OPTIONS.map((o) => (
							<SelectItem key={o.value} value={String(o.value)}>
								{o.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className={rowClass}>
				<Label htmlFor="birth-dt" className={labelClass}>
					Date &amp; time of birth
				</Label>
				<Input
					id="birth-dt"
					type="datetime-local"
					className={fieldInputClass}
					value={birthDatetimeLocal}
					onChange={(e) => setBirthDatetimeLocal(e.target.value)}
					required
				/>
			</div>
			<div className={rowClass}>
				<Label htmlFor="birth-place" className={labelClass}>
					Place of birth
				</Label>
				<Input
					id="birth-place"
					placeholder="City, region"
					className={fieldInputClass}
					value={birthPlace}
					onChange={(e) => setBirthPlace(e.target.value)}
					required
				/>
			</div>
		</>
	);
}

function LanguageField({
	label,
	value,
	onChange,
	options,
}: {
	label?: string;
	value: string;
	onChange: (v: string) => void;
	options: LangOption[];
}) {
	return (
		<div className={rowClass}>
			<Label className={labelClass}>{label ?? "Language"}</Label>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className={fieldSelectTriggerClass}>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{options.map((o) => (
						<SelectItem key={o.value} value={o.value}>
							{o.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

async function resolveBirthQuery(
	birthPlace: string,
	birthDatetimeLocal: string,
	ayanamsa: ProkeralaAyanamsa
): Promise<
	| { ok: true; coordinates: string; datetime: string; ayanamsa: string }
	| { ok: false; message: string }
> {
	const geo = await geocodePlace(birthPlace);
	if (!geo.ok) return geo;
	if (!birthDatetimeLocal) {
		return { ok: false, message: "Birth date and time is required." };
	}
	const datetime = birthDatetimeLocal.includes("T")
		? datetimeLocalToIsoWithOffset(birthDatetimeLocal)
		: dateInputToIsoDatetime(birthDatetimeLocal);
	return {
		ok: true,
		coordinates: `${geo.lat},${geo.lng}`,
		datetime,
		ayanamsa: String(ayanamsa),
	};
}

function birthParams(
	q: { coordinates: string; datetime: string; ayanamsa: string }
): Record<string, string> {
	return {
		ayanamsa: q.ayanamsa,
		coordinates: q.coordinates,
		datetime: q.datetime,
	};
}

async function resolvePartnerBirthQuery({
	girlBirthPlace,
	girlBirthDatetimeLocal,
	boyBirthPlace,
	boyBirthDatetimeLocal,
	ayanamsa,
}: {
	girlBirthPlace: string;
	girlBirthDatetimeLocal: string;
	boyBirthPlace: string;
	boyBirthDatetimeLocal: string;
	ayanamsa: ProkeralaAyanamsa;
}): Promise<
	| {
			ok: true;
			params: Record<string, string>;
	  }
	| { ok: false; message: string }
> {
	const girl = await resolveBirthQuery(girlBirthPlace, girlBirthDatetimeLocal, ayanamsa);
	if (!girl.ok) {
		return { ok: false, message: `Girl details: ${girl.message}` };
	}
	const boy = await resolveBirthQuery(boyBirthPlace, boyBirthDatetimeLocal, ayanamsa);
	if (!boy.ok) {
		return { ok: false, message: `Boy details: ${boy.message}` };
	}
	return {
		ok: true,
		params: {
			ayanamsa: girl.ayanamsa,
			girl_coordinates: girl.coordinates,
			girl_dob: girl.datetime,
			boy_coordinates: boy.coordinates,
			boy_dob: boy.datetime,
		},
	};
}

/** Template A: JSON APIs with standard 4 languages */
function FormBirthLangJson({
	title,
	apiPath,
	languageOptions = STANDARD_LANG_4,
}: {
	title: string;
	apiPath: string;
	languageOptions?: LangOption[];
}) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [language, setLanguage] = useState(languageOptions[0]?.value ?? "en");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>(`calc-json:${apiPath}`);

	const langs = useMemo(() => languageOptions, [languageOptions]);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setData(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		const params = new URLSearchParams({ ...birthParams(q), la: language });
		setLoading(true);
		try {
			const url = `/api/prokerala/${apiPath}?${params.toString()}`;
			const res = await fetchProkeralaJson(url);
			if (!res.ok) setError(res.error);
			else setData(res.data);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<LanguageField value={language} onChange={setLanguage} options={langs} />
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearData}
					refreshDisabled={data == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
		</CalculationShell>
	);
}

/** Planet position: optional wider languages */
function FormPlanetPosition({ title }: { title: string }) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [language, setLanguage] = useState("en");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>("calc-json:planet-position");

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setData(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		const params = new URLSearchParams({ ...birthParams(q), la: language });
		setLoading(true);
		try {
			const res = await fetchProkeralaJson(`/api/prokerala/planet-position?${params}`);
			if (!res.ok) setError(res.error);
			else setData(res.data);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<LanguageField
					value={language}
					onChange={setLanguage}
					options={PLANET_POSITION_LANG_OPTIONS}
				/>
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearData}
					refreshDisabled={data == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
		</CalculationShell>
	);
}

/** Basic / advanced JSON */
function FormBasicAdvanced({
	title,
	basePath,
	advancedPath,
}: {
	title: string;
	basePath: string;
	advancedPath: string;
}) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [language, setLanguage] = useState("en");
	const [resultType, setResultType] = useState<"basic" | "advanced">("basic");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>(`calc-json:${basePath}:${advancedPath}`);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setData(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		const path = resultType === "advanced" ? advancedPath : basePath;
		const params = new URLSearchParams({ ...birthParams(q), la: language });
		setLoading(true);
		try {
			const res = await fetchProkeralaJson(`/api/prokerala/${path}?${params}`);
			if (!res.ok) setError(res.error);
			else setData(res.data);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<LanguageField value={language} onChange={setLanguage} options={STANDARD_LANG_4} />
				<div className={rowClass}>
					<Label className={labelClass}>Result type</Label>
					<RadioGroup
						value={resultType}
						onValueChange={(v) => setResultType(v as "basic" | "advanced")}
						className="flex flex-wrap gap-6"
					>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="basic" id="rt-basic" />
							<Label htmlFor="rt-basic" className="font-normal">
								Basic
							</Label>
						</div>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="advanced" id="rt-adv" />
							<Label htmlFor="rt-adv" className="font-normal">
								Advanced
							</Label>
						</div>
					</RadioGroup>
				</div>
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearData}
					refreshDisabled={data == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
		</CalculationShell>
	);
}

/** Sade sati: basic/advanced without language on advanced route (API has no la on advanced) */
function FormSadeSati({ title }: { title: string }) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [resultType, setResultType] = useState<"basic" | "advanced">("basic");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>("calc-json:sade-sati");

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setData(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		const path = resultType === "advanced" ? "sade-sati/advanced" : "sade-sati";
		const params = new URLSearchParams(birthParams(q));
		setLoading(true);
		try {
			const res = await fetchProkeralaJson(`/api/prokerala/${path}?${params}`);
			if (!res.ok) setError(res.error);
			else setData(res.data);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<div className={rowClass}>
					<Label className={labelClass}>Result type</Label>
					<RadioGroup
						value={resultType}
						onValueChange={(v) => setResultType(v as "basic" | "advanced")}
						className="flex flex-wrap gap-6"
					>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="basic" id="ss-basic" />
							<Label htmlFor="ss-basic" className="font-normal">
								Basic
							</Label>
						</div>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="advanced" id="ss-adv" />
							<Label htmlFor="ss-adv" className="font-normal">
								Advanced
							</Label>
						</div>
					</RadioGroup>
				</div>
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearData}
					refreshDisabled={data == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
		</CalculationShell>
	);
}

/** Kaal sarp: no language in UI; API defaults la to en */
function FormKaalSarp({ title }: { title: string }) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>("calc-json:kaal-sarp-dosha");

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setData(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		const params = new URLSearchParams(birthParams(q));
		setLoading(true);
		try {
			const res = await fetchProkeralaJson(`/api/prokerala/kaal-sarp-dosha?${params}`);
			if (!res.ok) setError(res.error);
			else setData(res.data);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearData}
					refreshDisabled={data == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
		</CalculationShell>
	);
}

/** Birth chart SVG */
function FormBirthChart({ title }: { title: string }) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [language, setLanguage] = useState("en");
	const [chartType, setChartType] = useState<string>(BIRTH_CHART_TYPE_OPTIONS[0] ?? "rasi");
	const [chartStyle, setChartStyle] = useState("south-indian");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: svg, setValue: setSvg, clearValue: clearSvg } =
		useHoroscopeCachedValue<string>("calc-svg:birth-chart");

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSvg(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		const params = new URLSearchParams({
			...birthParams(q),
			chart_type: chartType,
			chart_style: chartStyle,
			format: "svg",
			la: language,
		});
		setLoading(true);
		try {
			const res = await fetchProkeralaSvg(`/api/prokerala/chart?${params}`);
			if (!res.ok) setError(res.error);
			else setSvg(res.svg);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<LanguageField value={language} onChange={setLanguage} options={STANDARD_LANG_4} />
				<div className={rowClass}>
					<Label className={labelClass}>Chart type</Label>
					<Select value={chartType} onValueChange={setChartType}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="max-h-72">
							{BIRTH_CHART_TYPE_OPTIONS.map((t) => (
								<SelectItem key={t} value={t}>
									{t.replace(/-/g, " ")}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className={rowClass}>
					<Label className={labelClass}>Chart style</Label>
					<Select value={chartStyle} onValueChange={setChartStyle}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CHART_STYLE_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearSvg}
					refreshDisabled={svg == null}
				/>
			</form>
			<HoroscopeSvgResult svg={svg} error={error} loading={loading} title="Result" />
		</CalculationShell>
	);
}

/** Sudarshana chakra — SVG */
function FormSudarshana({ title }: { title: string }) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [language, setLanguage] = useState("en");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: svg, setValue: setSvg, clearValue: clearSvg } =
		useHoroscopeCachedValue<string>("calc-svg:sudarshana");

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSvg(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		const params = new URLSearchParams(birthParams(q));
		if (language) params.set("la", language);
		setLoading(true);
		try {
			const res = await fetchProkeralaSvg(`/api/prokerala/sudharshanachakra-chart?${params}`);
			if (!res.ok) setError(res.error);
			else setSvg(res.svg);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<LanguageField
					value={language}
					onChange={setLanguage}
					options={SUDHARSHANA_LANG_OPTIONS}
				/>
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearSvg}
					refreshDisabled={svg == null}
				/>
			</form>
			<HoroscopeSvgResult svg={svg} error={error} loading={loading} title="Result" />
		</CalculationShell>
	);
}

/** Ashtakavarga + Sarvashtakavarga: table + chart */
function FormAshtakavarga({ title }: { title: string }) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [language, setLanguage] = useState("en");
	const [mode, setMode] = useState<"planet" | "sarva">("planet");
	const [planet, setPlanet] = useState("sun");
	const [chartStyle, setChartStyle] = useState("south-indian");
	const [layoutType, setLayoutType] = useState("prastara");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>("calc-json:ashtakavarga");
	const { value: svg, setValue: setSvg, clearValue: clearSvg } =
		useHoroscopeCachedValue<string>("calc-svg:ashtakavarga");
	const [chartError, setChartError] = useState<string | null>(null);

	const planetParam = useMemo(() => {
		const map: Record<string, string> = {
			sun: "0",
			moon: "1",
			mercury: "2",
			venus: "3",
			mars: "4",
			jupiter: "5",
			saturn: "6",
		};
		return map[planet] ?? "0";
	}, [planet]);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setChartError(null);
		setData(null);
		setSvg(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		setLoading(true);
		try {
			if (mode === "sarva") {
				const paramsJson = new URLSearchParams({ ...birthParams(q), la: language });
				const j = await fetchProkeralaJson(`/api/prokerala/sarvashtakavarga?${paramsJson}`);
				if (!j.ok) {
					setError(j.error);
					return;
				}
				setData(j.data);
				const paramsChart = new URLSearchParams({
					...birthParams(q),
					chart_style: chartStyle,
					type: layoutType,
				});
				const c = await fetchProkeralaSvg(`/api/prokerala/sarvashtakavarga-chart?${paramsChart}`);
				if (!c.ok) setChartError(c.error);
				else setSvg(c.svg);
			} else {
				const paramsJson = new URLSearchParams({
					...birthParams(q),
					la: language,
					planet: planetParam,
				});
				const j = await fetchProkeralaJson(`/api/prokerala/ashtakavarga?${paramsJson}`);
				if (!j.ok) {
					setError(j.error);
					return;
				}
				setData(j.data);
				const paramsChart = new URLSearchParams({
					...birthParams(q),
					planet: planetParam,
					chart_style: chartStyle,
					type: layoutType,
				});
				const c = await fetchProkeralaSvg(`/api/prokerala/ashtakavarga-chart?${paramsChart}`);
				if (!c.ok) setChartError(c.error);
				else setSvg(c.svg);
			}
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<LanguageField value={language} onChange={setLanguage} options={STANDARD_LANG_4} />
				<div className={rowClass}>
					<Label className={labelClass}>Mode</Label>
					<RadioGroup
						value={mode}
						onValueChange={(v) => setMode(v as "planet" | "sarva")}
						className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4"
					>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="planet" id="mode-pl" />
							<Label htmlFor="mode-pl" className="font-normal">
								Planet Ashtakavarga
							</Label>
						</div>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="sarva" id="mode-sarva" />
							<Label htmlFor="mode-sarva" className="font-normal">
								Sarvashtakavarga
							</Label>
						</div>
					</RadioGroup>
				</div>
				{mode === "planet" && (
					<div className={rowClass}>
						<Label className={labelClass}>Planet</Label>
						<Select value={planet} onValueChange={setPlanet}>
							<SelectTrigger className={fieldSelectTriggerClass}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="sun">Sun</SelectItem>
								<SelectItem value="moon">Moon</SelectItem>
								<SelectItem value="mercury">Mercury</SelectItem>
								<SelectItem value="venus">Venus</SelectItem>
								<SelectItem value="mars">Mars</SelectItem>
								<SelectItem value="jupiter">Jupiter</SelectItem>
								<SelectItem value="saturn">Saturn</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
				<div className={rowClass}>
					<Label className={labelClass}>Chart layout</Label>
					<Select value={layoutType} onValueChange={setLayoutType}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ASHTAKAVARGA_LAYOUT_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className={rowClass}>
					<Label className={labelClass}>Chart style</Label>
					<Select value={chartStyle} onValueChange={setChartStyle}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{CHART_STYLE_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={() => {
						clearData();
						clearSvg();
						setChartError(null);
					}}
					refreshDisabled={data == null && svg == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
			{!loading && data != null && (
				<HoroscopeSvgResult
					svg={svg}
					error={chartError}
					loading={false}
					title="Chart"
				/>
			)}
		</CalculationShell>
	);
}

/** Chandrashtama */
function FormChandrashtama({ title }: { title: string }) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [year, setYear] = useState(String(new Date().getFullYear()));
	const [language, setLanguage] = useState("en");
	const [outputTimezone, setOutputTimezone] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>("calc-json:chandrashtama");

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setData(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		if (!/^\d{4}$/.test(year.trim())) {
			setError("Enter a valid 4-digit year.");
			return;
		}
		const params = new URLSearchParams({
			...birthParams(q),
			year: year.trim(),
			la: language,
		});
		if (outputTimezone.trim()) {
			params.set("output_timezone", outputTimezone.trim());
		}
		setLoading(true);
		try {
			const res = await fetchProkeralaJson(`/api/prokerala/chandrashtama-periods?${params}`);
			if (!res.ok) setError(res.error);
			else setData(res.data);
		} finally {
			setLoading(false);
		}
	}

	const langOpts = DAILY_PANCHANG_LANGUAGE_OPTIONS.map((o) => ({
		value: o.value,
		label: o.label,
	}));

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<div className={rowClass}>
					<Label htmlFor="ch-year" className={labelClass}>
						Year
					</Label>
					<Input
						id="ch-year"
						inputMode="numeric"
						pattern="\d{4}"
						maxLength={4}
						className={fieldInputClass}
						value={year}
						onChange={(e) => setYear(e.target.value)}
						required
					/>
				</div>
				<LanguageField value={language} onChange={setLanguage} options={langOpts} />
				<div className={rowClass}>
					<Label htmlFor="ch-tz" className={labelClass}>
						Output timezone (optional)
					</Label>
					<Input
						id="ch-tz"
						placeholder="e.g. Asia/Kolkata"
						className={fieldInputClass}
						value={outputTimezone}
						onChange={(e) => setOutputTimezone(e.target.value)}
					/>
				</div>
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearData}
					refreshDisabled={data == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
		</CalculationShell>
	);
}

/** Gowri Nalla Neram — panchang language set */
function FormGowri({ title }: { title: string }) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [birthPlace, setBirthPlace] = useState("");
	const [language, setLanguage] = useState("en");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>("calc-json:gowri");

	const langOpts = DAILY_PANCHANG_LANGUAGE_OPTIONS.map((o) => ({
		value: o.value,
		label: o.label,
	}));

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setData(null);
		const q = await resolveBirthQuery(birthPlace, birthDatetimeLocal, ayanamsa);
		if (!q.ok) {
			setError(q.message);
			return;
		}
		const params = new URLSearchParams({ ...birthParams(q), la: language });
		setLoading(true);
		try {
			const res = await fetchProkeralaJson(`/api/prokerala/gowri-nalla-neram?${params}`);
			if (!res.ok) setError(res.error);
			else setData(res.data);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<BirthFields
					ayanamsa={ayanamsa}
					setAyanamsa={setAyanamsa}
					birthDatetimeLocal={birthDatetimeLocal}
					setBirthDatetimeLocal={setBirthDatetimeLocal}
					birthPlace={birthPlace}
					setBirthPlace={setBirthPlace}
				/>
				<LanguageField value={language} onChange={setLanguage} options={langOpts} />
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearData}
					refreshDisabled={data == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
		</CalculationShell>
	);
}

function MatchTypeField({
	value,
	onChange,
}: {
	value: "basic" | "advanced";
	onChange: (v: "basic" | "advanced") => void;
}) {
	return (
		<div className={rowClass}>
			<Label className={labelClass}>Result Type</Label>
			<RadioGroup
				value={value}
				onValueChange={(v) => onChange(v as "basic" | "advanced")}
				className="flex flex-wrap gap-6"
			>
				<div className="flex items-center gap-2">
					<RadioGroupItem value="basic" id="mm-basic" />
					<Label htmlFor="mm-basic" className="font-normal">
						Basic
					</Label>
				</div>
				<div className="flex items-center gap-2">
					<RadioGroupItem value="advanced" id="mm-advanced" />
					<Label htmlFor="mm-advanced" className="font-normal">
						Advanced
					</Label>
				</div>
			</RadioGroup>
		</div>
	);
}

function PartnerBirthDetailsFields({
	prefix,
	birthDatetimeLocal,
	setBirthDatetimeLocal,
	birthPlace,
	setBirthPlace,
}: {
	prefix: "girl" | "boy";
	birthDatetimeLocal: string;
	setBirthDatetimeLocal: (v: string) => void;
	birthPlace: string;
	setBirthPlace: (v: string) => void;
}) {
	const [dobOpen, setDobOpen] = useState(false);
	const title = prefix === "girl" ? "Enter Girl's Birth Details" : "Enter Boy's Birth Details";
	const dateLabel = "Date Of Birth";
	const placeLabel = "Place of birth";
	const selectedDate = birthDatetimeLocal
		? new Date(`${birthDatetimeLocal}T00:00:00`)
		: undefined;

	const onSelectDate = (date: Date | undefined) => {
		if (!date) {
			setBirthDatetimeLocal("");
			return;
		}
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, "0");
		const d = String(date.getDate()).padStart(2, "0");
		setBirthDatetimeLocal(`${y}-${m}-${d}`);
		setDobOpen(false);
	};
	return (
		<section className={partnerSectionClass}>
			<h3 className="font-serif text-2xl font-bold tracking-tight text-foreground">{title}</h3>
			<div className={rowClass}>
				<Label htmlFor={`${prefix}-dob`} className={labelClass}>
					{dateLabel}
				</Label>
				<Popover open={dobOpen} onOpenChange={setDobOpen}>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className={cn(
								fieldInputClass,
								"justify-between px-3 font-normal",
								!birthDatetimeLocal && "text-muted-foreground"
							)}
						>
							{selectedDate ? format(selectedDate, "dd/MM/yyyy") : "dd/mm/yyyy"}
							<CalendarIcon className="h-4 w-4 opacity-70" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={onSelectDate}
							captionLayout="dropdown"
							initialFocus
						/>
					</PopoverContent>
				</Popover>
				<input
					id={`${prefix}-dob`}
					type="hidden"
					value={birthDatetimeLocal}
					required
					readOnly
				/>
			</div>
			<div className={rowClass}>
				<Label htmlFor={`${prefix}-pob`} className={labelClass}>
					{placeLabel}
				</Label>
				<Input
					id={`${prefix}-pob`}
					placeholder="Place of birth"
					className={fieldInputClass}
					value={birthPlace}
					onChange={(e) => setBirthPlace(e.target.value)}
					required
				/>
			</div>
		</section>
	);
}

function PartnerNakshatraFields({
	prefix,
	nakshatra,
	setNakshatra,
	nakshatraPada,
	setNakshatraPada,
}: {
	prefix: "girl" | "boy";
	nakshatra: string;
	setNakshatra: (v: string) => void;
	nakshatraPada: string;
	setNakshatraPada: (v: string) => void;
}) {
	const title = prefix === "girl" ? "Enter Girl's Details" : "Enter Boy's Details";
	const nakshatraLabel = prefix === "girl" ? "Girl Nakshatra" : "Boy Nakshatra";
	const padaLabel = prefix === "girl" ? "Girl Nakshatra Pada" : "Boy Nakshatra Pada";
	return (
		<section className={partnerSectionClass}>
			<h3 className="font-serif text-2xl font-bold tracking-tight text-foreground">{title}</h3>
			<div className={rowClass}>
				<Label className={labelClass}>{nakshatraLabel}</Label>
				<Select value={nakshatra} onValueChange={setNakshatra}>
					<SelectTrigger className={fieldSelectTriggerClass}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{NAKSHATRA_OPTIONS.map((name, idx) => (
							<SelectItem key={name} value={String(idx)}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className={rowClass}>
				<Label className={labelClass}>{padaLabel}</Label>
				<Select value={nakshatraPada} onValueChange={setNakshatraPada}>
					<SelectTrigger className={fieldSelectTriggerClass}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{NAKSHATRA_PADA_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</section>
	);
}

function FormMarriageBirthDetails({
	title,
	basePath,
	advancedPath,
	langOptions,
	includeSystem = false,
}: {
	title: string;
	basePath: string;
	advancedPath?: string;
	langOptions: LangOption[];
	includeSystem?: boolean;
}) {
	const [ayanamsa, setAyanamsa] = useState<ProkeralaAyanamsa>(1);
	const [language, setLanguage] = useState(langOptions[0]?.value ?? "en");
	const [system, setSystem] = useState<"kerala" | "tamil">("kerala");
	const [resultType, setResultType] = useState<"basic" | "advanced">("basic");
	const [girlBirthDatetimeLocal, setGirlBirthDatetimeLocal] = useState("");
	const [girlBirthPlace, setGirlBirthPlace] = useState("");
	const [boyBirthDatetimeLocal, setBoyBirthDatetimeLocal] = useState("");
	const [boyBirthPlace, setBoyBirthPlace] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>(`calc-json:${basePath}:${advancedPath ?? "basic"}`);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setData(null);

		const resolved = await resolvePartnerBirthQuery({
			girlBirthPlace,
			girlBirthDatetimeLocal,
			boyBirthPlace,
			boyBirthDatetimeLocal,
			ayanamsa,
		});
		if (!resolved.ok) {
			setError(resolved.message);
			return;
		}

		const path =
			resultType === "advanced" && advancedPath
				? advancedPath
				: basePath;
		const params = new URLSearchParams({
			...resolved.params,
			la: language,
		});
		if (includeSystem) {
			params.set("system", system);
		}
		setLoading(true);
		try {
			const res = await fetchProkeralaJson(`/api/prokerala/${path}?${params}`);
			if (!res.ok) setError(res.error);
			else setData(res.data);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<div className={pairGridClass}>
					<div className={rowClass}>
						<Label className={labelClass}>Ayanamsa</Label>
						<Select
							value={String(ayanamsa)}
							onValueChange={(v) => setAyanamsa(Number(v) as ProkeralaAyanamsa)}
						>
							<SelectTrigger className={fieldSelectTriggerClass}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{AYANAMSA_OPTIONS.map((o) => (
									<SelectItem key={o.value} value={String(o.value)}>
										{o.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{includeSystem ? (
						<div className={rowClass}>
							<Label className={labelClass}>System</Label>
							<Select value={system} onValueChange={(v) => setSystem(v as "kerala" | "tamil")}>
								<SelectTrigger className={fieldSelectTriggerClass}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="kerala">Kerala</SelectItem>
									<SelectItem value="tamil">Tamil</SelectItem>
								</SelectContent>
							</Select>
						</div>
					) : (
						<LanguageField value={language} onChange={setLanguage} options={langOptions} />
					)}
				</div>

				<div className={pairGridClass}>
					<PartnerBirthDetailsFields
						prefix="girl"
						birthDatetimeLocal={girlBirthDatetimeLocal}
						setBirthDatetimeLocal={setGirlBirthDatetimeLocal}
						birthPlace={girlBirthPlace}
						setBirthPlace={setGirlBirthPlace}
					/>
					<PartnerBirthDetailsFields
						prefix="boy"
						birthDatetimeLocal={boyBirthDatetimeLocal}
						setBirthDatetimeLocal={setBoyBirthDatetimeLocal}
						birthPlace={boyBirthPlace}
						setBirthPlace={setBoyBirthPlace}
					/>
				</div>
				{advancedPath ? <MatchTypeField value={resultType} onChange={setResultType} /> : null}
				{includeSystem ? (
					<LanguageField value={language} onChange={setLanguage} options={langOptions} />
				) : null}
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearData}
					refreshDisabled={data == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
		</CalculationShell>
	);
}

function FormMarriageNakshatra({
	title,
	basePath,
	advancedPath,
}: {
	title: string;
	basePath: string;
	advancedPath: string;
}) {
	const [girlNakshatra, setGirlNakshatra] = useState("0");
	const [girlNakshatraPada, setGirlNakshatraPada] = useState("1");
	const [boyNakshatra, setBoyNakshatra] = useState("0");
	const [boyNakshatraPada, setBoyNakshatraPada] = useState("1");
	const [resultType, setResultType] = useState<"basic" | "advanced">("basic");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: data, setValue: setData, clearValue: clearData } =
		useHoroscopeCachedValue<unknown>(`calc-json:${basePath}:${advancedPath}`);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setData(null);

		const path = resultType === "advanced" ? advancedPath : basePath;
		const params = new URLSearchParams({
			girl_nakshatra: girlNakshatra,
			girl_nakshatra_pada: girlNakshatraPada,
			boy_nakshatra: boyNakshatra,
			boy_nakshatra_pada: boyNakshatraPada,
		});
		setLoading(true);
		try {
			const res = await fetchProkeralaJson(`/api/prokerala/${path}?${params}`);
			if (!res.ok) setError(res.error);
			else setData(res.data);
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				<div className={pairGridClass}>
					<PartnerNakshatraFields
						prefix="girl"
						nakshatra={girlNakshatra}
						setNakshatra={setGirlNakshatra}
						nakshatraPada={girlNakshatraPada}
						setNakshatraPada={setGirlNakshatraPada}
					/>
					<PartnerNakshatraFields
						prefix="boy"
						nakshatra={boyNakshatra}
						setNakshatra={setBoyNakshatra}
						nakshatraPada={boyNakshatraPada}
						setNakshatraPada={setBoyNakshatraPada}
					/>
				</div>
				<MatchTypeField value={resultType} onChange={setResultType} />
				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={clearData}
					refreshDisabled={data == null}
				/>
			</form>
			<HoroscopeJsonResult data={data} error={error} loading={loading} />
		</CalculationShell>
	);
}

/* ─── Western Astrology: single-profile form for natal / transit / progression / solar-return ─── */

type WesternSingleProfileChartType = "natal" | "transit" | "progression" | "solar-return";

function westernApiPaths(ct: WesternSingleProfileChartType) {
	const slug = ct === "solar-return" ? "solar-return" : ct; // natal, transit, progression
	return {
		chart: `western-astrology/${slug}-chart`,
		aspectChart: `western-astrology/${slug}-aspect-chart`,
		planetPosition: `western-astrology/${slug}-planet-position`,
	};
}

function FormWesternSingleProfile({
	title,
	chartType,
}: {
	title: string;
	chartType: WesternSingleProfileChartType;
}) {
	const [birthDatetimeLocal, setBirthDatetimeLocal] = useState("");
	const [unknownTime, setUnknownTime] = useState(false);
	const [birthPlace, setBirthPlace] = useState("");
	const [houseSystem, setHouseSystem] = useState("placidus");
	const [aspectFilter, setAspectFilter] = useState("major");
	const [orb, setOrb] = useState<"default" | "exact">("default");
	const [language, setLanguage] = useState("en");

	// transit-specific
	const [transitDatetimeLocal, setTransitDatetimeLocal] = useState("");
	const [transitLocation, setTransitLocation] = useState("");

	// progression-specific
	const [progressionYear, setProgressionYear] = useState("");
	const [progressedLocation, setProgressedLocation] = useState("");

	// solar-return-specific
	const [solarReturnYear, setSolarReturnYear] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: result, setValue: setResult, clearValue: clearResult } =
		useHoroscopeCachedValue<WesternResultData>(
			`calc-western-single:${chartType}`,
		);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setResult(null);

		if (!birthDatetimeLocal) {
			setError("Birth date and time is required.");
			return;
		}

		const birthGeo = await geocodePlace(birthPlace);
		if (!birthGeo.ok) {
			setError(birthGeo.message);
			return;
		}

		const dt = birthDatetimeLocal.includes("T")
			? datetimeLocalToIsoWithOffset(birthDatetimeLocal)
			: dateInputToIsoDatetime(birthDatetimeLocal);

		const params = new URLSearchParams();
		params.set("profile[datetime]", dt);
		params.set("profile[coordinates]", `${birthGeo.lat},${birthGeo.lng}`);
		params.set("house_system", houseSystem);
		params.set("orb", orb);
		params.set("aspect_filter", aspectFilter);
		params.set("la", language);
		if (unknownTime) {
			params.set("birth_time_rectification", "flat-chart");
		}

		// Extra params by chart type
		if (chartType === "transit") {
			if (!transitDatetimeLocal) {
				setError("Transit date time is required.");
				return;
			}
			const transitGeo = await geocodePlace(transitLocation || birthPlace);
			if (!transitGeo.ok) {
				setError(`Transit location: ${transitGeo.message}`);
				return;
			}
			const transitDt = transitDatetimeLocal.includes("T")
				? datetimeLocalToIsoWithOffset(transitDatetimeLocal)
				: dateInputToIsoDatetime(transitDatetimeLocal);
			params.set("transit_datetime", transitDt);
			params.set("current_coordinates", `${transitGeo.lat},${transitGeo.lng}`);
		} else if (chartType === "progression") {
			if (!progressionYear) {
				setError("Progression year is required.");
				return;
			}
			const progGeo = await geocodePlace(progressedLocation || birthPlace);
			if (!progGeo.ok) {
				setError(`Progressed location: ${progGeo.message}`);
				return;
			}
			params.set("progression_year", progressionYear);
			params.set("current_coordinates", `${progGeo.lat},${progGeo.lng}`);
		} else if (chartType === "solar-return") {
			if (!solarReturnYear) {
				setError("Solar return year is required.");
				return;
			}
			const srGeo = await geocodePlace(transitLocation || birthPlace);
			if (!srGeo.ok) {
				setError(`Transit location: ${srGeo.message}`);
				return;
			}
			params.set("solar_return_year", solarReturnYear);
			params.set("current_coordinates", `${srGeo.lat},${srGeo.lng}`);
		}

		const paths = westernApiPaths(chartType);
		const qs = params.toString();

		setLoading(true);
		try {
			const [chartRes, aspectRes, dataRes] = await Promise.all([
				fetchProkeralaSvg(`/api/prokerala/${paths.chart}?${qs}`),
				fetchProkeralaSvg(`/api/prokerala/${paths.aspectChart}?${qs}`),
				fetchProkeralaJson(`/api/prokerala/${paths.planetPosition}?${qs}`),
			]);

			const errors: string[] = [];
			if (!chartRes.ok) errors.push(`Chart: ${chartRes.error}`);
			if (!aspectRes.ok) errors.push(`Aspect chart: ${aspectRes.error}`);
			if (!dataRes.ok) errors.push(`Planet data: ${dataRes.error}`);

			if (errors.length === 3) {
				setError(errors.join(" | "));
				return;
			}

			setResult({
				chartSvg: chartRes.ok ? chartRes.svg : null,
				aspectChartSvg: aspectRes.ok ? aspectRes.svg : null,
				jsonData: dataRes.ok ? (dataRes.data as Record<string, unknown>) : null,
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				{/* Birth Date */}
				<div className={rowClass}>
					<Label htmlFor="w-birth-dt" className={labelClass}>Birth Date:</Label>
					<Input
						id="w-birth-dt"
						type="datetime-local"
						className={fieldInputClass}
						value={birthDatetimeLocal}
						onChange={(e) => setBirthDatetimeLocal(e.target.value)}
						required
					/>
				</div>

				{/* Unknown time checkbox */}
				<div className={rowClass}>
					<div />
					<label className="flex items-center gap-2 text-sm text-foreground">
						<input
							type="checkbox"
							checked={unknownTime}
							onChange={(e) => setUnknownTime(e.target.checked)}
							className="accent-orange-500"
						/>
						Check if exact birth time is unknown
					</label>
				</div>

				{/* Birth Place */}
				<div className={rowClass}>
					<Label htmlFor="w-birth-place" className={labelClass}>Birth Place:</Label>
					<Input
						id="w-birth-place"
						placeholder="City, Region, Country"
						className={fieldInputClass}
						value={birthPlace}
						onChange={(e) => setBirthPlace(e.target.value)}
						required
					/>
				</div>

				{/* House System */}
				<div className={rowClass}>
					<Label className={labelClass}>House System:</Label>
					<Select value={houseSystem} onValueChange={setHouseSystem}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{WESTERN_HOUSE_SYSTEM_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Transit-specific fields */}
				{chartType === "transit" && (
					<>
						<div className={rowClass}>
							<Label htmlFor="w-transit-dt" className={labelClass}>Transit Date Time:</Label>
							<Input
								id="w-transit-dt"
								type="datetime-local"
								className={fieldInputClass}
								value={transitDatetimeLocal}
								onChange={(e) => setTransitDatetimeLocal(e.target.value)}
								required
							/>
						</div>
						<div className={rowClass}>
							<Label htmlFor="w-transit-loc" className={labelClass}>Transit Location:</Label>
							<Input
								id="w-transit-loc"
								placeholder="Transit Location"
								className={fieldInputClass}
								value={transitLocation}
								onChange={(e) => setTransitLocation(e.target.value)}
							/>
						</div>
					</>
				)}

				{/* Progression-specific fields */}
				{chartType === "progression" && (
					<>
						<div className={rowClass}>
							<Label htmlFor="w-prog-year" className={labelClass}>Progression Year:</Label>
							<Input
								id="w-prog-year"
								type="number"
								placeholder="2027"
								className={fieldInputClass}
								value={progressionYear}
								onChange={(e) => setProgressionYear(e.target.value)}
								required
							/>
						</div>
						<div className={rowClass}>
							<Label htmlFor="w-prog-loc" className={labelClass}>Progressed Location:</Label>
							<Input
								id="w-prog-loc"
								placeholder="Progressed Location"
								className={fieldInputClass}
								value={progressedLocation}
								onChange={(e) => setProgressedLocation(e.target.value)}
							/>
						</div>
					</>
				)}

				{/* Solar return-specific fields */}
				{chartType === "solar-return" && (
					<>
						<div className={rowClass}>
							<Label htmlFor="w-sr-year" className={labelClass}>Solar Return Year:</Label>
							<Input
								id="w-sr-year"
								type="number"
								placeholder="2027"
								className={fieldInputClass}
								value={solarReturnYear}
								onChange={(e) => setSolarReturnYear(e.target.value)}
								required
							/>
						</div>
						<div className={rowClass}>
							<Label htmlFor="w-sr-loc" className={labelClass}>Transit Location:</Label>
							<Input
								id="w-sr-loc"
								placeholder="Transit Location"
								className={fieldInputClass}
								value={transitLocation}
								onChange={(e) => setTransitLocation(e.target.value)}
							/>
						</div>
					</>
				)}

				{/* Aspect Filter */}
				<div className={rowClass}>
					<Label className={labelClass}>Aspect Filter:</Label>
					<Select value={aspectFilter} onValueChange={setAspectFilter}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{WESTERN_ASPECT_FILTER_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Orb */}
				<div className={rowClass}>
					<Label className={labelClass}>Orb:</Label>
					<RadioGroup
						value={orb}
						onValueChange={(v) => setOrb(v as "default" | "exact")}
						className="flex flex-wrap gap-6"
					>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="default" id="w-orb-default" />
							<Label htmlFor="w-orb-default" className="font-normal">Default</Label>
						</div>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="exact" id="w-orb-exact" />
							<Label htmlFor="w-orb-exact" className="font-normal">Exact</Label>
						</div>
					</RadioGroup>
				</div>

				{/* Language */}
				<div className={rowClass}>
					<Label className={labelClass}>Language:</Label>
					<Select value={language} onValueChange={setLanguage}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{WESTERN_LANGUAGE_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={() => {
						clearResult();
						setError(null);
					}}
					refreshDisabled={result == null}
				/>
			</form>

			{error && (
				<div className="border-t border-destructive/20 bg-destructive/5 px-6 py-4 md:px-8">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{result && <WesternAstrologyResultDisplay result={result} chartLabel={title} />}
		</CalculationShell>
	);
}

/* ─── Western Astrology: dual-profile form for synastry / composite ─── */

type WesternDualProfileChartType = "synastry" | "composite";

function westernDualApiPaths(ct: WesternDualProfileChartType) {
	return {
		chart: `western-astrology/${ct}-chart`,
		aspectChart: `western-astrology/${ct}-aspect-chart`,
		planetAspect: `western-astrology/${ct}-planet-aspect`,
	};
}

function FormWesternDualProfile({
	title,
	chartType,
}: {
	title: string;
	chartType: WesternDualProfileChartType;
}) {
	// Primary profile
	const [primaryDatetimeLocal, setPrimaryDatetimeLocal] = useState("");
	const [primaryUnknownTime, setPrimaryUnknownTime] = useState(false);
	const [primaryPlace, setPrimaryPlace] = useState("");

	// Secondary profile
	const [secondaryDatetimeLocal, setSecondaryDatetimeLocal] = useState("");
	const [secondaryUnknownTime, setSecondaryUnknownTime] = useState(false);
	const [secondaryPlace, setSecondaryPlace] = useState("");

	// Shared fields
	const [synastryChartType, setSynastryChartType] = useState("zodiac-contact-chart");
	const [houseSystem, setHouseSystem] = useState("placidus");
	const [aspectFilter, setAspectFilter] = useState("major");
	const [orb, setOrb] = useState<"default" | "exact">("default");
	const [language, setLanguage] = useState("en");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { value: result, setValue: setResult, clearValue: clearResult } =
		useHoroscopeCachedValue<WesternResultData>(
			`calc-western-dual:${chartType}`,
		);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setResult(null);

		if (!primaryDatetimeLocal) {
			setError("Primary profile date and time is required.");
			return;
		}
		if (!secondaryDatetimeLocal) {
			setError("Secondary profile date and time is required.");
			return;
		}

		const [primaryGeo, secondaryGeo] = await Promise.all([
			geocodePlace(primaryPlace),
			geocodePlace(secondaryPlace),
		]);
		if (!primaryGeo.ok) {
			setError(`Primary profile: ${primaryGeo.message}`);
			return;
		}
		if (!secondaryGeo.ok) {
			setError(`Secondary profile: ${secondaryGeo.message}`);
			return;
		}

		const pDt = primaryDatetimeLocal.includes("T")
			? datetimeLocalToIsoWithOffset(primaryDatetimeLocal)
			: dateInputToIsoDatetime(primaryDatetimeLocal);
		const sDt = secondaryDatetimeLocal.includes("T")
			? datetimeLocalToIsoWithOffset(secondaryDatetimeLocal)
			: dateInputToIsoDatetime(secondaryDatetimeLocal);

		const params = new URLSearchParams();
		params.set("primary_profile[datetime]", pDt);
		params.set("primary_profile[coordinates]", `${primaryGeo.lat},${primaryGeo.lng}`);
		params.set("secondary_profile[datetime]", sDt);
		params.set("secondary_profile[coordinates]", `${secondaryGeo.lat},${secondaryGeo.lng}`);
		params.set("house_system", houseSystem);
		params.set("chart_type", synastryChartType);
		params.set("orb", orb);
		params.set("aspect_filter", aspectFilter);
		params.set("la", language);

		// Composite needs transit_datetime and current_coordinates
		if (chartType === "composite") {
			params.set("transit_datetime", pDt);
			params.set("current_coordinates", `${primaryGeo.lat},${primaryGeo.lng}`);
		}

		if (primaryUnknownTime) {
			params.set("birth_time_rectification", "flat-chart");
		}

		const paths = westernDualApiPaths(chartType);
		const qs = params.toString();

		setLoading(true);
		try {
			const [chartRes, aspectRes, dataRes] = await Promise.all([
				fetchProkeralaSvg(`/api/prokerala/${paths.chart}?${qs}`),
				fetchProkeralaSvg(`/api/prokerala/${paths.aspectChart}?${qs}`),
				fetchProkeralaJson(`/api/prokerala/${paths.planetAspect}?${qs}`),
			]);

			const errors: string[] = [];
			if (!chartRes.ok) errors.push(`Chart: ${chartRes.error}`);
			if (!aspectRes.ok) errors.push(`Aspect chart: ${aspectRes.error}`);
			if (!dataRes.ok) errors.push(`Planet data: ${dataRes.error}`);

			if (errors.length === 3) {
				setError(errors.join(" | "));
				return;
			}

			setResult({
				chartSvg: chartRes.ok ? chartRes.svg : null,
				aspectChartSvg: aspectRes.ok ? aspectRes.svg : null,
				jsonData: dataRes.ok ? (dataRes.data as Record<string, unknown>) : null,
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<CalculationShell title={title}>
			<form onSubmit={onSubmit} className={formClassName}>
				{/* ─── Primary Profile ─── */}
				<div className="space-y-4 rounded-lg border border-border/70 p-4 md:p-5">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						Enter Primary Profile
					</h3>
					<div className={rowClass}>
						<Label htmlFor="w-p-dt" className={labelClass}>Birth Date:</Label>
						<Input
							id="w-p-dt"
							type="datetime-local"
							className={fieldInputClass}
							value={primaryDatetimeLocal}
							onChange={(e) => setPrimaryDatetimeLocal(e.target.value)}
							required
						/>
					</div>
					<div className={rowClass}>
						<div />
						<label className="flex items-center gap-2 text-sm text-foreground">
							<input
								type="checkbox"
								checked={primaryUnknownTime}
								onChange={(e) => setPrimaryUnknownTime(e.target.checked)}
								className="accent-orange-500"
							/>
							Check if exact birth time is unknown
						</label>
					</div>
					<div className={rowClass}>
						<Label htmlFor="w-p-place" className={labelClass}>Birth Place:</Label>
						<Input
							id="w-p-place"
							placeholder="City, Region, Country"
							className={fieldInputClass}
							value={primaryPlace}
							onChange={(e) => setPrimaryPlace(e.target.value)}
							required
						/>
					</div>
				</div>

				{/* ─── Secondary Profile ─── */}
				<div className="space-y-4 rounded-lg border border-border/70 p-4 md:p-5">
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						Enter Secondary Profile
					</h3>
					<div className={rowClass}>
						<Label htmlFor="w-s-dt" className={labelClass}>Birth Date:</Label>
						<Input
							id="w-s-dt"
							type="datetime-local"
							className={fieldInputClass}
							value={secondaryDatetimeLocal}
							onChange={(e) => setSecondaryDatetimeLocal(e.target.value)}
							required
						/>
					</div>
					<div className={rowClass}>
						<div />
						<label className="flex items-center gap-2 text-sm text-foreground">
							<input
								type="checkbox"
								checked={secondaryUnknownTime}
								onChange={(e) => setSecondaryUnknownTime(e.target.checked)}
								className="accent-orange-500"
							/>
							Check if exact birth time is unknown
						</label>
					</div>
					<div className={rowClass}>
						<Label htmlFor="w-s-place" className={labelClass}>Birth Place:</Label>
						<Input
							id="w-s-place"
							placeholder="City, Region, Country"
							className={fieldInputClass}
							value={secondaryPlace}
							onChange={(e) => setSecondaryPlace(e.target.value)}
							required
						/>
					</div>
				</div>

				{/* Synastry Chart Type */}
				<div className={rowClass}>
					<Label className={labelClass}>Synastry Chart Type:</Label>
					<Select value={synastryChartType} onValueChange={setSynastryChartType}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{WESTERN_SYNASTRY_CHART_TYPE_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* House System */}
				<div className={rowClass}>
					<Label className={labelClass}>House System:</Label>
					<Select value={houseSystem} onValueChange={setHouseSystem}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{WESTERN_HOUSE_SYSTEM_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Aspect Filter */}
				<div className={rowClass}>
					<Label className={labelClass}>Aspect Filter:</Label>
					<Select value={aspectFilter} onValueChange={setAspectFilter}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{WESTERN_ASPECT_FILTER_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Orb */}
				<div className={rowClass}>
					<Label className={labelClass}>Orb:</Label>
					<RadioGroup
						value={orb}
						onValueChange={(v) => setOrb(v as "default" | "exact")}
						className="flex flex-wrap gap-6"
					>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="default" id="w-d-orb-default" />
							<Label htmlFor="w-d-orb-default" className="font-normal">Default</Label>
						</div>
						<div className="flex items-center gap-2">
							<RadioGroupItem value="exact" id="w-d-orb-exact" />
							<Label htmlFor="w-d-orb-exact" className="font-normal">Exact</Label>
						</div>
					</RadioGroup>
				</div>

				{/* Language */}
				<div className={rowClass}>
					<Label className={labelClass}>Language:</Label>
					<Select value={language} onValueChange={setLanguage}>
						<SelectTrigger className={fieldSelectTriggerClass}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{WESTERN_LANGUAGE_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<HoroscopeSubmitButton
					loading={loading}
					onRefresh={() => {
						clearResult();
						setError(null);
					}}
					refreshDisabled={result == null}
				/>
			</form>

			{error && (
				<div className="border-t border-destructive/20 bg-destructive/5 px-6 py-4 md:px-8">
					<p className="text-sm text-destructive">{error}</p>
				</div>
			)}

			{result && <WesternAstrologyResultDisplay result={result} chartLabel={title} />}
		</CalculationShell>
	);
}

export type HoroscopeCalculatorsRouterProps = {
	slug: string;
	title: string;
	className?: string;
};

export function HoroscopeCalculatorsRouter({ slug, title, className }: HoroscopeCalculatorsRouterProps) {
	if (!isHoroscopeCalculatorSlug(slug)) {
		return (
			<div className={cn("rounded-lg border border-dashed p-8 text-center text-muted-foreground", className)}>
				Unknown calculator slug.
			</div>
		);
	}

	const s = slug as HoroscopeCalculatorSlug;

	const el = (() => {
		switch (s) {
			case "birth-details":
				return <FormBirthLangJson title={title} apiPath="birth-details" />;
			case "papa-dosham":
				return <FormBirthLangJson title={title} apiPath="papasamyam" />;
			case "planet-position":
				return <FormPlanetPosition title={title} />;
			case "dasha-periods":
				return <FormBirthLangJson title={title} apiPath="dasha-periods" />;
			case "yoga-details":
				return <FormBirthLangJson title={title} apiPath="yoga" />;
			case "planet-relationship":
				return <FormBirthLangJson title={title} apiPath="planet-relationship" />;
			case "kundli":
				return (
					<FormBasicAdvanced
						title={title}
						basePath="kundli"
						advancedPath="kundli/advanced"
					/>
				);
			case "mangal-dosha":
				return (
					<FormBasicAdvanced
						title={title}
						basePath="mangal-dosha"
						advancedPath="mangal-dosha/advanced"
					/>
				);
			case "sade-sati":
				return <FormSadeSati title={title} />;
			case "kaal-sarp-dosha":
				return <FormKaalSarp title={title} />;
			case "birth-chart":
				return <FormBirthChart title={title} />;
			case "sudarshana-chakra":
				return <FormSudarshana title={title} />;
			case "ashtakavarga-sarvashtakavarga":
				return <FormAshtakavarga title={title} />;
			case "chandrashtama-periods":
				return <FormChandrashtama title={title} />;
			case "gowri-nalla-neram":
				return <FormGowri title={title} />;
			case "kundli-matching":
				return (
					<FormMarriageBirthDetails
						title={title}
						basePath="kundli-matching"
						advancedPath="kundli-matching/advanced"
						langOptions={[
							{ value: "en", label: "English" },
							{ value: "hi", label: "Hindi" },
						]}
					/>
				);
			case "porutham":
				return (
					<FormMarriageBirthDetails
						title={title}
						basePath="porutham"
						advancedPath="porutham/advanced"
						langOptions={[
							{ value: "en", label: "English" },
							{ value: "ta", label: "Tamil" },
							{ value: "ml", label: "Malayalam" },
						]}
						includeSystem
					/>
				);
			case "papasamyam-check":
				return (
					<FormMarriageBirthDetails
						title={title}
						basePath="papasamyam-check"
						langOptions={[
							{ value: "en", label: "English" },
							{ value: "ta", label: "Tamil" },
							{ value: "ml", label: "Malayalam" },
							{ value: "hi", label: "Hindi" },
						]}
					/>
				);
			case "nakshatra-porutham":
				return (
					<FormMarriageNakshatra
						title={title}
						basePath="nakshatra-porutham"
						advancedPath="nakshatra-porutham/advanced"
					/>
				);
			case "thirumana-porutham":
				return (
					<FormMarriageNakshatra
						title={title}
						basePath="thirumana-porutham"
						advancedPath="thirumana-porutham/advanced"
					/>
				);
			case "natal-chart":
				return <FormWesternSingleProfile title={title} chartType="natal" />;
			case "transit-chart":
				return <FormWesternSingleProfile title={title} chartType="transit" />;
			case "progression-chart":
				return <FormWesternSingleProfile title={title} chartType="progression" />;
			case "solar-return-chart":
				return <FormWesternSingleProfile title={title} chartType="solar-return" />;
			case "synastry-chart":
				return <FormWesternDualProfile title={title} chartType="synastry" />;
			case "composite-chart":
				return <FormWesternDualProfile title={title} chartType="composite" />;
			default:
				return null;
		}
	})();

	return <div className={cn("mt-8", className)}>{el}</div>;
}
