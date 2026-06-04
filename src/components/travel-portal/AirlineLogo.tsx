"use client";

import Image from "next/image";
import { getAirlineLogoUrl } from "@/lib/airline-logo";

interface AirlineLogoProps {
	airlineCode: string;
	airlineName: string;
	size?: "sm" | "md";
}

export default function AirlineLogo({
	airlineCode,
	airlineName,
	size = "sm",
}: AirlineLogoProps) {
	const normalizedCode = airlineCode.trim().toUpperCase();

	if (!normalizedCode) {
		return null;
	}

	const logoPath = getAirlineLogoUrl(normalizedCode);
	const dimensions = size === "sm" ? 28 : 32;

	return (
		<Image
			src={logoPath}
			alt={`${airlineName} logo`}
			width={dimensions}
			height={dimensions}
			className="object-contain"
			onError={(e) => {
				const target = e.target as HTMLImageElement;
				target.style.display = "none";
				const parent = target.parentElement;
				if (parent) {
					parent.innerHTML = `<span class="text-xs font-bold text-gray-600">${normalizedCode}</span>`;
				}
			}}
		/>
	);
}
