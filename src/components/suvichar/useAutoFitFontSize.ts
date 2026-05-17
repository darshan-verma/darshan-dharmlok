import { useCallback, useLayoutEffect, useRef, useState } from "react";

const START_FONT_SIZE = 180;

function computeMaxFontSize(containerHeight: number) {
	return Math.min(
		START_FONT_SIZE,
		Math.max(1, Math.floor(containerHeight)),
	);
}

function measureFittingFontSize(
	container: HTMLElement,
	textEl: HTMLElement,
): number {
	const maxSize = computeMaxFontSize(container.clientHeight);
	const minSize = 1;

	const fits = () =>
		textEl.scrollHeight <= container.clientHeight &&
		textEl.scrollWidth <= container.clientWidth;

	let size = maxSize;
	textEl.style.fontSize = `${size}px`;

	while (size > minSize && !fits()) {
		size -= 1;
		textEl.style.fontSize = `${size}px`;
	}

	textEl.style.fontSize = "";
	return size;
}

export interface UseAutoFitFontSizeOptions {
	text: string;
	fitKey: string;
	enabled?: boolean;
}

export function useAutoFitFontSize({
	text,
	fitKey,
	enabled = true,
}: UseAutoFitFontSizeOptions) {
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLParagraphElement>(null);
	const [autoFitFontSize, setAutoFitFontSize] = useState<number | null>(null);

	const runMeasure = useCallback(() => {
		if (!enabled || !text) {
			setAutoFitFontSize(null);
			return;
		}

		const container = containerRef.current;
		const textEl = textRef.current;
		if (!container || !textEl) return;

		setAutoFitFontSize(measureFittingFontSize(container, textEl));
	}, [enabled, text]);

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

	return { containerRef, textRef, autoFitFontSize };
}
