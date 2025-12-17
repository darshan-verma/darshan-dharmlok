"use client";

import Image from "next/image";

interface AirlineLogoProps {
	airlineCode: string;
	airlineName: string;
	size?: "sm" | "md";
}

// Utility function to get airline logo
const getAirlineLogo = (airlineCode: string): string | null => {
	const logoMap: { [key: string]: string } = {
		AI: "/flight-tail-logos/air-india-logo-tail.png",
		IX: "/flight-tail-logos/air-india-express-logo-tail.png",
		"6E": "/flight-tail-logos/indigo-logo-tail.png",
		SG: "/flight-tail-logos/spicejet-logo-tail.png",
		UK: "/flight-tail-logos/vistara-logo-tail.png",
	};

	return logoMap[airlineCode] || null;
};

export default function AirlineLogo({
	airlineCode,
	airlineName,
	size = "sm",
}: AirlineLogoProps) {
	const logoPath = getAirlineLogo(airlineCode);

	if (!logoPath) {
		return (
			<span className="text-xs font-bold text-gray-600">{airlineCode}</span>
		);
	}

	const dimensions = size === "sm" ? 20 : 24;

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
					parent.innerHTML = `<span class="text-xs font-bold text-gray-600">${airlineCode}</span>`;
				}
			}}
		/>
	);
}
