"use client";

import { useEffect, useState } from "react";
import {
	airportLabelFromFields,
	resolveAirportLabel,
} from "@/lib/reference-data-client";

/** Airport label for client UI; enriches via /api/airports when city name is missing. */
export function AirportCodeLabel({
	code,
	city,
	className,
}: {
	code: string;
	city?: string | null;
	className?: string;
}) {
	const [label, setLabel] = useState(() =>
		airportLabelFromFields(code, city),
	);

	useEffect(() => {
		if (city?.trim()) {
			setLabel(airportLabelFromFields(code, city));
			return;
		}
		let cancelled = false;
		resolveAirportLabel(code).then((resolved) => {
			if (!cancelled) setLabel(resolved);
		});
		return () => {
			cancelled = true;
		};
	}, [code, city]);

	return <span className={className}>{label}</span>;
}
