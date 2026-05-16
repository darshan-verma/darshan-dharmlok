"use client";

import { useEffect, useMemo, useState } from "react";
import { Textfit } from "react-textfit";
import cn from "classnames";
import { resolveSuvicharPlainText } from "@/lib/suvichar/plainText";
import {
	computeTextBoxLayout,
	FONT_WEIGHT_CSS,
	mergeTextStyleOverrides,
	verticalAlignToFlex,
	type FrameTextDefaults,
	type TextStyleOverrides,
} from "@/lib/suvichar/textStyle";

interface SuvicharFitTextAreaProps {
	blocknoteJson: unknown;
	plainText?: string;
	textColor: string;
	textAlign: string;
	/** Safe area width/height in canvas pixels (1080 space) */
	safeWidth: number;
	safeHeight: number;
	textStyleOverrides?: TextStyleOverrides | null;
}

/**
 * Auto-fit plain quote text into the frame safe area via react-textfit (binary search).
 * Manual overrides layer on top: finalFontSize = autoFitSize * fontScale.
 */
export function SuvicharFitTextArea({
	blocknoteJson,
	plainText,
	textColor,
	textAlign,
	safeWidth,
	safeHeight,
	textStyleOverrides,
}: SuvicharFitTextAreaProps) {
	const frameDefaults: FrameTextDefaults = useMemo(
		() => ({
			defaultTextColor: textColor,
			defaultTextAlign: textAlign,
		}),
		[textColor, textAlign],
	);

	const style = useMemo(
		() => mergeTextStyleOverrides(frameDefaults, textStyleOverrides),
		[frameDefaults, textStyleOverrides],
	);

	const text = useMemo(
		() => resolveSuvicharPlainText(blocknoteJson, plainText),
		[blocknoteJson, plainText],
	);

	const { boxWidth, boxHeight, contentWidth, contentHeight } = useMemo(
		() => computeTextBoxLayout(safeWidth, safeHeight, style),
		[safeWidth, safeHeight, style],
	);

	const fitKey = useMemo(
		() =>
			[
				text,
				contentWidth,
				contentHeight,
				style.lineHeight,
				style.letterSpacing,
				style.fontWeight,
				style.textAlign,
			].join("|"),
		[text, contentWidth, contentHeight, style],
	);

	const [autoFitSize, setAutoFitSize] = useState<number | null>(null);

	useEffect(() => {
		setAutoFitSize(null);
	}, [fitKey]);

	const maxFont = Math.max(1, Math.floor(contentHeight));
	const minFont = 1;
	const displayFontSize =
		autoFitSize != null ? autoFitSize * style.fontScale : undefined;

	const paragraphStyle: React.CSSProperties = {
		color: style.textColor ?? textColor,
		textAlign: style.textAlign,
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		overflowWrap: "break-word",
		lineHeight: style.lineHeight,
		letterSpacing: `${style.letterSpacing}px`,
		fontWeight: FONT_WEIGHT_CSS[style.fontWeight],
		margin: 0,
		width: "100%",
		...(displayFontSize != null ? { fontSize: displayFontSize } : {}),
	};

	if (!text) {
		return (
			<div
				className="flex h-full w-full items-center justify-center text-sm text-muted-foreground"
				style={{ width: safeWidth, height: safeHeight }}
			>
				No quote text
			</div>
		);
	}

	return (
		<div
			className="suvichar-safe-text overflow-hidden font-devanagari"
			style={{
				width: safeWidth,
				height: safeHeight,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: verticalAlignToFlex[style.verticalAlign],
			}}
		>
			<div
				style={{
					width: boxWidth,
					height: boxHeight,
					paddingTop: style.paddingTop,
					paddingRight: style.paddingRight,
					paddingBottom: style.paddingBottom,
					paddingLeft: style.paddingLeft,
					boxSizing: "border-box",
					overflow: "hidden",
				}}
			>
				{displayFontSize != null ? (
					<div
						className="suvichar-textfit"
						style={{
							width: contentWidth,
							height: contentHeight,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<p className={cn("suvichar-plain-text")} style={paragraphStyle}>
							{text}
						</p>
					</div>
				) : (
					<Textfit
						key={fitKey}
						mode="multi"
						min={minFont}
						max={maxFont}
						forceSingleModeWidth={false}
						autoResize={false}
						throttle={16}
						onReady={(size) => setAutoFitSize(size)}
						className="suvichar-textfit"
						style={{
							width: contentWidth,
							height: contentHeight,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<p className={cn("suvichar-plain-text")} style={paragraphStyle}>
							{text}
						</p>
					</Textfit>
				)}
			</div>
		</div>
	);
}
