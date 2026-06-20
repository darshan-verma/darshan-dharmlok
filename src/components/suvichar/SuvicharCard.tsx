"use client";

import { forwardRef, useEffect, useState } from "react";
import Image from "next/image";
import cn from "classnames";
import { SuvicharFitTextArea } from "./SuvicharFitTextArea";
import { SuvicharErrorBoundary } from "./SuvicharErrorBoundary";
import { ErrorFallback } from "./ErrorFallback";
import type {
	TextStyleOverrides,
	TodaySuvicharFrame,
	TodaySuvicharText,
} from "@/lib/suvichar/types";
import { validateSuvicharFrame } from "@/lib/suvichar/validation";

export const CANVAS_SIZE = 1080;

export const DISPLAY_SIZES = {
	scheduler: 280,
	default: 320,
	fullscreen: 920,
} as const;

export function scaleToDisplay(displaySize: number): number {
	return displaySize / CANVAS_SIZE;
}

export interface SuvicharCardProps {
	text: TodaySuvicharText;
	frame: TodaySuvicharFrame;
	textStyleOverrides?: TextStyleOverrides | null;
	/** Display width in px (scales 1080 canvas) */
	displaySize?: number;
	className?: string;
}

function frameToValidationInput(frame: TodaySuvicharFrame) {
	const { safeArea } = frame;
	return {
		safeAreaX: safeArea.x,
		safeAreaY: safeArea.y,
		safeAreaWidth: safeArea.width,
		safeAreaHeight: safeArea.height,
		defaultTextColor: frame.defaultTextColor,
		defaultFontSize: frame.defaultFontSize,
		width: frame.width,
		height: frame.height,
	};
}

export const SuvicharCard = forwardRef<HTMLDivElement, SuvicharCardProps>(
	function SuvicharCard(
		{ text, frame, textStyleOverrides, displaySize = DISPLAY_SIZES.default, className },
		ref,
	) {
		const [validationErrors, setValidationErrors] = useState<string[]>([]);
		const [imageError, setImageError] = useState<string | null>(null);
		const scale = scaleToDisplay(displaySize);
		const { safeArea } = frame;

		useEffect(() => {
			const { valid, errors } = validateSuvicharFrame(frameToValidationInput(frame));
			setValidationErrors(valid ? [] : errors);
		}, [frame]);

		if (validationErrors.length > 0) {
			return (
				<div
					className={cn("overflow-hidden rounded-xl shadow-lg", className)}
					style={{ width: displaySize, height: displaySize }}
				>
					<ErrorFallback
						errors={validationErrors}
						title="Frame safe area configuration error"
						style={{ width: "100%", height: "100%" }}
					/>
				</div>
			);
		}

		return (
			<div
				className={cn("overflow-hidden rounded-xl shadow-lg", className)}
				style={{ width: displaySize, height: displaySize }}
			>
				<SuvicharErrorBoundary>
					<div
						ref={ref}
						className="relative origin-top-left bg-white"
						style={{
							width: CANVAS_SIZE,
							height: CANVAS_SIZE,
							transform: `scale(${scale})`,
						}}
					>
						{imageError ? (
							<div
								className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-center text-sm text-neutral-600"
								style={{ padding: 24 }}
							>
								Frame image failed to load: {imageError}
							</div>
						) : (
							<Image
								src={frame.imageUrl}
								alt=""
								width={frame.width}
								height={frame.height}
								className="absolute inset-0 h-full w-full object-cover"
								unoptimized
								priority
								onError={() => {
									setImageError(frame.imageUrl);
								}}
							/>
						)}
						<div
							className="absolute overflow-hidden"
							style={{
								left: safeArea.x,
								top: safeArea.y,
								width: safeArea.width,
								height: safeArea.height,
							}}
						>
							<SuvicharFitTextArea
								blocknoteJson={text.blocknoteJson}
								plainText={text.plainText}
								textColor={frame.defaultTextColor}
								textAlign={frame.defaultTextAlign}
								defaultFontSize={frame.defaultFontSize}
								safeWidth={safeArea.width}
								safeHeight={safeArea.height}
								textStyleOverrides={textStyleOverrides}
							/>
						</div>
					</div>
				</SuvicharErrorBoundary>
			</div>
		);
	},
);
