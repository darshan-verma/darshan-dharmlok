export const AUTO_FIT_MIN_SIZE = 12;
export const AUTO_FIT_MAX_SIZE = 180;
export const AUTO_FIT_TIMEOUT_MS = 500;

export interface MeasureFittingFontSizeOptions {
	minSize?: number;
	maxSize?: number;
	timeoutMs?: number;
}

export interface MeasureFittingFontSizeResult {
	fontSize: number;
	timedOut: boolean;
	fitsAtMinSize: boolean;
}

function forceReflow(element: HTMLElement): void {
	void element.offsetHeight;
}

function textFits(container: HTMLElement, textEl: HTMLElement): boolean {
	forceReflow(container);
	return (
		textEl.scrollHeight <= container.clientHeight &&
		textEl.scrollWidth <= container.clientWidth
	);
}

function applyFontSize(textEl: HTMLElement, size: number): void {
	textEl.style.fontSize = `${size}px`;
}

function clearFontSize(textEl: HTMLElement): void {
	textEl.style.fontSize = "";
}

function computeMaxSize(containerHeight: number, maxSize: number): number {
	return Math.min(
		maxSize,
		Math.max(AUTO_FIT_MIN_SIZE, Math.floor(containerHeight)),
	);
}

/**
 * Binary-search auto-fit with timeout protection. O(log n) measurements.
 */
export function measureFittingFontSize(
	container: HTMLElement,
	textEl: HTMLElement,
	options: MeasureFittingFontSizeOptions = {},
): MeasureFittingFontSizeResult {
	const minSize = options.minSize ?? AUTO_FIT_MIN_SIZE;
	const timeoutMs = options.timeoutMs ?? AUTO_FIT_TIMEOUT_MS;
	const requestedMax = options.maxSize ?? AUTO_FIT_MAX_SIZE;
	const maxSize = computeMaxSize(container.clientHeight, requestedMax);
	const startedAt = performance.now();

	try {
		if (!textEl.textContent?.trim()) {
			return { fontSize: minSize, timedOut: false, fitsAtMinSize: true };
		}

		if (maxSize < minSize || container.clientHeight <= 0 || container.clientWidth <= 0) {
			return { fontSize: minSize, timedOut: false, fitsAtMinSize: false };
		}

		forceReflow(container);

		applyFontSize(textEl, maxSize);
		if (textFits(container, textEl)) {
			clearFontSize(textEl);
			return { fontSize: maxSize, timedOut: false, fitsAtMinSize: true };
		}

		let low = minSize;
		let high = maxSize;
		let bestFit = minSize;

		while (low <= high) {
			if (performance.now() - startedAt >= timeoutMs) {
				applyFontSize(textEl, minSize);
				const fitsAtMin = textFits(container, textEl);
				clearFontSize(textEl);
				return {
					fontSize: minSize,
					timedOut: true,
					fitsAtMinSize: fitsAtMin,
				};
			}

			const mid = Math.floor((low + high) / 2);
			applyFontSize(textEl, mid);

			if (textFits(container, textEl)) {
				bestFit = mid;
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}

		applyFontSize(textEl, bestFit);
		const fitsAtMinSize = bestFit > minSize || textFits(container, textEl);
		clearFontSize(textEl);

		return {
			fontSize: bestFit,
			timedOut: false,
			fitsAtMinSize,
		};
	} catch {
		clearFontSize(textEl);
		return { fontSize: minSize, timedOut: false, fitsAtMinSize: false };
	}
}

export function computeFallbackFontSize(safeAreaHeight: number): number {
	return Math.max(
		AUTO_FIT_MIN_SIZE,
		Math.min(AUTO_FIT_MAX_SIZE, Math.floor(safeAreaHeight * 0.4)),
	);
}

/** Inputs that affect auto-fit measurement — excludes layout-only overrides (padding, width/height scale, fontScale). */
export function buildAutoFitKey(input: {
	text: string;
	safeWidth: number;
	safeHeight: number;
	lineHeight: number;
	letterSpacing: number;
	fontWeight: string;
	textAlign: string;
	verticalAlign: string;
}): string {
	return [
		input.text,
		input.safeWidth,
		input.safeHeight,
		input.lineHeight,
		input.letterSpacing,
		input.fontWeight,
		input.textAlign,
		input.verticalAlign,
	].join("|");
}
