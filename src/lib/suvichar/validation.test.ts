import { describe, expect, it } from "vitest";
import {
	validateScheduledDate,
	validateSuvicharFrame,
	validateSuvicharText,
	validateTextStyleOverrides,
} from "@/lib/suvichar/validation";

describe("validateSuvicharFrame", () => {
	it("accepts a valid frame", () => {
		const result = validateSuvicharFrame({
			safeAreaX: 120,
			safeAreaY: 220,
			safeAreaWidth: 840,
			safeAreaHeight: 560,
			defaultTextColor: "#1a1a1a",
			defaultFontSize: 32,
			width: 1080,
			height: 1080,
		});
		expect(result.valid).toBe(true);
	});

	it("rejects safe area exceeding canvas width", () => {
		const result = validateSuvicharFrame({
			safeAreaX: 120,
			safeAreaY: 220,
			safeAreaWidth: 1000,
			safeAreaHeight: 560,
			defaultTextColor: "#1a1a1a",
			defaultFontSize: 32,
			width: 1080,
			height: 1080,
		});
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("safeAreaX(120) + safeAreaWidth(1000) > 1080");
	});

	it("rejects low contrast text color", () => {
		const result = validateSuvicharFrame({
			safeAreaX: 120,
			safeAreaY: 220,
			safeAreaWidth: 840,
			safeAreaHeight: 560,
			defaultTextColor: "#FFFF00",
			defaultFontSize: 32,
			width: 1080,
			height: 1080,
		});
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("#FFFF00");
	});
});

describe("validateSuvicharText", () => {
	it("rejects empty text", () => {
		const result = validateSuvicharText({ plainText: "   " });
		expect(result.valid).toBe(false);
		expect(result.errors).toContain("Text cannot be empty");
	});
});

describe("validateTextStyleOverrides", () => {
	it("rejects fontScale outside ±50%", () => {
		const result = validateTextStyleOverrides({ fontScale: 0.4 });
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("fontScale");
	});
});

describe("validateScheduledDate", () => {
	it("rejects past dates", () => {
		const result = validateScheduledDate("2020-01-01");
		expect(result.valid).toBe(false);
		expect(result.errors[0]).toContain("Schedule date must be today or in future");
	});
});
