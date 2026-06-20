import { describe, expect, it } from "vitest";
import { getContrastRatio, meetsWcagAaContrast } from "@/lib/suvichar/contrast";

describe("getContrastRatio", () => {
	it("returns 21:1 for black on white", () => {
		expect(getContrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
	});

	it("fails WCAG AA for yellow on white", () => {
		expect(meetsWcagAaContrast("#FFFF00", "#FFFFFF")).toBe(false);
	});

	it("passes WCAG AA for dark gray on white", () => {
		expect(meetsWcagAaContrast("#1a1a1a", "#FFFFFF")).toBe(true);
	});
});
