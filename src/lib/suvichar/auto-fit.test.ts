/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import {
	AUTO_FIT_MIN_SIZE,
	buildAutoFitKey,
	computeFallbackFontSize,
	measureFittingFontSize,
} from "@/lib/suvichar/auto-fit";

describe("measureFittingFontSize", () => {
	it("uses binary search to find the largest fitting size", () => {
		const container = document.createElement("div");
		const textEl = document.createElement("p");
		container.style.width = "200px";
		container.style.height = "200px";
		container.style.overflow = "hidden";
		textEl.textContent = "Short quote";
		container.appendChild(textEl);
		document.body.appendChild(container);

		Object.defineProperty(textEl, "scrollHeight", {
			configurable: true,
			get() {
				const size = parseFloat(textEl.style.fontSize || "0");
				return size > 80 ? 300 : 40;
			},
		});
		Object.defineProperty(textEl, "scrollWidth", {
			configurable: true,
			get() {
				return 40;
			},
		});

		const result = measureFittingFontSize(container, textEl, {
			minSize: 12,
			maxSize: 120,
			timeoutMs: 500,
		});

		expect(result.fontSize).toBeGreaterThanOrEqual(AUTO_FIT_MIN_SIZE);
		expect(result.timedOut).toBe(false);

		document.body.removeChild(container);
	});
});

describe("computeFallbackFontSize", () => {
	it("uses 40% of safe area height capped at max font size", () => {
		expect(computeFallbackFontSize(500)).toBe(180);
		expect(computeFallbackFontSize(100)).toBe(40);
	});
});

describe("buildAutoFitKey", () => {
	it("does not include layout-only overrides", () => {
		const base = buildAutoFitKey({
			text: "quote",
			safeWidth: 800,
			safeHeight: 600,
			lineHeight: 1.2,
			letterSpacing: 0,
			fontWeight: "normal",
			textAlign: "center",
			verticalAlign: "middle",
		});

		const withLayoutChange = buildAutoFitKey({
			text: "quote",
			safeWidth: 800,
			safeHeight: 600,
			lineHeight: 1.2,
			letterSpacing: 0,
			fontWeight: "normal",
			textAlign: "center",
			verticalAlign: "middle",
		});

		expect(base).toBe(withLayoutChange);
	});

	it("changes when text or safe area dimensions change", () => {
		const base = buildAutoFitKey({
			text: "quote",
			safeWidth: 800,
			safeHeight: 600,
			lineHeight: 1.2,
			letterSpacing: 0,
			fontWeight: "normal",
			textAlign: "center",
			verticalAlign: "middle",
		});

		expect(
			buildAutoFitKey({
				text: "longer quote",
				safeWidth: 800,
				safeHeight: 600,
				lineHeight: 1.2,
				letterSpacing: 0,
				fontWeight: "normal",
				textAlign: "center",
				verticalAlign: "middle",
			}),
		).not.toBe(base);
	});
});
