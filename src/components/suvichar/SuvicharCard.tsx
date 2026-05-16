"use client";

import { forwardRef } from "react";
import Image from "next/image";
import cn from "classnames";
import { SuvicharFitTextArea } from "./SuvicharFitTextArea";
import type {
	TextStyleOverrides,
	TodaySuvicharFrame,
	TodaySuvicharText,
} from "@/lib/suvichar/types";

const CANVAS_SIZE = 1080;

export interface SuvicharCardProps {
	text: TodaySuvicharText;
	frame: TodaySuvicharFrame;
	textStyleOverrides?: TextStyleOverrides | null;
	/** Display width in px (scales 1080 canvas) */
	displaySize?: number;
	className?: string;
}

export const SuvicharCard = forwardRef<HTMLDivElement, SuvicharCardProps>(
	function SuvicharCard(
		{ text, frame, textStyleOverrides, displaySize = 320, className },
		ref,
	) {
		const scale = displaySize / CANVAS_SIZE;
		const { safeArea } = frame;

		return (
			<div
				className={cn("overflow-hidden rounded-xl shadow-lg", className)}
				style={{ width: displaySize, height: displaySize }}
			>
				<div
					ref={ref}
					className="relative origin-top-left bg-white"
					style={{
						width: CANVAS_SIZE,
						height: CANVAS_SIZE,
						transform: `scale(${scale})`,
					}}
				>
					<Image
						src={frame.imageUrl}
						alt=""
						width={frame.width}
						height={frame.height}
						className="absolute inset-0 h-full w-full object-cover"
						unoptimized
						priority
					/>
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
							safeWidth={safeArea.width}
							safeHeight={safeArea.height}
							textStyleOverrides={textStyleOverrides}
						/>
					</div>
				</div>
			</div>
		);
	},
);
