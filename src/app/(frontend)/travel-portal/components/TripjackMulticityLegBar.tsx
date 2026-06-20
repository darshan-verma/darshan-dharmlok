"use client";

import { Button } from "@/components/ui/button";
import type { FlightResult } from "@/types/tbo";
import { Check, Loader2 } from "lucide-react";
import {
	allDomesticMulticityLegsSelected,
	multicityLegLabel,
} from "@/lib/tripjackMulticityUi";

type Props = {
	legs: FlightResult[][];
	selections: (FlightResult | null)[];
	activeLeg: number;
	onActiveLegChange: (index: number) => void;
	onContinue: () => void;
	continuing?: boolean;
	hint?: string;
	continueLabel?: string;
	continuingLabel?: string;
};

export default function TripjackMulticityLegBar({
	legs,
	selections,
	activeLeg,
	onActiveLegChange,
	onContinue,
	continuing,
	hint = "Select one flight per leg (TripJack domestic multicity). Prices are revalidated together at booking.",
	continueLabel = "Continue to booking",
	continuingLabel = "Opening booking…",
}: Props) {
	const ready = allDomesticMulticityLegsSelected(selections, legs.length);

	return (
		<div className="mb-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
			<p className="text-sm font-medium text-amber-950">{hint}</p>
			<div className="flex flex-wrap gap-2">
				{legs.map((legFlights, index) => {
					const selected = selections[index];
					const label = selected
						? multicityLegLabel(selected)
						: legFlights[0]
							? multicityLegLabel(legFlights[0])
							: `Leg ${index + 1}`;
					const isActive = activeLeg === index;
					const isDone = Boolean(selected?.ResultIndex);
					return (
						<button
							key={`mc-leg-${index}`}
							type="button"
							onClick={() => onActiveLegChange(index)}
							className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
								isActive
									? "border-amber-600 bg-white text-amber-950 shadow-sm"
									: "border-amber-200 bg-white/60 text-amber-900 hover:bg-white"
							}`}
						>
							{isDone ? (
								<Check className="h-4 w-4 text-green-600 shrink-0" />
							) : (
								<span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-amber-400 text-[10px] font-semibold">
									{index + 1}
								</span>
							)}
							<span className="font-medium">{label}</span>
						</button>
					);
				})}
			</div>
			{ready ? (
				<Button
					type="button"
					className="w-full sm:w-auto"
					onClick={onContinue}
					disabled={continuing}
				>
					{continuing ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{continuingLabel}
						</>
					) : (
						continueLabel
					)}
				</Button>
			) : (
				<p className="text-xs text-amber-800">
					Choose a flight for leg {activeLeg + 1} of {legs.length}.
				</p>
			)}
		</div>
	);
}
