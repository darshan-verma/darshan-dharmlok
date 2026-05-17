"use client";

import { useMemo } from "react";
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
import { useAutoFitFontSize } from "./useAutoFitFontSize";

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
 * Auto-fit plain quote text into the frame safe area.
 * finalFontSize = autoFitFontSize * fontScale
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
				safeWidth,
				safeHeight,
				contentWidth,
				contentHeight,
				style.lineHeight,
				style.letterSpacing,
				style.fontWeight,
				style.textAlign,
				style.paddingTop,
				style.paddingRight,
				style.paddingBottom,
				style.paddingLeft,
				style.widthScale,
				style.heightScale,
			].join("|"),
		[text, safeWidth, safeHeight, contentWidth, contentHeight, style],
	);

	const { containerRef, textRef, autoFitFontSize } = useAutoFitFontSize({
		text,
		fitKey,
		enabled: Boolean(text),
	});

	const displayFontSize =
		autoFitFontSize != null ? autoFitFontSize * style.fontScale : undefined;

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
				<div
					ref={containerRef}
					className="suvichar-textfit"
					style={{
						width: contentWidth,
						height: contentHeight,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						overflow: "hidden",
						visibility: autoFitFontSize != null ? "visible" : "hidden",
					}}
				>
					<p
						ref={textRef}
						className={cn("suvichar-plain-text")}
						style={paragraphStyle}
					>
						{text}
					</p>
				</div>
			</div>
		</div>
	);
}
