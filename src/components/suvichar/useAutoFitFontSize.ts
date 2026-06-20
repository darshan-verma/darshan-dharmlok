import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
	AUTO_FIT_MIN_SIZE,
	computeFallbackFontSize,
	measureFittingFontSize,
	type MeasureFittingFontSizeResult,
} from "@/lib/suvichar/auto-fit";

export interface UseAutoFitFontSizeOptions {
	text: string;
	fitKey: string;
	enabled?: boolean;
	maxSize?: number;
	safeAreaHeight?: number;
}

export interface AutoFitState {
	fontSize: number | null;
	timedOut: boolean;
	fitsAtMinSize: boolean;
	fallbackUsed: boolean;
	errorMessage: string | null;
}

export function useAutoFitFontSize({
	text,
	fitKey,
	enabled = true,
	maxSize,
	safeAreaHeight,
}: UseAutoFitFontSizeOptions) {
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLParagraphElement>(null);
	const [state, setState] = useState<AutoFitState>({
		fontSize: null,
		timedOut: false,
		fitsAtMinSize: true,
		fallbackUsed: false,
		errorMessage: null,
	});

	const applyResult = useCallback(
		(result: MeasureFittingFontSizeResult, fallbackSize: number) => {
			let errorMessage: string | null = null;
			let fontSize = result.fontSize;
			let fallbackUsed = false;

			if (result.timedOut) {
				errorMessage = `Text measurement timeout. Render at minSize ${AUTO_FIT_MIN_SIZE}px.`;
				fontSize = AUTO_FIT_MIN_SIZE;
				fallbackUsed = true;
			} else if (!result.fitsAtMinSize) {
				errorMessage = `Text cannot fit at minimum font size (${AUTO_FIT_MIN_SIZE}px). Reduce safe area padding or shorten text.`;
				fontSize = fallbackSize;
				fallbackUsed = true;
			}

			setState({
				fontSize,
				timedOut: result.timedOut,
				fitsAtMinSize: result.fitsAtMinSize,
				fallbackUsed,
				errorMessage,
			});
		},
		[],
	);

	const runMeasure = useCallback(() => {
		if (!enabled || !text) {
			setState({
				fontSize: null,
				timedOut: false,
				fitsAtMinSize: true,
				fallbackUsed: false,
				errorMessage: null,
			});
			return;
		}

		const container = containerRef.current;
		const textEl = textRef.current;
		if (!container || !textEl) return;

		try {
			const fallbackSize =
				safeAreaHeight != null
					? computeFallbackFontSize(safeAreaHeight)
					: AUTO_FIT_MIN_SIZE;

			const result = measureFittingFontSize(container, textEl, { maxSize });
			applyResult(result, fallbackSize);
		} catch (error) {
			const fallbackSize =
				safeAreaHeight != null
					? computeFallbackFontSize(safeAreaHeight)
					: AUTO_FIT_MIN_SIZE;
			setState({
				fontSize: fallbackSize,
				timedOut: false,
				fitsAtMinSize: false,
				fallbackUsed: true,
				errorMessage:
					error instanceof Error
						? error.message
						: "Text auto-fit measurement failed.",
			});
		}
	}, [applyResult, enabled, maxSize, safeAreaHeight, text]);

	useLayoutEffect(() => {
		runMeasure();

		const container = containerRef.current;
		if (!container || !enabled || !text) return;

		const observer = new ResizeObserver(() => {
			runMeasure();
		});
		observer.observe(container);

		return () => observer.disconnect();
	}, [fitKey, runMeasure, enabled, text]);

	return {
		containerRef,
		textRef,
		autoFitFontSize: state.fontSize,
		autoFitState: state,
	};
}
