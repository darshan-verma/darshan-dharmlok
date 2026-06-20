"use client";

import { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import { resolveSuvicharPlainTextDetailed } from "@/lib/suvichar/text-extraction";
import {
	computeTextBoxLayout,
	FONT_WEIGHT_CSS,
	mergeTextStyleOverrides,
	verticalAlignToFlex,
	type FrameTextDefaults,
	type TextStyleOverrides,
} from "@/lib/suvichar/textStyle";
import {
	AUTO_FIT_MAX_SIZE,
	AUTO_FIT_MIN_SIZE,
	buildAutoFitKey,
} from "@/lib/suvichar/auto-fit";
import { validateTextStyleOverrides } from "@/lib/suvichar/validation";
import { ErrorFallback } from "./ErrorFallback";
import { useAutoFitFontSize } from "./useAutoFitFontSize";

interface SuvicharFitTextAreaProps {
	blocknoteJson: unknown;
	plainText?: string;
	textColor: string;
	textAlign: string;
	defaultFontSize?: number;
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
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [parseNotice, setParseNotice] = useState<string | null>(null);

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

	const textResolution = useMemo(
		() => resolveSuvicharPlainTextDetailed(blocknoteJson, plainText),
		[blocknoteJson, plainText],
	);

	const text = textResolution.text;

	useEffect(() => {
		if (textResolution.parseError && textResolution.text) {
			const preview =
				textResolution.text.length > 40
					? `${textResolution.text.slice(0, 40)}…`
					: textResolution.text;
			setParseNotice(
				`BlockNote JSON parse failed. Using fallback plain text: '${preview}'`,
			);
		} else {
			setParseNotice(null);
		}
	}, [textResolution]);

	useEffect(() => {
		const errors: string[] = [];

		if (!text || typeof text !== "string") {
			errors.push("Text cannot be empty");
		}

		const overrideValidation = validateTextStyleOverrides(style);
		if (!overrideValidation.valid) {
			errors.push(...overrideValidation.errors);
		}

		setValidationErrors(errors);
	}, [text, style]);

	const { boxWidth, boxHeight, contentWidth, contentHeight } = useMemo(
		() => computeTextBoxLayout(safeWidth, safeHeight, style),
		[safeWidth, safeHeight, style],
	);

	// fontScale is applied after auto-fit (display multiplier), not during measurement.
	// Padding and width/height scale only shrink the box around already-fitted text — they
	// must not trigger re-measure or the font size will incorrectly shrink.
	const fitKey = useMemo(
		() =>
			buildAutoFitKey({
				text,
				safeWidth,
				safeHeight,
				lineHeight: style.lineHeight,
				letterSpacing: style.letterSpacing,
				fontWeight: style.fontWeight,
				textAlign: style.textAlign,
				verticalAlign: style.verticalAlign,
			}),
		[
			text,
			safeWidth,
			safeHeight,
			style.lineHeight,
			style.letterSpacing,
			style.fontWeight,
			style.textAlign,
			style.verticalAlign,
		],
	);

	const measureMaxSize = useMemo(
		() => Math.min(AUTO_FIT_MAX_SIZE, Math.max(AUTO_FIT_MIN_SIZE, Math.floor(safeHeight))),
		[safeHeight],
	);

	const measureParagraphStyle: React.CSSProperties = useMemo(
		() => ({
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
		}),
		[
			style.textColor,
			style.textAlign,
			style.lineHeight,
			style.letterSpacing,
			style.fontWeight,
			textColor,
		],
	);

	const { containerRef, textRef, autoFitFontSize, autoFitState } = useAutoFitFontSize({
		text,
		fitKey,
		enabled: Boolean(text) && validationErrors.length === 0,
		maxSize: measureMaxSize,
		safeAreaHeight: safeHeight,
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

	const renderErrors = [
		...validationErrors,
		...(autoFitState.errorMessage ? [autoFitState.errorMessage] : []),
		...(parseNotice ? [parseNotice] : []),
	];

	if (validationErrors.length > 0) {
		return (
			<ErrorFallback
				errors={validationErrors}
				style={{ width: safeWidth, height: safeHeight }}
			/>
		);
	}

	if (!text) {
		return (
			<ErrorFallback
				errors={["Text cannot be empty"]}
				style={{ width: safeWidth, height: safeHeight }}
			/>
		);
	}

	return (
		<div
			className="suvichar-safe-text relative overflow-hidden font-devanagari"
			style={{
				width: safeWidth,
				height: safeHeight,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: verticalAlignToFlex[style.verticalAlign],
			}}
		>
			{/* Measure at full safe area — layout padding/scales must not change auto-fit. */}
			<div
				aria-hidden
				style={{
					position: "absolute",
					width: safeWidth,
					height: safeHeight,
					visibility: "hidden",
					pointerEvents: "none",
					overflow: "hidden",
				}}
			>
				<div
					ref={containerRef}
					className="suvichar-textfit"
					style={{
						width: safeWidth,
						height: safeHeight,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						overflow: "hidden",
					}}
				>
					<p
						ref={textRef}
						className={cn("suvichar-plain-text")}
						style={measureParagraphStyle}
						dir="auto"
					>
						{text}
					</p>
				</div>
			</div>
			{renderErrors.length > 0 && autoFitState.fallbackUsed && (
				<div
					style={{
						position: "absolute",
						top: 4,
						left: 4,
						right: 4,
						zIndex: 2,
						fontSize: 10,
						color: "#b45309",
						background: "rgba(255,251,235,0.92)",
						padding: "2px 4px",
						borderRadius: 4,
						lineHeight: 1.3,
					}}
				>
					{renderErrors[renderErrors.length - 1]}
				</div>
			)}
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
						className={cn("suvichar-plain-text")}
						style={paragraphStyle}
						dir="auto"
					>
						{text}
					</p>
				</div>
			</div>
		</div>
	);
}
